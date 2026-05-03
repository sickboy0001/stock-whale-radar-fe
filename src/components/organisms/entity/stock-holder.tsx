"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, TrendingUp, TrendingDown } from "lucide-react";
import { toHalfWidth, formatWithUnit } from "@/lib/utils";
import Link from "next/link";
import { HistoryItem, StockInfo } from "@/type/stock";
import { getStockholdersByStock } from "@/service/stockholders";
import { OwnershipStackedChart } from "@/components/charts/OwnershipStackedChart";

interface StockHolderProps {
  stockInfo: StockInfo | null;
  edinetCode?: string | null;
}

export function StockHolder({ stockInfo, edinetCode }: StockHolderProps) {
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchHistory = async () => {
      if (!edinetCode && !stockInfo?.secCode) return;

      setLoading(true);
      try {
        const data = await getStockholdersByStock({
          edinetCode: edinetCode || undefined,
          secCode: stockInfo?.secCode || undefined,
        });
        if (data) {
          setHistory(data.history);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [edinetCode, stockInfo?.secCode]);

  // 投資家別サマリー（最新の保有状況）
  const summary = React.useMemo(() => {
    const latestBySubmitter = new Map<string, HistoryItem>();
    history.forEach((item) => {
      if (
        item.submitterEdinetCode &&
        !latestBySubmitter.has(item.submitterEdinetCode)
      ) {
        latestBySubmitter.set(item.submitterEdinetCode, item);
      }
    });
    return Array.from(latestBySubmitter.values()).sort(
      (a, b) => (b.holdingRatio || 0) - (a.holdingRatio || 0),
    );
  }, [history]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            大量保有者の推移（過去1年間）
          </CardTitle>
          <CardDescription>
            直近1年間の主要株主による保有比率の積み上げ推移です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!loading && history.length > 0 && (
            <div className="mb-8 border-b pb-6">
              <OwnershipStackedChart history={history} />
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            保有者別サマリー
          </CardTitle>
          <CardDescription>各投資家の最新報告状況</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">
                読み込み中...
              </div>
            ) : summary.length > 0 ? (
              summary.map((item) => (
                <div
                  key={item.submitterEdinetCode}
                  className="flex flex-col border-b pb-2 last:border-0"
                >
                  <div className="flex justify-between items-start">
                    <Link
                      href={`/entity/holder/${item.submitterEdinetCode}`}
                      className="font-bold text-sm text-blue-600 hover:underline break-all flex-1"
                    >
                      {toHalfWidth(item.submitterName || "")}
                    </Link>
                    <div className="flex flex-col items-end ml-2">
                      <span className="text-lg font-mono font-bold">
                        {item.holdingRatio?.toFixed(2)}%
                      </span>
                      {stockInfo?.sharesOutstanding &&
                        item.holdingRatio &&
                        stockInfo?.prevClose && (
                          <span className="text-[11px] text-emerald-600 font-bold whitespace-nowrap">
                            (
                            {formatWithUnit(
                              stockInfo.sharesOutstanding *
                                (item.holdingRatio / 100) *
                                stockInfo.prevClose,
                              "円",
                            )}
                            )
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-muted-foreground italic">
                      直近: {item.obligationDate}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        item.ratioDiff !== null && item.ratioDiff > 0
                          ? "text-rose-600"
                          : item.ratioDiff !== null && item.ratioDiff < 0
                            ? "text-blue-600"
                            : "text-zinc-500"
                      }`}
                    >
                      {item.ratioDiff !== null
                        ? (item.ratioDiff > 0 ? "+" : "") +
                          item.ratioDiff.toFixed(2) +
                          "%"
                        : "-"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground italic">
                データがありません
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>報告履歴一覧（時系列）</CardTitle>
          <CardDescription>
            大量保有報告書に基づく保有比率の推移
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">義務発生日</TableHead>
                  <TableHead>投資家名</TableHead>
                  <TableHead className="text-right">保有割合</TableHead>
                  <TableHead className="text-right">前回比</TableHead>
                  <TableHead>保有目的 / 書類種別</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-muted-foreground animate-pulse"
                    >
                      読み込み中...
                    </TableCell>
                  </TableRow>
                ) : history.length > 0 ? (
                  history.map((item, idx) => (
                    <TableRow key={`${item.docId}-${idx}`}>
                      <TableCell className="font-mono text-xs">
                        {item.obligationDate}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/entity/holder/${item.submitterEdinetCode}`}
                          className="font-medium text-xs text-blue-600 hover:underline break-all"
                        >
                          {toHalfWidth(item.submitterName || "")}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs">
                        <div className="flex flex-col items-end">
                          <span>{item.holdingRatio?.toFixed(2)}%</span>
                          {stockInfo?.sharesOutstanding &&
                            item.holdingRatio &&
                            stockInfo?.prevClose && (
                              <span className="text-[10px] text-emerald-600 font-bold whitespace-nowrap font-sans">
                                {formatWithUnit(
                                  stockInfo.sharesOutstanding *
                                    (item.holdingRatio / 100) *
                                    stockInfo.prevClose,
                                  "円",
                                )}
                              </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono text-xs ${
                          item.ratioDiff !== null && item.ratioDiff > 0
                            ? "text-rose-600"
                            : item.ratioDiff !== null && item.ratioDiff < 0
                              ? "text-blue-600"
                              : "text-zinc-500"
                        }`}
                      >
                        <div className="flex items-center justify-end gap-0.5">
                          {item.ratioDiff !== null && item.ratioDiff > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : item.ratioDiff !== null && item.ratioDiff < 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : null}
                          {item.ratioDiff !== null
                            ? (item.ratioDiff > 0 ? "+" : "") +
                              item.ratioDiff.toFixed(2) +
                              "%"
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] leading-tight break-all">
                            {item.holdingPurpose || "-"}
                          </span>
                          <span className="text-[10px] text-muted-foreground italic">
                            {item.docDescription}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-muted-foreground"
                    >
                      報告履歴が見つかりませんでした。
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
