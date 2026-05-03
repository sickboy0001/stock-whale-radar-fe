"use client";

import {
  History,
  Flame,
  Building2,
  Landmark,
  ChevronRight,
  LayoutGrid,
  Users2,
  PieChart,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { HistoryItem, TrendingItem } from "@/service/view-history";

interface ActivityPageProps {
  personalData: HistoryItem[];
  initialTrendingData: TrendingItem[];
}

type FilterType = "all" | "holder" | "stock";

export const ActivityPage = ({
  personalData,
  initialTrendingData,
}: ActivityPageProps) => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("7d");
  const [trendingData, setTrendingData] =
    useState<TrendingItem[]>(initialTrendingData);
  const [isLoading, setIsLoading] = useState(false);

  // 個人履歴のフィルタリング (クライアントサイド)
  const filteredPersonalData = useMemo(() => {
    if (filter === "all") return personalData;
    if (filter === "holder") {
      return personalData.filter(
        (item) => item.targetType === "entity" || item.targetType === "fund",
      );
    }
    if (filter === "stock") {
      return personalData.filter((item) => item.targetType === "stock");
    }
    return personalData;
  }, [personalData, filter]);

  // フィルターまたは期間変更時にトレンドデータを再取得
  useEffect(() => {
    // 初回表示時かつデフォルト設定の場合はスキップ
    if (
      filter === "all" &&
      period === "7d" &&
      trendingData === initialTrendingData
    )
      return;

    const fetchTrending = async () => {
      setIsLoading(true);
      try {
        let url = `/api/view-history?period=${period}`;
        if (filter === "holder") {
          // ホルダーの場合は entity または fund だが、API は 1 つしか受け取れないため
          // ここでは代表して entity を取得するか、API 側で複合フィルタをサポートさせる必要がある。
          // 簡略化のため、ここでは API に targetType を渡さず、取得後にクライアントで絞り込むか、
          // あるいは API を拡張する。
          // 一旦、API 側は全件返してクライアントで絞り込む方式にする (小規模データのため)
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          let results = data.trending as TrendingItem[];

          // クライアントサイドでのフィルタリング
          if (filter === "holder") {
            results = results.filter(
              (item) =>
                item.targetType === "entity" || item.targetType === "fund",
            );
          } else if (filter === "stock") {
            results = results.filter((item) => item.targetType === "stock");
          }

          setTrendingData(results);
        }
      } catch (error) {
        console.error("Failed to fetch trending data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrending();
  }, [filter, period, initialTrendingData]);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10">
      {/* フィルタータブ */}
      <div className="flex justify-center">
        <div className="bg-zinc-100 p-1 rounded-xl flex gap-1">
          {[
            { id: "all", label: "すべて", icon: LayoutGrid },
            { id: "holder", label: "ホルダー", icon: Users2 },
            { id: "stock", label: "銘柄", icon: PieChart },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as FilterType)}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                filter === t.id
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50"
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* セクション1: あなたの履歴 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="text-zinc-400" size={20} />
          <h2 className="text-xl font-bold italic tracking-tight">
            YOUR HISTORY
          </h2>
          <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-bold">
            {filteredPersonalData.length}
          </span>
        </div>
        {filteredPersonalData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPersonalData.map((item) => (
              <HistoryCard
                key={`${item.targetType}-${item.targetCode}-${item.viewedAt}`}
                item={item}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-zinc-400 text-sm">閲覧履歴はありません</p>
          </div>
        )}
      </section>

      {/* セクション2: トレンド */}
      <section className="space-y-4">
        <div className="flex justify-between items-end border-b border-zinc-100 pb-2">
          <div className="flex items-center gap-2">
            <Flame className="text-orange-500" size={20} />
            <h2 className="text-xl font-bold italic tracking-tight">
              TRENDING NOW
            </h2>
          </div>
          <div className="flex gap-2">
            {(["24h", "7d", "30d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-[10px] font-black px-3 py-1 rounded-full transition-all ${
                  period === p
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
            </div>
          )}
          {trendingData.length > 0 ? (
            <div className="divide-y divide-zinc-50">
              {trendingData.map((item, idx) => (
                <TrendingItemCard
                  key={`${item.targetType}-${item.targetCode}`}
                  item={item}
                  rank={idx + 1}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-zinc-400 text-sm">データがありません</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// 小コンポーネント：履歴カード
const HistoryCard = ({ item }: { item: HistoryItem }) => {
  const href =
    item.targetType === "stock"
      ? `/entity/stock/${item.targetCode}`
      : `/entity/holder/${item.targetCode}`;

  return (
    <Link href={href}>
      <div className="p-4 bg-white border border-zinc-200 rounded-xl hover:border-blue-500 transition-all cursor-pointer group flex items-center justify-between shadow-sm hover:shadow-md">
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              item.targetType === "stock"
                ? "bg-blue-50 text-blue-600"
                : item.targetType === "fund"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
            }`}
          >
            {item.targetType === "stock" ? (
              <PieChart size={18} />
            ) : item.targetType === "fund" ? (
              <Landmark size={18} />
            ) : (
              <Building2 size={18} />
            )}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-zinc-900 truncate">
              {item.name}
            </div>
            <div className="text-[10px] text-zinc-400 flex gap-2">
              <span className="font-mono">{item.targetCode}</span>
              <span>{formatRelativeDate(item.viewedAt)}</span>
            </div>
          </div>
        </div>
        <ChevronRight
          className="text-zinc-300 group-hover:text-blue-500 transition-colors shrink-0"
          size={16}
        />
      </div>
    </Link>
  );
};

// 小コンポーネント：トレンド項目
const TrendingItemCard = ({
  item,
  rank,
}: {
  item: TrendingItem;
  rank: number;
}) => {
  const href =
    item.targetType === "stock"
      ? `/entity/stock/${item.targetCode}`
      : `/entity/holder/${item.targetCode}`;

  return (
    <Link href={href}>
      <div className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors group">
        <span className="text-lg font-black text-zinc-200 w-6 group-hover:text-zinc-400 transition-colors">
          {rank}
        </span>
        <div className="flex-1 flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-4 overflow-hidden">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                item.targetType === "stock"
                  ? "bg-blue-100 text-blue-700"
                  : item.targetType === "fund"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {item.targetType === "stock"
                ? "STOCK"
                : item.targetType === "fund"
                  ? "FUND"
                  : "HOLDER"}
            </span>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-zinc-800 truncate">
                {item.name}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                {item.targetCode}
              </span>
            </div>
          </div>
          <div className="text-xs font-mono text-zinc-400 shrink-0">
            {item.viewCount} <span className="text-[10px]">views</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// 日付フォーマット用の簡易関数
function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr.replace(" ", "T"));
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
