import { db } from "@/db";
import { edinetCodes, fundCodes } from "@/db/schema";
import { like, or } from "drizzle-orm";

export type SearchResult = {
  type: "entity" | "fund";
  code: string;
  name: string;
  subName?: string;
  industryOrCategory?: string;
  secCode?: string;
  issuerName?: string;
};

export async function searchWhales(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const pattern = `%${query}%`;

  // 法人検索
  const entities = await db
    .select({
      code: edinetCodes.edinetCode,
      name: edinetCodes.submitterName,
      subName: edinetCodes.submitterNameEn,
      industry: edinetCodes.industry,
      secCode: edinetCodes.secCode,
    })
    .from(edinetCodes)
    .where(
      or(
        like(edinetCodes.submitterName, pattern),
        like(edinetCodes.submitterNameEn, pattern),
        like(edinetCodes.submitterNameKana, pattern),
        like(edinetCodes.secCode, pattern),
      ),
    )
    .limit(20);

  // ファンド検索
  let funds: {
    code: string;
    name: string;
    issuerName: string | null;
  }[] = [];
  try {
    funds = await db
      .select({
        code: fundCodes.fundCode,
        name: fundCodes.fundName,
        // category: fundCodes.category, // エラーの原因: no such column: category
        issuerName: fundCodes.issuerName,
      })
      .from(fundCodes)
      .where(
        or(
          like(fundCodes.fundName, pattern),
          like(fundCodes.fundNameKana, pattern),
          like(fundCodes.issuerName, pattern),
        ),
      )
      .limit(20);
  } catch (error) {
    console.error("Fund search failed (skipping):", error);
    // fund_codesテーブルがない、またはカラムが足りない場合は空配列のまま進む
  }

  const results: SearchResult[] = [
    ...entities.map((e) => ({
      type: "entity" as const,
      code: e.code,
      name: e.name,
      subName: e.subName ?? undefined,
      industryOrCategory: e.industry ?? undefined,
      secCode: e.secCode ? e.secCode.substring(0, 4) : undefined,
    })),
    ...funds.map((f) => ({
      type: "fund" as const,
      code: f.code,
      name: f.name,
      // industryOrCategory: f.category ?? undefined,
      issuerName: f.issuerName ?? undefined,
    })),
  ];

  return results;
}
