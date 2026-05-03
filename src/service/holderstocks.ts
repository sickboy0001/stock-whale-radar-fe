"use server";

import { db } from "@/db";
import { documents, ownershipReports, edinetCodes } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getBatchStockQuotes } from "@/service/yfinance-api";

export async function getHolderStocks(edinetCode: string) {
  if (!edinetCode) return null;

  // 1. 投資家情報の取得
  const holderInfo = await db
    .select()
    .from(edinetCodes)
    .where(eq(edinetCodes.edinetCode, edinetCode))
    .get();

  // 2. 投資履歴の取得
  const historyRaw = await db
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

  // 3. yfinance データの取得とマージ
  const uniqueSecCodes = Array.from(
    new Set(
      historyRaw
        .map((item) => item.secCode?.substring(0, 4))
        .filter((code): code is string => !!code),
    ),
  );

  const yfDataMap = await getBatchStockQuotes(uniqueSecCodes);

  const history = historyRaw.map((item) => {
    const pureSecCode = item.secCode?.substring(0, 4);
    const yfData = pureSecCode ? yfDataMap[pureSecCode] : null;

    // 保有株数と保有金額を計算
    const sharesOutstanding = yfData?.sharesOutstanding;
    const prevClose = yfData?.prevClose;
    const holdingRatio = item.holdingRatio;

    let holdingShares: number | null = null;
    let holdingValue: number | null = null;

    if (sharesOutstanding != null && holdingRatio != null) {
      holdingShares = sharesOutstanding * (holdingRatio / 100);
    }

    if (holdingShares != null && prevClose != null) {
      holdingValue = holdingShares * prevClose;
    }

    return {
      ...item,
      sharesOutstanding,
      prevClose,
      holdingShares,
      holdingValue,
    };
  });

  return {
    holderInfo,
    history,
  };
}
