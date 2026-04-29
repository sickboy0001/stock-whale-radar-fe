"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface RecentWhaleMovementsProps {
  children: React.ReactNode;
  initialDate?: string;
  initialPeriod?: number;
  initialTab?: "all" | "increase" | "decrease";
}

export function RecentWhaleMovements({
  children,
  initialDate,
  initialPeriod = 30,
  initialTab = "all",
}: RecentWhaleMovementsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 今日の日付を YYYY-MM-DD 形式で取得
  const today = new Date().toISOString().split("T")[0];
  const selectedDate = initialDate || today;
  const selectedPeriod = initialPeriod;
  const activeTab = initialTab;

  const updateQueryParams = (date: string, period: number, tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", date);
    params.set("period", period.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    updateQueryParams(newDate, selectedPeriod, activeTab);
  };

  const handlePeriodChange = (days: number) => {
    updateQueryParams(selectedDate, days, activeTab);
  };

  const handleTabChange = (tab: "all" | "increase" | "decrease") => {
    updateQueryParams(selectedDate, selectedPeriod, tab);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            大口投資家 動向ランキング
          </h1>
          <p className="text-zinc-500 mt-1">
            基準日より過去 {selectedPeriod} 日間の義務発生日ベース /
            移動推計額上位
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                max={today}
                className="bg-transparent text-sm font-medium outline-none text-zinc-700 dark:text-zinc-300"
              />
            </div>

            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
              <button
                onClick={() => handlePeriodChange(15)}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-all",
                  selectedPeriod === 15
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
                )}
              >
                15日間
              </button>
              <button
                onClick={() => handlePeriodChange(30)}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-all",
                  selectedPeriod === 30
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
                )}
              >
                30日間
              </button>
            </div>
          </div>

          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => handleTabChange("all")}
              className={cn(
                "px-4 py-1.5 text-sm font-bold rounded-md transition-all",
                activeTab === "all"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
              )}
            >
              すべて
            </button>
            <button
              onClick={() => handleTabChange("increase")}
              className={cn(
                "px-4 py-1.5 text-sm font-bold rounded-md transition-all",
                activeTab === "increase"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
              )}
            >
              買い増し
            </button>
            <button
              onClick={() => handleTabChange("decrease")}
              className={cn(
                "px-4 py-1.5 text-sm font-bold rounded-md transition-all",
                activeTab === "decrease"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
              )}
            >
              売り出し
            </button>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
