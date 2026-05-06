"use client";

import React, { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { toHalfWidth } from "@/lib/utils";
import { StockYFinanceStats } from "@/components/organisms/entity/stock-yfinance-stats";
import { StockHolder } from "@/components/organisms/entity/stock-holder";
import { StockChartSection } from "@/components/organisms/entity/stock-chart-section";
import { StockInfo, HistoryItem } from "@/type/stock";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStockholdersByStock } from "@/service/stockholders";
import { ActivityModal } from "@/components/organisms/activity/activity-modal";

interface StockholdersPageProps {
  edinetCode?: string | null;
  initialStockInfo?: StockInfo | null;
}

export function StockholdersPage({
  edinetCode,
  initialStockInfo,
}: StockholdersPageProps) {
  const [stockInfo, setStockInfo] = React.useState<StockInfo | null>(
    initialStockInfo || null,
  );
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = React.useState(!initialStockInfo);

  // 閲覧履歴を記録
  useEffect(() => {
    if (edinetCode) {
      fetch("/api/view-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetCode: edinetCode,
          targetType: "entity",
        }),
      }).catch((err) => {
        console.error("Failed to record view history:", err);
      });
    }
  }, [edinetCode]);

  useEffect(() => {
    const fetchStockInfo = async () => {
      if (!edinetCode || initialStockInfo) return;

      setLoading(true);
      try {
        const data = await getStockholdersByStock({
          edinetCode: edinetCode,
        });
        if (data) {
          setStockInfo(data.stockInfo);
          setHistory(data.history);
        }
      } catch (error) {
        console.error("Failed to fetch stock info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockInfo();
  }, [edinetCode, initialStockInfo]);

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          銘柄詳細分析 (Stock Insights)
        </h1>
        {loading ? (
          <div className="h-10 w-64 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
        ) : stockInfo ? (
          <div className="flex items-center gap-4 text-lg">
            <Badge variant="outline" className="text-lg px-3 py-1">
              {stockInfo.secCode?.substring(0, 4) || "----"}
            </Badge>
            <span className="font-bold text-2xl">
              {toHalfWidth(stockInfo.submitterName)}
            </span>
            <a
              href={`https://finance.yahoo.co.jp/quote/${stockInfo.secCode?.substring(0, 4)}.T`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-blue-500 transition-colors"
              title="Yahoo!ファイナンスで表示"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <ActivityModal initialFilter="stock" />
            <span className="text-muted-foreground text-sm">
              (EDINET コード：{stockInfo.edinetCode})
            </span>
          </div>
        ) : (
          <div className="text-muted-foreground">
            銘柄情報が見つかりませんでした。
          </div>
        )}
      </div>
      {/* yfinance 指標セクション */}
      <StockYFinanceStats edinetCode={edinetCode} initialData={stockInfo} />
      <Tabs defaultValue="holder" className="w-full">
        <TabsList>
          <TabsTrigger value="holder">ホルダー</TabsTrigger>
          <TabsTrigger value="chart">チャート</TabsTrigger>
        </TabsList>
        <TabsContent value="holder" className="space-y-8 mt-6">
          <StockHolder
            stockInfo={stockInfo}
            edinetCode={edinetCode}
            initialHistory={history}
          />
        </TabsContent>
        <TabsContent value="chart" className="mt-6">
          <StockChartSection
            edinetCode={edinetCode}
            stockCode={stockInfo?.secCode}
          />
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1"></div>
      </div>
    </div>
  );
}
