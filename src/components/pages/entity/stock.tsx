"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ChevronDown, ChevronUp, Info } from "lucide-react";
import { toHalfWidth } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StockYFinanceStats } from "@/components/organisms/entity/stock-yfinance-stats";
import { StockHolder } from "@/components/organisms/entity/stock-holder";
import { StockChartSection } from "@/components/organisms/entity/stock-chart-section";
import { StockInfo, HistoryItem } from "@/type/stock";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStockholdersByStock } from "@/service/stockholders";
import { ActivityModal } from "@/components/organisms/activity/activity-modal";
import { StockKnowledgeCard } from "@/components/organisms/stock/StockKnowledgeCard";
import { fetchStockProfile } from "@/actions/stock-profile";

interface StockholdersPageProps {
  edinetCode?: string | null;
  initialStockInfo?: StockInfo | null;
  initialProfile?: any;
  displayCode?: string | null;
}

export function StockholdersPage({
  edinetCode,
  initialStockInfo,
  initialProfile,
  displayCode,
}: StockholdersPageProps) {
  const [stockInfo, setStockInfo] = React.useState<StockInfo | null>(
    initialStockInfo || null,
  );
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(!initialStockInfo);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [profileLoading, setProfileLoading] = useState(false);

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

  // 詳細表示が ON になった時に初めてプロフィールを取得
  useEffect(() => {
    const fetchProfile = async () => {
      if (showProfile && !profile && (displayCode || stockInfo?.secCode)) {
        setProfileLoading(true);
        try {
          const code =
            displayCode ||
            (stockInfo?.secCode?.length === 5 && stockInfo.secCode.endsWith("0")
              ? stockInfo.secCode.substring(0, 4)
              : stockInfo?.secCode);

          if (code && stockInfo?.submitterName) {
            const data = await fetchStockProfile(code, stockInfo.submitterName);
            setProfile(data);
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        } finally {
          setProfileLoading(false);
        }
      }
    };
    fetchProfile();
  }, [showProfile, profile, displayCode, stockInfo]);

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2"
            >
              {showProfile ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  詳細を隠す
                </>
              ) : (
                <>
                  <Info className="w-4 h-4" />
                  詳細を表示
                </>
              )}
            </Button>
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
      {showProfile && (
        <div className={profileLoading ? "animate-pulse" : ""}>
          <StockKnowledgeCard
            profile={profile}
            officialName={stockInfo?.submitterName || ""}
            secCode={stockInfo?.secCode || ""}
          />
        </div>
      )}

      <div className="space-y-8">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1"></div>
      </div>
    </div>
  );
}
