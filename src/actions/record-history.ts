"use server";

import { db } from "@/db";
import { viewHistory } from "@/db/schema";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { eq, and, gte, sql } from "drizzle-orm";

const GUEST_COOKIE_NAME = "radar_guest_id";
const GUEST_COOKIE_AGE = 60 * 60 * 24 * 365; // 1 年

export interface RecordHistoryParams {
  targetCode: string;
  targetType: "entity" | "fund";
  userId?: string | null; // ログインユーザーの場合はこれを渡す
}

/**
 * 閲覧履歴を記録する Server Action
 */
export async function recordViewHistory({
  targetCode,
  targetType,
  userId,
}: RecordHistoryParams): Promise<{ success: boolean; error?: string }> {
  try {
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
          eq(viewHistory.targetCode, targetCode),
          eq(viewHistory.targetType, targetType),
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
    await db.insert(viewHistory).values({
      userId: userId ?? null,
      guestId: guestId ?? null,
      targetType,
      targetCode,
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
