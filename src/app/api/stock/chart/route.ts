import { NextRequest, NextResponse } from "next/server";
import { getChartData } from "@/service/yfinance-api";
import { db } from "@/db";
import { edinetCodes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const edinetCode = searchParams.get("edinet_code");
  const stockCode = searchParams.get("stock_code");

  let ticker = "";

  if (edinetCode) {
    const res = await db
      .select({ secCode: edinetCodes.secCode })
      .from(edinetCodes)
      .where(eq(edinetCodes.edinetCode, edinetCode))
      .limit(1);

    const secCode = res[0]?.secCode;
    if (secCode) ticker = secCode.substring(0, 4);
  } else if (stockCode) {
    ticker = stockCode.substring(0, 4);
  }

  if (!ticker) {
    return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
  }

  try {
    const data = await getChartData(ticker);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Chart Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 },
    );
  }
}
