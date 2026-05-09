"use server";

import { db } from "@/db";
import { viewHistory, edinetCodes } from "@/db/schema";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { eq, and, gte, sql } from "drizzle-orm";

const GUEST_COOKIE_NAME = "radar_guest_id";
const GUEST_COOKIE_AGE = 60 * 60 * 24 * 365; // 1 年

export interface RecordHistoryParams {
  targetCode: string;
  targetType: "entity" | "fund" | "stock";
  userId?: string | null; // ログインユーザーの場合はこれを渡す
}

// データベースの CHECK 制約に適合する target_type のマッピング
const TARGET_TYPE_MAP: Record<
  "entity" | "fund" | "stock",
  "entity" | "fund" | "stock"
> = {
  entity: "entity",
  fund: "fund",
  stock: "stock",
};

/**
 * 閲覧履歴を記録する Server Action
 */
export async function recordViewHistory({
  targetCode,
  targetType,
  userId: providedUserId,
}: RecordHistoryParams): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    const userId = session?.user?.id || providedUserId;
    let guestId: string | null = null;

    if (!userId) {
      // 匿名ユーザーの場合は guest_id を取得または生成
      const cookieStore = await cookies();
      guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value ?? null;

      if (!guestId) {
        guestId = nanoid();
        // Server Action 内でも cookies().set() が使用可能
        cookieStore.set(GUEST_COOKIE_NAME, guestId, {
          maxAge: GUEST_COOKIE_AGE,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
      }
    }

    let finalTargetCode = targetCode;
    let finalTargetType = targetType;

    // entity (EDINETコード) の場合、または stock で targetCode が EDINETコードの場合、証券コードへの変換を試みる
    if (targetType === "entity" || targetType === "stock") {
      const edinetInfo = await db
        .select({ secCode: edinetCodes.secCode })
        .from(edinetCodes)
        .where(eq(edinetCodes.edinetCode, targetCode))
        .limit(1);

      if (edinetInfo[0]?.secCode) {
        // 証券コードがある場合は stock に変換
        const rawCode = edinetInfo[0].secCode;
        finalTargetCode =
          rawCode.length >= 4 ? rawCode.substring(0, 4) : rawCode;
        finalTargetType = "stock";
      }
    }

    // 直近 1 分以内に同じ記録がある場合はスキップ (重複防止)
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
      return { success: true };
    }

    // 新規記録を挿入 (viewed_at は TEXT 形式：YYYY-MM-DD HH:MM:SS.SSS)
    const now = new Date();
    const viewedAtStr = now.toISOString().replace("T", " ").slice(0, 23);

    // target_type をデータベース制約に適合するようにマッピング
    const dbTargetType = TARGET_TYPE_MAP[finalTargetType];

    await db.insert(viewHistory).values({
      userId: userId ?? null,
      guestId: guestId ?? null,
      targetType: dbTargetType,
      targetCode: finalTargetCode,
      viewedAt: viewedAtStr,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to record view history:", error);
    return { success: false, error: "Failed to save history" };
  }
}

/**
 * 3 ヶ月以上前の履歴データを削除する (定期タスク用)
 */
export async function cleanupOldHistory(): Promise<{
  success: boolean;
  deletedCount?: number;
}> {
  try {
    const threeMonthsAgo = sql`date('now', '-3 months')`;
    const result = await db
      .delete(viewHistory)
      .where(gte(sql`date(${viewHistory.viewedAt})`, threeMonthsAgo))
      .returning({ id: viewHistory.id });

    return { success: true, deletedCount: result.length };
  } catch (error) {
    console.error("Failed to cleanup old history:", error);
    return { success: false };
  }
}
