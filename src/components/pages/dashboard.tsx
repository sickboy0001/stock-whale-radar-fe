"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecentImportStatus } from "@/components/organisms/recent-import-status";
import { DailyImportDetail } from "@/components/organisms/daily-import-detail";
import { getRecentImportStatus } from "@/service/daily-import";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  FileText,
  Users,
  DollarSign,
  LayoutDashboard,
  Zap,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

// サマリー指標のダミーデータ
const summaryStats = [
  {
    title: "本日の提出件数",
    value: "24 件",
    change: "+12%",
    icon: FileText,
    trend: "up",
  },
  {
    title: "新規クジラ数",
    value: "5 名",
    change: "+2",
    icon: Users,
    trend: "up",
  },
  {
    title: "平均保有割合",
    value: "6.8%",
    change: "-0.3%",
    icon: DollarSign,
    trend: "down",
  },
];

// タイムラインデータのダミーデータ
const timelineItems = [
  {
    id: 1,
    fundName: "アクティビスト・ファンド A",
    stockName: "ABC 株式会社",
    previousHoldings: "5.2%",
    currentHoldings: "6.8%",
    change: "+1.6%",
    purpose: "経営参加の意図あり",
    timestamp: "2026-04-27 14:30",
    action: "buy",
  },
  {
    id: 2,
    fundName: "グローバル・インベスト B",
    stockName: "XYZ  Corp",
    previousHoldings: "7.1%",
    currentHoldings: "5.4%",
    change: "-1.7%",
    purpose: "財務改善目的",
    timestamp: "2026-04-27 13:15",
    action: "sell",
  },
  {
    id: 3,
    fundName: "ベンチャーキャピタル C",
    stockName: "DEF テクノロジーズ",
    previousHoldings: "新規",
    currentHoldings: "5.1%",
    change: "新規取得",
    purpose: "長期的な成長期待",
    timestamp: "2026-04-27 11:00",
    action: "new",
  },
];

// 急上昇ランキングのダミーデータ
const hotStocks = [
  {
    rank: 1,
    name: "ABC 株式会社",
    ticker: "ABC",
    change: "+12.5%",
    volume: "1,234,567",
  },
  {
    rank: 2,
    name: "GHI エナジー",
    ticker: "GHI",
    change: "+8.3%",
    volume: "987,654",
  },
  {
    rank: 3,
    name: "JKL ファーマ",
    ticker: "JKL",
    change: "+6.7%",
    volume: "765,432",
  },
  {
    rank: 4,
    name: "MNO 物流",
    ticker: "MNO",
    change: "+5.2%",
    volume: "654,321",
  },
  {
    rank: 5,
    name: "PQR 通信",
    ticker: "PQR",
    change: "+4.1%",
    volume: "543,210",
  },
];

function getActionBadge(action: string) {
  switch (action) {
    case "buy":
      return <Badge className="bg-red-500 hover:bg-red-600">買い増し</Badge>;
    case "sell":
      return (
        <Badge className="bg-green-500 hover:bg-green-600">一部処分</Badge>
      );
    case "new":
      return <Badge className="bg-teal-500 hover:bg-teal-600">新規取得</Badge>;
    default:
      return <Badge>その他</Badge>;
  }
}

export function DashboardPage() {
  const [latestDate, setLatestDate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const result = await getRecentImportStatus(1);
        if (result && result.length > 0) {
          setLatestDate(result[0].targetDate);
        }
      } catch (error) {
        console.error("Failed to fetch latest import date:", error);
      }
    }
    fetchLatest();
  }, []);

  return (
    // <div className="flex-1 p-6 space-y-10 max-w-7xl mx-auto">
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-10 h-10 text-blue-600" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              WHALE RADAR DASHBOARD
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              市場の「クジラ」の動きをリアルタイムで監視
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full border border-blue-100 dark:border-blue-800">
          <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
            Live Monitoring Active
          </span>
        </div>
      </div>

      {/* Top Cards (サマリー指標) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaryStats.map((stat, index) => (
          <Card
            key={index}
            className="border-2 hover:border-blue-500/50 transition-colors"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-zinc-900 dark:text-zinc-50">
                {stat.value}
              </div>
              <div className="flex items-center text-xs mt-1">
                {stat.trend === "up" ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-rose-500" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-blue-500" />
                )}
                <span
                  className={
                    stat.trend === "up"
                      ? "text-rose-500 font-bold"
                      : "text-blue-500 font-bold"
                  }
                >
                  {stat.change}
                </span>
                <span className="ml-1 text-zinc-400 font-medium">
                  vs Yesterday
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-10">
          {latestDate && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  最新のインポート詳細 ({latestDate})
                </h2>
                <Link
                  href="/recent-daily-status"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-bold bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100"
                >
                  詳細ログを表示 <ChevronRight size={14} />
                </Link>
              </div>
              <DailyImportDetail date={latestDate} onClose={() => {}} />
            </section>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-10">
          {/* Recent Import Logs */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
                <FileText className="w-5 h-5 text-zinc-400" />
                インポートログ
              </h2>
              <Link
                href="/recent-daily-status"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-bold"
              >
                すべて見る <ChevronRight size={14} />
              </Link>
            </div>
            <RecentImportStatus />
          </section>
        </div>
      </div>
    </div>
  );
}
