"use client";

import Link from "next/link";
import { TrendingItem } from "@/service/view-history";

interface TrendingItemCardProps {
  item: TrendingItem;
  rank: number;
}

export const TrendingItemCard = ({ item, rank }: TrendingItemCardProps) => {
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
