import { db } from "@/db";
import { viewHistory } from "@/db/schema";
import { desc, sql, and, eq, gte } from "drizzle-orm";
import { edinetCodes } from "@/db/schema";
import { fundCodes } from "@/db/schema";

export interface GetHistoryParams {
  userId?: string | null;
  guestId?: string | null;
  limit?: number;
}

export interface HistoryItem {
  id: number;
  userId: string | null;
  guestId: string | null;
  targetType: "entity" | "fund";
  targetCode: string;
  viewedAt: string; // TEXT 形式：YYYY-MM-DD HH:MM:SS.SSS
  name?: string; // 企業名またはファンド名
}

export interface TrendingItem {
  targetCode: string;
  targetType: "entity" | "fund";
  viewCount: number;
  latestView: string; // TEXT 形式：YYYY-MM-DD HH:MM:SS.SSS
  name?: string; // 企業名またはファンド名
}

/**
 * 個人の閲覧履歴を取得 (最新 N 件)
 * 重複を除去し、最新の日付でグループ化
 */
export async function getPersonalHistory({
  userId,
  guestId,
  limit = 10,
}: GetHistoryParams): Promise<HistoryItem[]> {
  if (!userId && !guestId) {
    return [];
  }

  // 個人履歴の取得 (重複を除去し、最新の日付でソート)
  const history = await db
    .select()
    .from(viewHistory)
    .where(
      and(
        userId ? eq(viewHistory.userId, userId) : undefined,
        guestId ? eq(viewHistory.guestId, guestId) : undefined,
      ),
    )
    .orderBy(desc(viewHistory.viewedAt))
    .limit(limit * 2); // 重複を考慮して多めに取得

  // 重複を除去 (targetType + targetCode で最新の 1 つだけ残す)
  const uniqueMap = new Map<string, (typeof history)[0]>();
  for (const item of history) {
    const key = `${item.targetType}-${item.targetCode}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }

  const uniqueHistory = Array.from(uniqueMap.values()).slice(0, limit);

  // 名前を取得するために JOIN
  const result: HistoryItem[] = [];
  for (const item of uniqueHistory) {
    let name: string | undefined;
    if (item.targetType === "entity") {
      const entity = await db
        .select({ submitterName: edinetCodes.submitterName })
        .from(edinetCodes)
        .where(eq(edinetCodes.edinetCode, item.targetCode))
        .limit(1);
      name = entity[0]?.submitterName;
    } else if (item.targetType === "fund") {
      const fund = await db
        .select({ fundName: fundCodes.fundName })
        .from(fundCodes)
        .where(eq(fundCodes.fundCode, item.targetCode))
        .limit(1);
      name = fund[0]?.fundName;
    }

    result.push({
      ...item,
      name: name || item.targetCode,
    });
  }

  return result;
}

/**
 * 注目ランキング (頻度ベース) を取得
 * @param period '1w' | '1m' | '3m'
 */
export async function getTrendingWhales(
  period: "1w" | "1m" | "3m",
  limit: number = 10,
): Promise<TrendingItem[]> {
  const days = period === "1w" ? 7 : period === "1m" ? 30 : 90;

  // SQLite の日付計算を使用して期間を絞り込み
  const startDate = sql`date('now', '-${days} days')`;

  // 集計クエリ
  const aggregated = await db
    .select({
      targetCode: viewHistory.targetCode,
      targetType: viewHistory.targetType,
      viewCount: sql<number>`COUNT(*)`.as("view_count"),
      latestView: sql<string>`MAX(${viewHistory.viewedAt})`.as("latest_view"),
    })
    .from(viewHistory)
    .where(gte(sql`date(${viewHistory.viewedAt})`, startDate))
    .groupBy(viewHistory.targetCode, viewHistory.targetType)
    .orderBy(desc(sql`view_count`))
    .limit(limit);

  // 名前を取得するために JOIN
  const result: TrendingItem[] = [];
  for (const item of aggregated) {
    let name: string | undefined;
    if (item.targetType === "entity") {
      const entity = await db
        .select({ submitterName: edinetCodes.submitterName })
        .from(edinetCodes)
        .where(eq(edinetCodes.edinetCode, item.targetCode))
        .limit(1);
      name = entity[0]?.submitterName;
    } else if (item.targetType === "fund") {
      const fund = await db
        .select({ fundName: fundCodes.fundName })
        .from(fundCodes)
        .where(eq(fundCodes.fundCode, item.targetCode))
        .limit(1);
      name = fund[0]?.fundName;
    }

    result.push({
      ...item,
      name: name || item.targetCode,
    });
  }

  return result;
}

/**
 * 相対時間形式で表示するためのヘルパー関数
 */
export function getRelativeTime(viewedAt: string): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(viewedAt).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}週間前`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `${months}ヶ月前`;
  }
}
