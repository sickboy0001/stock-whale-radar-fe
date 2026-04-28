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
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Search } from "lucide-react";
import { toHalfWidth } from "@/lib/utils";
import Link from "next/link";

type StockInfo = {
  edinetCode: string;
  submitterName: string;
  secCode: string | null;
  industry: string | null;
};

type HistoryItem = {
  obligationDate: string | null;
  submitterName: string | null;
  submitterEdinetCode: string | null;
  holdingRatio: number | null;
  prevHoldingRatio: number | null;
  ratioDiff: number | null;
  holdingPurpose: string | null;
  docDescription: string | null;
  docId: string | null;
};

interface StockholdersPageProps {
  stockInfo: StockInfo | null;
  history: HistoryItem[];
}

export function StockholdersPage({
  stockInfo,
  history,
}: StockholdersPageProps) {
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
    return Array.from(latestBySubmitter.values());
  }, [history]);

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          銘柄別保有状況一覧
        </h1>
        {stockInfo ? (
          <div className="flex items-center gap-4 text-lg">
            <Badge variant="outline" className="text-lg px-3 py-1">
              {stockInfo.secCode?.substring(0, 4) || "----"}
            </Badge>
            <span className="font-bold text-2xl">
              {toHalfWidth(stockInfo.submitterName)}
            </span>
            <span className="text-muted-foreground text-sm">
              (EDINETコード: {stockInfo.edinetCode})
            </span>
          </div>
        ) : (
          <div className="text-muted-foreground">
            銘柄情報が見つかりませんでした。
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              保有者別サマリー
            </CardTitle>
            <CardDescription>各投資家の最新報告状況</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.length > 0 ? (
                summary.map((item) => (
                  <div
                    key={item.submitterEdinetCode}
                    className="flex flex-col border-b pb-2 last:border-0"
                  >
                    <Link
                      href={`/holderstocks/list?found_code=${item.submitterEdinetCode}`}
                      className="font-bold text-sm text-blue-600 hover:underline break-all"
                    >
                      {toHalfWidth(item.submitterName || "")}
                    </Link>
                    <div className="flex justify-between items-end mt-1">
                      <span className="text-lg font-mono font-bold">
                        {item.holdingRatio?.toFixed(2)}%
                      </span>
                      <div className="flex flex-col items-end">
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
                        <span className="text-[10px] text-muted-foreground">
                          {item.obligationDate}
                        </span>
                      </div>
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

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>報告履歴一覧（時系列）</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
                {history.length > 0 ? (
                  history.map((item, idx) => (
                    <TableRow key={`${item.docId}-${idx}`}>
                      <TableCell className="font-mono text-xs">
                        {item.obligationDate}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/holderstocks/list?found_code=${item.submitterEdinetCode}`}
                          className="font-medium text-xs text-blue-600 hover:underline break-all"
                        >
                          {toHalfWidth(item.submitterName || "")}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs">
                        {item.holdingRatio?.toFixed(2)}%
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
