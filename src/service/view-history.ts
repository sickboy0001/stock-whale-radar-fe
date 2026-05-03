import { db } from "@/db";
import { viewHistory } from "@/db/schema";
import { desc, sql, and, eq, or } from "drizzle-orm";
import { edinetCodes } from "@/db/schema";
import { fundCodes } from "@/db/schema";

export interface GetHistoryParams {
  userId?: string | null;
  guestId?: string | null;
  limit?: number;
  targetType?: "entity" | "fund" | "stock";
}

export interface HistoryItem {
  targetType: "entity" | "fund" | "stock";
  targetCode: string;
  viewedAt: string; // TEXT 形式：YYYY-MM-DD HH:MM:SS.SSS
  name?: string; // 企業名またはファンド名
}

export interface TrendingItem {
  targetCode: string;
  targetType: "entity" | "fund" | "stock";
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
  limit = 20,
  targetType,
}: GetHistoryParams): Promise<HistoryItem[]> {
  if (!userId && !guestId) {
    return [];
  }

  // 個人履歴の取得 (重複を除去し、最新の日付でソート)
  const history = await db
    .select({
      targetType: viewHistory.targetType,
      targetCode: viewHistory.targetCode,
      viewedAt: sql<string>`MAX(${viewHistory.viewedAt})`.as("last_viewed"),
    })
    .from(viewHistory)
    .where(
      and(
        or(
          userId ? eq(viewHistory.userId, userId) : undefined,
          guestId ? eq(viewHistory.guestId, guestId) : undefined,
        ),
        targetType ? eq(viewHistory.targetType, targetType) : undefined,
      ),
    )
    .groupBy(viewHistory.targetType, viewHistory.targetCode)
    .orderBy(desc(sql`last_viewed`))
    .limit(limit);

  // 名前を取得するために JOIN
  const result: HistoryItem[] = [];
  for (const item of history) {
    let name: string | undefined;
    let inferredType: "entity" | "fund" | "stock" = item.targetType as
      | "entity"
      | "fund"
      | "stock";

    if (item.targetType === "entity" || item.targetType === "stock") {
      const entity = await db
        .select({
          submitterName: edinetCodes.submitterName,
          secCode: edinetCodes.secCode,
        })
        .from(edinetCodes)
        .where(eq(edinetCodes.edinetCode, item.targetCode))
        .limit(1);

      if (entity[0]) {
        name = entity[0].submitterName;
        // secCode があれば、それは「銘柄」として扱える (既存データの entity 救済)
        if (entity[0].secCode) {
          inferredType = "stock";
        } else {
          inferredType = "entity";
        }
      }
    } else if (item.targetType === "fund") {
      const fund = await db
        .select({ fundName: fundCodes.fundName })
        .from(fundCodes)
        .where(eq(fundCodes.fundCode, item.targetCode))
        .limit(1);
      name = fund[0]?.fundName;
    }

    result.push({
      targetType: inferredType,
      targetCode: item.targetCode,
      viewedAt: item.viewedAt,
      name: name || item.targetCode,
    });
  }

  return result;
}

/**
 * 注目ランキング (頻度ベース) を取得
 * @param period '24h' | '7d' | '30d'
 */
export async function getTrendingWhales(
  period: "24h" | "7d" | "30d",
  limit: number = 10,
  targetType?: "entity" | "fund" | "stock",
): Promise<TrendingItem[]> {
  const intervalMap = { "24h": "-1 day", "7d": "-7 days", "30d": "-30 days" };
  const interval = intervalMap[period];

  // 集計クエリ
  const aggregated = await db
    .select({
      targetCode: viewHistory.targetCode,
      targetType: viewHistory.targetType,
      viewCount: sql<number>`COUNT(*)`.as("view_count"),
      latestView: sql<string>`MAX(${viewHistory.viewedAt})`.as("latest_view"),
    })
    .from(viewHistory)
    .where(
      and(
        sql`${viewHistory.viewedAt} >= datetime('now', ${interval})`,
        targetType ? eq(viewHistory.targetType, targetType) : undefined,
      ),
    )
    .groupBy(viewHistory.targetCode, viewHistory.targetType)
    .orderBy(desc(sql`view_count`))
    .limit(limit);

  // 名前を取得するために JOIN
  const result: TrendingItem[] = [];
  for (const item of aggregated) {
    let name: string | undefined;
    let inferredType: "entity" | "fund" | "stock" = item.targetType as
      | "entity"
      | "fund"
      | "stock";

    if (item.targetType === "entity" || item.targetType === "stock") {
      const entity = await db
        .select({
          submitterName: edinetCodes.submitterName,
          secCode: edinetCodes.secCode,
        })
        .from(edinetCodes)
        .where(eq(edinetCodes.edinetCode, item.targetCode))
        .limit(1);

      if (entity[0]) {
        name = entity[0].submitterName;
        if (entity[0].secCode) {
          inferredType = "stock";
        } else {
          inferredType = "entity";
        }
      }
    } else if (item.targetType === "fund") {
      const fund = await db
        .select({ fundName: fundCodes.fundName })
        .from(fundCodes)
        .where(eq(fundCodes.fundCode, item.targetCode))
        .limit(1);
      name = fund[0]?.fundName;
    }

    result.push({
      targetCode: item.targetCode,
      targetType: inferredType,
      viewCount: item.viewCount,
      latestView: item.latestView,
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
