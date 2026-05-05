import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/auth";
import { viewHistory, edinetCodes } from "@/db/schema";
import { nanoid } from "nanoid";
import { eq, and, gte, desc, or, sql } from "drizzle-orm";
import { getTrendingWhales, getPersonalHistory } from "@/service/view-history";

const GUEST_COOKIE_NAME = "radar_guest_id";
const GUEST_COOKIE_AGE = 60 * 60 * 24 * 365; // 1 年

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") as "24h" | "7d" | "30d") || "7d";
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const type = searchParams.get("type") || "all"; // 'trending' | 'personal' | 'all'

    const cookieHeader = req.headers.get("cookie");
    const cookieMatch = cookieHeader?.match(
      new RegExp(`(^| )${GUEST_COOKIE_NAME}=([^;]+)`),
    );
    const guestId = cookieMatch?.[2];
    const userId = session?.user?.id;

    const [trending, history] = await Promise.all([
      type === "all" || type === "trending"
        ? getTrendingWhales(period, limit)
        : Promise.resolve([]),
      type === "all" || type === "personal"
        ? getPersonalHistory({ userId, guestId, limit: 20 })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({ trending, history });
  } catch (error) {
    console.error("Failed to fetch history data:", error);
    return NextResponse.json(
      { error: "Failed to fetch history data" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const { targetCode, targetType, userId: bodyUserId } = await req.json();
    const userId = session?.user?.id || bodyUserId;

    if (!targetCode || !targetType) {
      return NextResponse.json(
        { error: "Missing required fields: targetCode, targetType" },
        { status: 400 },
      );
    }

    let guestId: string | null = null;

    // Cookie から guest_id を取得
    const cookieHeader = req.headers.get("cookie");
    const cookieMatch = cookieHeader?.match(
      new RegExp(`(^| )${GUEST_COOKIE_NAME}=([^;]+)`),
    );

    if (cookieMatch) {
      guestId = cookieMatch[2];
    }

    // guest_id がなければ生成
    if (!guestId && !userId) {
      guestId = nanoid();
    }

    if (!guestId && !userId) {
      return NextResponse.json(
        { error: "User identifier not found" },
        { status: 400 },
      );
    }

    let finalTargetCode = targetCode;
    let finalTargetType = targetType;

    // entity (EDINETコード) の場合、証券コードへの変換を試みる
    if (targetType === "entity") {
      const edinetInfo = await db
        .select({ secCode: edinetCodes.secCode })
        .from(edinetCodes)
        .where(eq(edinetCodes.edinetCode, targetCode))
        .limit(1);

      if (edinetInfo.length > 0 && edinetInfo[0].secCode) {
        // 証券コードがある場合は stock に変換
        // secCode は通常 5桁（例: 13760）なので、最初の 4桁を使用
        const rawCode = edinetInfo[0].secCode;
        finalTargetCode =
          rawCode.length >= 4 ? rawCode.substring(0, 4) : rawCode;
        finalTargetType = "stock";
      }
    }

    // 直近 1 分以内に同じ記録がある場合はスキップ
    const oneMinuteAgoStr = new Date(Date.now() - 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .slice(0, 23);
    const existing = await db
      .select({ id: viewHistory.id })
      .from(viewHistory)
      .where(
        and(
          userId
            ? eq(viewHistory.userId, userId)
            : eq(viewHistory.guestId, guestId || ""),
          eq(viewHistory.targetCode, finalTargetCode),
          eq(viewHistory.targetType, finalTargetType),
          gte(viewHistory.viewedAt, oneMinuteAgoStr),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // 既に記録がある場合は成功
      const response = NextResponse.json({ success: true });

      // 新規生成した場合は Cookie を設定
      if (guestId && !cookieMatch) {
        response.cookies.set(GUEST_COOKIE_NAME, guestId, {
          maxAge: GUEST_COOKIE_AGE,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
      }

      return response;
    }

    // 新規記録を挿入 (viewed_at は TEXT 形式: YYYY-MM-DD HH:MM:SS.SSS)
    const now = new Date();
    const viewedAtStr = now.toISOString().replace("T", " ").slice(0, 23);

    await db.insert(viewHistory).values({
      userId: userId ?? null,
      guestId: guestId ?? null,
      targetType: finalTargetType,
      targetCode: finalTargetCode,
      viewedAt: viewedAtStr,
    });

    const response = NextResponse.json({ success: true });

    // 新規生成した場合は Cookie を設定
    if (guestId && !cookieMatch) {
      response.cookies.set(GUEST_COOKIE_NAME, guestId, {
        maxAge: GUEST_COOKIE_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Failed to record view history:", error);
    return NextResponse.json(
      { error: "Failed to save history" },
      { status: 500 },
    );
  }
}
