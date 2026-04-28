"use server";

import { db } from "@/db";
import { importDailyStatus } from "@/db/schema";
import { and, gte, lte, asc } from "drizzle-orm";

/**
 * 2025 年の importDailyStatus データを確認する
 */
export async function check2025Data() {
  const startDate = "2025-01-01";
  const endDate = "2025-12-31";

  const results = await db
    .select({
      targetDate: importDailyStatus.targetDate,
      status: importDailyStatus.status,
      totalDocsCount: importDailyStatus.totalDocsCount,
      targetDocsCount: importDailyStatus.targetDocsCount,
      successCount: importDailyStatus.successCount,
      errorMessage: importDailyStatus.errorMessage,
    })
    .from(importDailyStatus)
    .where(
      and(
        gte(importDailyStatus.targetDate, startDate),
        lte(importDailyStatus.targetDate, endDate),
      ),
    )
    .orderBy(asc(importDailyStatus.targetDate));

  return {
    count: results.length,
    data: results,
  };
}
