"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Database, X, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { toHalfWidth } from "@/lib/utils";
import Link from "next/link";
import { getImportDetailByDate } from "@/service/daily-import";

export type ImportDetail = {
  docId: string;
  submitDatetime: string | null;
  submitterName: string | null;
  submitterEdinetCode: string | null;
  issuerName: string | null;
  issuerEdinetCode: string | null;
  secCode: string | null;
  obligationDate: string | null;
  holdingRatio: number | null;
  prevHoldingRatio: number | null;
  ratioDiff: number | null;
};

interface DailyImportDetailProps {
  date: string;
  onClose: () => void;
}

export function DailyImportDetail({ date, onClose }: DailyImportDetailProps) {
  const [details, setDetails] = useState<ImportDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const data = await getImportDetailByDate(date);
        setDetails(data as ImportDetail[]);
      } catch (error) {
        console.error("Failed to fetch import details:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [date]);
  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-lg border-2">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/20 pb-4">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-500" />
          <CardTitle className="text-base sm:text-xl font-bold">
            {date} のインポート詳細
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-muted"
        >
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-lg">データを読み込んでいます...</p>
          </div>
        ) : details.length > 0 ? (
          <div className="w-full border-t sm:border rounded-lg overflow-hidden bg-background">
            <Table className="table-fixed w-full border-collapse">
              <TableHeader className="bg-muted/80">
                <TableRow>
                  <TableHead className="w-[100px] px-3 py-4 text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                    提出日時
                  </TableHead>
                  <TableHead className="w-[240px] px-3 py-4 text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                    提出者
                  </TableHead>
                  <TableHead className="w-[220px] px-3 py-4 text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                    発行者 (対象)
                  </TableHead>
                  <TableHead className="w-[100px] px-3 py-4 text-[13px] font-bold text-zinc-900 dark:text-zinc-100 text-center">
                    発生日
                  </TableHead>
                  <TableHead className="w-[80px] px-2 py-4 text-[13px] font-bold text-zinc-900 dark:text-zinc-100 text-right">
                    保有
                  </TableHead>
                  <TableHead className="w-[80px] px-2 py-4 text-[13px] font-bold text-zinc-900 dark:text-zinc-100 text-right">
                    前回
                  </TableHead>
                  <TableHead className="w-[85px] px-2 py-4 text-[13px] font-bold text-zinc-900 dark:text-zinc-100 text-right">
                    増減
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.map((detail) => (
                  <TableRow
                    key={detail.docId}
                    className="hover:bg-muted/40 transition-colors border-b"
                  >
                    <TableCell className="p-3 vertical-top">
                      <div className="text-[12px] leading-tight text-muted-foreground font-mono whitespace-normal break-all">
                        {detail.submitDatetime
                          ?.replace("T", " ")
                          .substring(0, 16) || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="p-3 vertical-top">
                      <Link
                        href={`/holderstocks/list?found_code=${detail.submitterEdinetCode}`}
                        className="font-bold text-[13px] leading-relaxed break-all overflow-hidden whitespace-normal text-blue-600 hover:underline"
                      >
                        {detail.submitterName
                          ? toHalfWidth(detail.submitterName)
                          : "-"}
                      </Link>
                    </TableCell>
                    <TableCell className="p-3 vertical-top">
                      <Link
                        href={`/stockholders/list?stock_code=${detail.secCode || ""}&edinet_code=${detail.issuerEdinetCode || ""}`}
                        className="text-[13px] leading-relaxed break-all overflow-hidden whitespace-normal text-blue-600 hover:underline"
                      >
                        {detail.issuerName
                          ? toHalfWidth(detail.issuerName)
                          : "-"}
                      </Link>
                    </TableCell>
                    <TableCell className="p-3 vertical-top text-center">
                      <div className="text-[12px] text-muted-foreground font-mono">
                        {detail.obligationDate || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="p-2 vertical-top text-right">
                      <div className="font-mono text-[13px] font-medium">
                        {detail.holdingRatio !== null
                          ? `${detail.holdingRatio.toFixed(2)}%`
                          : "-"}
                      </div>
                    </TableCell>
                    <TableCell className="p-2 vertical-top text-right">
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {detail.prevHoldingRatio !== null
                          ? `${detail.prevHoldingRatio.toFixed(2)}%`
                          : "-"}
                      </div>
                    </TableCell>
                    <TableCell
                      className={`p-2 vertical-top text-right font-bold text-[13px] ${
                        detail.ratioDiff !== null && detail.ratioDiff > 0
                          ? "text-rose-600"
                          : detail.ratioDiff !== null && detail.ratioDiff < 0
                            ? "text-blue-600"
                            : "text-zinc-500"
                      }`}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {detail.ratioDiff !== null && detail.ratioDiff > 0 ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : detail.ratioDiff !== null &&
                          detail.ratioDiff < 0 ? (
                          <TrendingDown className="w-3.5 h-3.5" />
                        ) : null}
                        <span className="font-mono">
                          {detail.ratioDiff !== null ? (
                            <>
                              {detail.ratioDiff > 0 ? "+" : ""}
                              {detail.ratioDiff.toFixed(2)}%
                            </>
                          ) : (
                            "-"
                          )}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-lg mx-6 mb-6 bg-muted/10">
            <p className="text-muted-foreground text-lg">
              この日の大量保有報告書データはありません。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
