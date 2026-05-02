"use client";

import { useState } from "react";
import { Flame, Building2, Landmark } from "lucide-react";
import { type TrendingItem } from "@/service/view-history";
import Link from "next/link";

type Period = "1w" | "1m" | "3m";

interface TrendingWhalesProps {
  initialData: Record<Period, TrendingItem[]>;
  title?: string;
  defaultPeriod?: Period;
}

export const TrendingWhales = ({
  initialData,
  title = "TRENDING WHALES",
  defaultPeriod = "1w",
}: TrendingWhalesProps) => {
  const [period, setPeriod] = useState<Period>(defaultPeriod);

  const data = initialData[period] || [];

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-zinc-50 dark:border-zinc-900 flex justify-between items-center">
        <h2 className="text-sm font-black flex items-center gap-2">
          <Flame className="text-orange-500" size={18} />
          {title}
        </h2>
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
          {(["1w", "1m", "3m"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                period === p
                  ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="p-2">
        {data.length === 0 ? (
          <div className="text-sm text-zinc-400 text-center py-8">
            注目銘柄のデータがありません
          </div>
        ) : (
          <div className="space-y-1">
            {data.map((item, idx) => (
              <Link
                key={`${item.targetType}-${item.targetCode}`}
                href={
                  item.targetType === "entity"
                    ? `/entity/stock/${item.targetCode}?stock_code=`
                    : "#"
                }
                className="flex items-center gap-4 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all group"
              >
                <span className="text-xs font-black text-zinc-300 group-hover:text-zinc-500 w-4">
                  {idx + 1}
                </span>
                <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-400 group-hover:text-blue-500 transition-colors">
                  {item.targetType === "entity" ? (
                    <Building2 size={14} />
                  ) : (
                    <Landmark size={14} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">
                    {item.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded font-mono">
                      {item.targetCode}
                    </span>
                    <span className="text-[9px] text-zinc-400">
                      {item.viewCount} views
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
