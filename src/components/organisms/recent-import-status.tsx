"use client";

import React, { useEffect, useState } from "react";
import { Clock, Loader2, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DailyImportDetail } from "@/components/organisms/daily-import-detail";
import { getRecentImportStatus } from "@/service/daily-import";

type ImportStatus = {
  targetDate: string;
  status: string; // 'pending' | 'processing' | 'completed' | 'failed'
  totalDocsCount: number | null;
  targetDocsCount: number | null;
  successCount: number | null;
  lastRunStartAt: string | null;
  lastRunEndAt: string | null;
  errorMessage: string | null;
};

interface RecentImportStatusProps {
  selectedDate?: string | null;
  onSelectDate?: (date: string | null) => void;
  hideDetail?: boolean;
}

export const RecentImportStatus = ({
  selectedDate: propsSelectedDate,
  onSelectDate,
  hideDetail = false,
}: RecentImportStatusProps) => {
  const [data, setData] = useState<ImportStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [internalSelectedDate, setInternalSelectedDate] = useState<
    string | null
  >(null);

  const selectedDate =
    propsSelectedDate !== undefined ? propsSelectedDate : internalSelectedDate;
  const setSelectedDate = onSelectDate || setInternalSelectedDate;

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getRecentImportStatus(20); // 少し多めに取得してフィルタリング
        const filtered = (result as ImportStatus[]).filter(
          (item) => item.status === "completed",
        );
        setData(filtered.slice(0, 10)); // 最終的に10件表示
      } catch (error) {
        console.error("Failed to fetch recent import status:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleShowDetails = (date: string) => {
    setSelectedDate(date);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm p-12 flex flex-col items-center justify-center text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Clock className="text-zinc-400" size={18} />
            <h2 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">
              直近10営業日のインポート状況
            </h2>
          </div>
          <Link
            href="/daily-status"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
          >
            詳細を表示 <ChevronRight size={14} />
          </Link>
        </div>

        <div className="divide-y divide-zinc-50 dark:divide-zinc-900">
          {data.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-zinc-500 italic">
              データがありません
            </div>
          ) : (
            data.map((day) => (
              <div
                key={day.targetDate}
                className={cn(
                  "px-6 py-4 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer group",
                  selectedDate === day.targetDate &&
                    "bg-blue-50/50 dark:bg-blue-900/10",
                )}
                onClick={() => handleShowDetails(day.targetDate)}
              >
                {/* 左側：日付 */}
                <div className="flex items-center gap-4">
                  <div className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 w-24 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1">
                    <Search
                      size={12}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    {day.targetDate}
                  </div>
                </div>

                {/* 中央：進捗バー */}
                <div className="flex-1 max-w-[200px] px-8 hidden md:block">
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-zinc-400 font-medium">Progress</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">
                      {day.successCount ?? 0} / {day.targetDocsCount ?? 0}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        day.status === "failed"
                          ? "bg-rose-500"
                          : "bg-emerald-500",
                      )}
                      style={{
                        width: `${
                          day.targetDocsCount && day.targetDocsCount > 0
                            ? ((day.successCount ?? 0) / day.targetDocsCount) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* 右側：開始時刻 */}
                <div className="text-[10px] text-zinc-400 font-mono">
                  {day.lastRunStartAt
                    ? day.lastRunStartAt.includes("T")
                      ? day.lastRunStartAt.split("T")[1].substring(0, 8)
                      : day.lastRunStartAt
                    : "--:--:--"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {!hideDetail && selectedDate && (
        <DailyImportDetail
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
};
