"use server";

import { db } from "@/db";
import { documents, ownershipReports, edinetCodes } from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";

export async function getHolderStocks(edinetCode: string) {
  if (!edinetCode) return null;

  // 1. 投資家情報の取得
  const holderInfo = await db
    .select()
    .from(edinetCodes)
    .where(eq(edinetCodes.edinetCode, edinetCode))
    .get();

  // 2. 投資履歴の取得
  const history = await db
    .select({
      obligationDate: ownershipReports.obligationDate,
      issuerName: documents.issuerName,
      secCode: documents.secCode,
      issuerEdinetCode: documents.issuerEdinetCode,
      holdingRatio: ownershipReports.holdingRatio,
      prevHoldingRatio: ownershipReports.prevHoldingRatio,
      ratioDiff: sql<
        number | null
      >`CASE WHEN ${ownershipReports.holdingRatio} IS NOT NULL AND ${ownershipReports.prevHoldingRatio} IS NOT NULL THEN ${ownershipReports.holdingRatio} - ${ownershipReports.prevHoldingRatio} ELSE NULL END`,
      holdingPurpose: ownershipReports.holdingPurpose,
      docId: documents.docId,
    })
    .from(ownershipReports)
    .innerJoin(documents, eq(ownershipReports.docId, documents.docId))
    .where(eq(documents.submitterEdinetCode, edinetCode))
    .orderBy(desc(ownershipReports.obligationDate));

  return {
    holderInfo,
    history,
  };
}
