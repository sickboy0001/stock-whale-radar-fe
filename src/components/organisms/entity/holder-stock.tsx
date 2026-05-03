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
import { TrendingUp, TrendingDown, Briefcase } from "lucide-react";
import { toHalfWidth, formatWithUnit } from "@/lib/utils";
import Link from "next/link";

export type HistoryItem = {
  obligationDate: string | null;
  issuerName: string | null;
  secCode: string | null;
  issuerEdinetCode: string | null;
  holdingRatio: number | null;
  prevHoldingRatio: number | null;
  ratioDiff: number | null;
  holdingPurpose: string | null;
  docId: string | null;
  sharesOutstanding?: number | null;
  prevClose?: number | null;
};

interface HolderStockProps {
  history: HistoryItem[];
}

export function HolderStock({ history }: HolderStockProps) {
  // 現在の主要保有銘柄（各銘柄の最新報告）
  const currentPortfolio = React.useMemo(() => {
    const latestByIssuer = new Map<string, HistoryItem>();
    history.forEach((item) => {
      if (item.issuerEdinetCode && !latestByIssuer.has(item.issuerEdinetCode)) {
        latestByIssuer.set(item.issuerEdinetCode, item);
      }
    });
    // 保有金額（推定）が大きい順にソート
    return Array.from(latestByIssuer.values())
      .filter((item) => (item.holdingRatio || 0) > 0)
      .sort((a, b) => {
        const valA =
          (a.sharesOutstanding || 0) *
          ((a.holdingRatio || 0) / 100) *
          (a.prevClose || 0);
        const valB =
          (b.sharesOutstanding || 0) *
          ((b.holdingRatio || 0) / 100) *
          (b.prevClose || 0);
        return valB - valA;
      });
  }, [history]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-500" />
            現在の主要保有銘柄
          </CardTitle>
          <CardDescription>最新の報告に基づく保有銘柄一覧</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentPortfolio.length > 0 ? (
              currentPortfolio.map((item) => (
                <div
                  key={item.issuerEdinetCode}
                  className="flex flex-col border-b pb-2 last:border-0"
                >
                  <div className="flex justify-between items-start">
                    <Link
                      href={`/entity/stock/${item.issuerEdinetCode || ""}?stock_code=${item.secCode || ""}`}
                      className="font-bold text-sm text-blue-600 hover:underline break-all flex-1"
                    >
                      {item.secCode ? `[${item.secCode.substring(0, 4)}] ` : ""}
                      {toHalfWidth(item.issuerName || "")}
                    </Link>
                    <div className="flex flex-col items-end ml-2">
                      <span className="text-lg font-mono font-bold">
                        {item.holdingRatio?.toFixed(2)}%
                      </span>
                      {item.sharesOutstanding &&
                        item.holdingRatio &&
                        item.prevClose && (
                          <span className="text-[11px] text-emerald-600 font-bold whitespace-nowrap">
                            (
                            {formatWithUnit(
                              item.sharesOutstanding *
                                (item.holdingRatio / 100) *
                                item.prevClose,
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
                保有銘柄データがありません
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>投資行動履歴（全銘柄・時系列順）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">義務発生日</TableHead>
                <TableHead>銘柄名 (発行者)</TableHead>
                <TableHead className="w-[80px]">コード</TableHead>
                <TableHead className="text-right">今回割合</TableHead>
                <TableHead className="text-right">増減</TableHead>
                <TableHead>保有目的</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length > 0 ? (
                history.map((item, idx) => (
                  <TableRow key={`${item.docId}-${idx}`}>
                    <TableCell className="font-mono text-xs">
                      {item.obligationDate}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/entity/stock/${item.issuerEdinetCode || ""}?stock_code=${item.secCode || ""}`}
                        className="font-medium text-xs text-blue-600 hover:underline break-all"
                      >
                        {toHalfWidth(item.issuerName || "")}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.secCode?.substring(0, 4) || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs">
                      <div className="flex flex-col items-end">
                        <span>{item.holdingRatio?.toFixed(2)}%</span>
                        {item.sharesOutstanding &&
                          item.holdingRatio &&
                          item.prevClose && (
                            <span className="text-[10px] text-emerald-600 font-bold whitespace-nowrap font-sans">
                              {formatWithUnit(
                                item.sharesOutstanding *
                                  (item.holdingRatio / 100) *
                                  item.prevClose,
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
                      <span className="text-[11px] leading-tight break-all">
                        {item.holdingPurpose || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    投資履歴が見つかりませんでした。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
