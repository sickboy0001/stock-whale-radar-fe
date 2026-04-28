"use server";

import { db } from "@/db";
import { importDailyStatus, documents, ownershipReports } from "@/db/schema";
import { and, gte, lte, asc, eq, desc, sql } from "drizzle-orm";

export async function getDailyImportStatus(year: number) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // デバッグ：クエリ前にパラメータをログ出力
  console.log(
    `[getDailyImportStatus] year=${year}, startDate=${startDate}, endDate=${endDate}`,
  );

  const results = await db
    .select()
    .from(importDailyStatus)
    .where(
      and(
        gte(importDailyStatus.targetDate, startDate),
        lte(importDailyStatus.targetDate, endDate),
      ),
    )
    .orderBy(asc(importDailyStatus.targetDate));

  console.log(`[getDailyImportStatus] results count=${results.length}`);

  return results;
}

/**
 * デバッグ用：2025 年の全データを取得
 */
export async function debugGet2025Data() {
  const results = await db
    .select()
    .from(importDailyStatus)
    .where(sql`target_date LIKE '2025%'`)
    .orderBy(asc(importDailyStatus.targetDate));

  return {
    count: results.length,
    sample: results.slice(0, 5),
  };
}

export async function getImportDetailByDate(targetDate: string) {
  const results = await db
    .select({
      docId: documents.docId,
      submitDatetime: documents.submitDatetime,
      submitterName: documents.submitterName,
      submitterEdinetCode: documents.submitterEdinetCode,
      issuerName: documents.issuerName,
      issuerEdinetCode: documents.issuerEdinetCode,
      secCode: documents.secCode,
      obligationDate: ownershipReports.obligationDate,
      holdingRatio: ownershipReports.holdingRatio,
      prevHoldingRatio: ownershipReports.prevHoldingRatio,
      ratioDiff: sql<
        number | null
      >`CASE WHEN ${ownershipReports.holdingRatio} IS NOT NULL AND ${ownershipReports.prevHoldingRatio} IS NOT NULL THEN ${ownershipReports.holdingRatio} - ${ownershipReports.prevHoldingRatio} ELSE NULL END`,
    })
    .from(documents)
    .leftJoin(ownershipReports, eq(documents.docId, ownershipReports.docId))
    .where(
      and(
        sql`date(${documents.submitDatetime}) = ${targetDate}`,
        eq(documents.docTypeCode, "350"),
      ),
    )
    .orderBy(desc(documents.submitDatetime));

  return results;
}
