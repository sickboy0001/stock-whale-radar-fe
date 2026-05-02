"use client";

import React, { useState } from "react";
import { RecentImportStatus } from "@/components/organisms/recent-import-status";
import { DailyImportDetail } from "@/components/organisms/daily-import-detail";
import { Search } from "lucide-react";

export function RecentDailyStatusPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
          RECENT RADAR LOGS
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">
          直近10営業日のデータインポート状況の集約
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 左側：リスト (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          <RecentImportStatus
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            hideDetail={true}
          />

          <div className="grid grid-cols-1 gap-4">
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                モニタリングのヒント
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                失敗(Failed)が続く場合は、EDINET
                APIの仕様変更を確認してください。
              </p>
            </div>
          </div>
        </div>

        {/* 右側：詳細 (8/12) */}
        <div className="lg:col-span-8">
          {selectedDate ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <DailyImportDetail
                date={selectedDate}
                onClose={() => setSelectedDate(null)}
              />
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-zinc-50/30 dark:bg-zinc-900/10 text-zinc-400">
              <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full mb-4">
                <Search size={32} className="text-zinc-300" />
              </div>
              <p className="text-sm font-medium">
                左側のリストから日付を選択して詳細を表示してください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
