"use client";

import { PieChart, Landmark, Building2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { HistoryItem } from "@/service/view-history";
import { formatRelativeDate } from "@/lib/utils";

interface HistoryCardProps {
  item: HistoryItem;
}

export const HistoryCard = ({ item }: HistoryCardProps) => {
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
