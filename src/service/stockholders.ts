"use server";

import { db } from "@/db";
import { documents, ownershipReports, edinetCodes } from "@/db/schema";
import { eq, or, desc, sql, type SQLWrapper } from "drizzle-orm";
import { getStockQuote, type StockQuote } from "@/service/yfinance-api";

export async function getStockholdersByStock(params: {
  edinetCode?: string;
  secCode?: string;
}) {
  const { edinetCode, secCode } = params;

  if (!edinetCode && !secCode) return null;

  // 1. 銘柄情報の取得 - 条件を動的に構築
  const stockInfoConditions: SQLWrapper[] = [];
  if (edinetCode) {
    stockInfoConditions.push(eq(edinetCodes.edinetCode, edinetCode));
  }
  if (secCode) {
    // 証券コードが4桁の場合は末尾に0を付与（DBは5桁のため）
    const dbSecCode = secCode.length === 4 ? `${secCode}0` : secCode;
    stockInfoConditions.push(eq(edinetCodes.secCode, dbSecCode));
  }

  const stockInfoResult =
    stockInfoConditions.length > 0
      ? await db
          .select()
          .from(edinetCodes)
          .where(or(...stockInfoConditions))
          .get()
      : null;

  // yfinance API から追加の銘柄情報を取得してマージ
  const stockInfo: (typeof edinetCodes.$inferSelect & StockQuote) | null =
    stockInfoResult ? { ...stockInfoResult } : null;
  if (stockInfo?.secCode) {
    // 証券コードは "72030" のようになっている場合があるため、最初の4桁を使用
    const pureSecCode = stockInfo.secCode.substring(0, 4);
    const yfData = await getStockQuote(pureSecCode);
    if (yfData) {
      Object.assign(stockInfo, yfData);
    }
  }

  // 2. 報告履歴の取得
  const targetEdinetCode = stockInfo?.edinetCode || edinetCode;
  const targetSecCode = stockInfo?.secCode || secCode;

  // 報告履歴の条件も動的に構築
  const historyConditions: SQLWrapper[] = [];
  if (targetEdinetCode) {
    historyConditions.push(eq(documents.issuerEdinetCode, targetEdinetCode));
  }
  if (targetSecCode) {
    const dbSecCode =
      targetSecCode.length === 4 ? `${targetSecCode}0` : targetSecCode;
    historyConditions.push(eq(documents.secCode, dbSecCode));
  }

  const history =
    historyConditions.length > 0
      ? await db
          .select({
            obligationDate: ownershipReports.obligationDate,
            submitterName: documents.submitterName,
            submitterEdinetCode: documents.submitterEdinetCode,
            holdingRatio: ownershipReports.holdingRatio,
            prevHoldingRatio: ownershipReports.prevHoldingRatio,
            ratioDiff: sql<
              number | null
            >`CASE WHEN ${ownershipReports.holdingRatio} IS NOT NULL AND ${ownershipReports.prevHoldingRatio} IS NOT NULL THEN ${ownershipReports.holdingRatio} - ${ownershipReports.prevHoldingRatio} ELSE NULL END`,
            holdingPurpose: ownershipReports.holdingPurpose,
            docDescription: documents.docDescription,
            docId: documents.docId,
          })
          .from(ownershipReports)
          .innerJoin(documents, eq(ownershipReports.docId, documents.docId))
          .where(or(...historyConditions))
          .orderBy(desc(ownershipReports.obligationDate))
      : [];

  return {
    stockInfo,
    history,
  };
}
