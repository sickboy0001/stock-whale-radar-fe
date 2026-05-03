import { db } from "@/db";
import { edinetCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getChartData } from "@/service/yfinance-api";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockChart } from "@/components/chart/StockChart";

export default async function ChartPage({
  searchParams,
}: {
  searchParams: Promise<{ edinet_code?: string; stock_code?: string }>;
}) {
  const { edinet_code, stock_code } = await searchParams;
  let ticker = "";

  if (edinet_code) {
    const res = await db
      .select({ secCode: edinetCodes.secCode })
      .from(edinetCodes)
      .where(eq(edinetCodes.edinetCode, edinet_code))
      .limit(1);

    const secCode = res[0]?.secCode;
    // 証券コードは5桁(末尾0)の場合があるので、4桁にする
    if (secCode) ticker = secCode.substring(0, 4);
  } else if (stock_code) {
    ticker = stock_code.substring(0, 4);
  }

  if (!ticker) return notFound();

  const chartData = await getChartData(ticker);

  return (
    <div className="container mx-auto p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">株価チャート (直近30日)</h1>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-zinc-800 rounded-lg font-mono text-sm">
            {ticker}.T
          </span>
        </div>
      </div>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-400">日足ローソク足</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <StockChart data={chartData} />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-zinc-500">
              データの取得に失敗したか、データが存在しません。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
