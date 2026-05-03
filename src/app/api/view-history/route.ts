import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { viewHistory } from "@/db/schema";
import { nanoid } from "nanoid";
import { eq, and, gte } from "drizzle-orm";
import { getTrendingWhales } from "@/service/view-history";

const GUEST_COOKIE_NAME = "radar_guest_id";
const GUEST_COOKIE_AGE = 60 * 60 * 24 * 365; // 1 年

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") as "24h" | "7d" | "30d") || "7d";
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const targetType = searchParams.get("targetType") as
      | "entity"
      | "fund"
      | "stock"
      | null;

    const trending = await getTrendingWhales(
      period,
      limit,
      targetType || undefined,
    );

    return NextResponse.json({ trending });
  } catch (error) {
    console.error("Failed to fetch trending data:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending data" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { targetCode, targetType, userId } = await req.json();

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
          eq(viewHistory.targetCode, targetCode),
          eq(viewHistory.targetType, targetType),
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
      targetType,
      targetCode,
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
