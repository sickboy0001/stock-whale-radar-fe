"use client";

import { History, Building2, Landmark, ArrowRight } from "lucide-react";
import { getRelativeTime, type HistoryItem } from "@/service/view-history";
import Link from "next/link";

interface RecentHistoryListProps {
  historyItems: HistoryItem[];
  title?: string;
}

export const RecentHistoryList = ({
  historyItems,
  title = "最近チェックした銘柄・ファンド",
}: RecentHistoryListProps) => {
  if (historyItems.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-500 text-sm font-bold px-2">
          <History size={16} />
          <span>{title}</span>
        </div>
        <div className="text-sm text-zinc-400 text-center py-4">
          履歴がありません
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-zinc-500 text-sm font-bold px-2">
        <History size={16} />
        <span>{title}</span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {historyItems.map((item) => (
          <Link
            key={`${item.targetType}-${item.targetCode}`}
            href={
              item.targetType === "entity"
                ? `/entity/stock/${item.targetCode}?stock_code=`
                : `/radar/whales?fund_code=${item.targetCode}`
            }
            className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-400 group-hover:text-blue-500 transition-colors">
                {item.targetType === "entity" ? (
                  <Building2 size={16} />
                ) : (
                  <Landmark size={16} />
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">
                  {item.name}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {item.targetCode}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] text-zinc-300 dark:text-zinc-500">
                {getRelativeTime(item.viewedAt)}
              </div>
              <ArrowRight
                size={14}
                className="text-zinc-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
