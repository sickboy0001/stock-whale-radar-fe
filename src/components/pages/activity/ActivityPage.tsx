"use client";

import { History, Flame, LayoutGrid, Users2, PieChart } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { HistoryItem, TrendingItem } from "@/service/view-history";
import { HistoryCard } from "@/components/organisms/activity/history-card";
import { TrendingItemCard } from "@/components/organisms/activity/trending-item-card";

interface ActivityPageProps {
  personalData?: HistoryItem[];
  initialTrendingData?: TrendingItem[];
}

type FilterType = "all" | "holder" | "stock";

export const ActivityPage = ({
  personalData = [],
  initialTrendingData = [],
}: ActivityPageProps) => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("7d");
  const [trendingData, setTrendingData] =
    useState<TrendingItem[]>(initialTrendingData);
  const [fetchedPersonalData, setFetchedPersonalData] =
    useState<HistoryItem[]>(personalData);
  const [isLoading, setIsLoading] = useState(false);
  const hasInitialData = useRef(
    personalData.length > 0 || initialTrendingData.length > 0,
  );

  // props が変更された場合に state を更新
  useEffect(() => {
    if (personalData.length > 0) {
      setFetchedPersonalData(personalData);
    }
  }, [personalData]);

  useEffect(() => {
    if (initialTrendingData.length > 0) {
      setTrendingData(initialTrendingData);
    }
  }, [initialTrendingData]);

  // 初回データ取得 (props が空の場合、または初回マウント時)
  useEffect(() => {
    const fetchData = async () => {
      // 既にデータがある場合はスキップ (サーバーサイドで取得済みの場合)
      if (hasInitialData.current && filter === "all" && period === "7d") {
        return;
      }

      setIsLoading(true);
      try {
        const url = `/api/view-history?period=${period}&type=${hasInitialData.current ? "trending" : "all"}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.trending) {
            let results = data.trending as TrendingItem[];
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
          if (data.history && !hasInitialData.current) {
            setFetchedPersonalData(data.history);
          }
        } else {
          console.error("API error:", res.status, res.statusText);
        }
      } catch (error) {
        console.error("Failed to fetch activity data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filter, period]); // initialData 系の変更では再取得しない（無限ループ防止）

  // 個人履歴のフィルタリング (クライアントサイド)
  const filteredPersonalData = useMemo(() => {
    const data = fetchedPersonalData;
    if (filter === "all") return data;
    if (filter === "holder") {
      return data.filter(
        (item) => item.targetType === "entity" || item.targetType === "fund",
      );
    }
    if (filter === "stock") {
      return data.filter((item) => item.targetType === "stock");
    }
    return data;
  }, [fetchedPersonalData, filter]);

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
          <h2 className="text-xl font-bold italic tracking-tight text-zinc-900">
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
            <h2 className="text-xl font-bold italic tracking-tight text-zinc-900">
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
