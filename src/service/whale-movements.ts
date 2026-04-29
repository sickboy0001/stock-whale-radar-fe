import { db } from "@/db";
import { ownershipReports, documents, edinetCodes } from "@/db/schema";
import { eq, gte, lte, and, desc, aliasedTable } from "drizzle-orm";
import { getBatchStockQuotes } from "@/service/yfinance-api";

export async function getRecentWhaleMovements(
  baseDate?: string,
  periodDays: number = 30,
) {
  const referenceDate = baseDate ? new Date(baseDate) : new Date();
  const startDate = new Date(referenceDate);
  startDate.setDate(startDate.getDate() - periodDays);

  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = referenceDate.toISOString().split("T")[0];

  const submitterInfo = aliasedTable(edinetCodes, "submitter_info");

  const reports = await db
    .select({
      secCode: documents.secCode,
      issuerName: documents.issuerName,
      submitterName: documents.submitterName,
      submitterEdinetCode: documents.submitterEdinetCode,
      submitterSecCode: submitterInfo.secCode,
      issuerEdinetCode: documents.issuerEdinetCode,
      obligationDate: ownershipReports.obligationDate,
      submitDatetime: documents.submitDatetime,
      holdingRatio: ownershipReports.holdingRatio,
      prevHoldingRatio: ownershipReports.prevHoldingRatio,
      holdingPurpose: ownershipReports.holdingPurpose,
      docId: documents.docId,
    })
    .from(ownershipReports)
    .innerJoin(documents, eq(ownershipReports.docId, documents.docId))
    .leftJoin(
      submitterInfo,
      eq(documents.submitterEdinetCode, submitterInfo.edinetCode),
    )
    .where(
      and(
        gte(ownershipReports.obligationDate, startDateStr),
        lte(ownershipReports.obligationDate, endDateStr),
      ),
    )
    .orderBy(desc(ownershipReports.obligationDate));

  // 証券コードのユニークなリストを作成（4桁）
  const uniqueSecCodes = Array.from(
    new Set(
      reports
        .map((r) => r.secCode?.substring(0, 4))
        .filter((code): code is string => !!code),
    ),
  );

  // yfinance データを一括取得
  const yfDataMap = await getBatchStockQuotes(uniqueSecCodes);

  const movements = reports.map((r) => {
    const pureSecCode = r.secCode?.substring(0, 4);
    const yfData = pureSecCode ? yfDataMap[pureSecCode] : null;
    const marketCap = yfData?.marketCap || 0;
    const ratioDiff = (r.holdingRatio || 0) - (r.prevHoldingRatio || 0);
    const movementValue = marketCap * (ratioDiff / 100);

    return {
      ...r,
      ratioDiff,
      movementValue,
      marketCap,
      lastPrice: yfData?.lastPrice,
    };
  });

  // 各カテゴリの上位を取得
  const all = [...movements]
    .sort((a, b) => Math.abs(b.movementValue) - Math.abs(a.movementValue))
    .slice(0, 50);

  const increases = movements
    .filter((m) => m.ratioDiff > 0)
    .sort((a, b) => b.movementValue - a.movementValue)
    .slice(0, 50);

  const decreases = movements
    .filter((m) => m.ratioDiff < 0)
    .sort((a, b) => a.movementValue - b.movementValue)
    .slice(0, 50);

  return {
    all,
    increases,
    decreases,
  };
}
