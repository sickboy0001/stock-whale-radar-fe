"use client";

import React from "react";
import { Search } from "lucide-react";
import { toHalfWidth } from "@/lib/utils";
import {
  HolderStock,
  type HistoryItem,
} from "@/components/organisms/entity/holder-stock";
import { ActivityModal } from "@/components/organisms/activity/activity-modal";

type HolderInfo = {
  edinetCode: string;
  submitterName: string;
  submitterType: string | null;
  address: string | null;
};

interface HolderStocksPageProps {
  holderInfo: HolderInfo | null;
  history: HistoryItem[];
}

export function HolderStocksPage({
  holderInfo,
  history,
}: HolderStocksPageProps) {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          投資家詳細分析（Investor Insights）
        </h1>
        {holderInfo ? (
          <div className="flex items-center gap-4 text-lg">
            <span className="font-bold text-2xl">
              {toHalfWidth(holderInfo.submitterName)}
            </span>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(holderInfo.submitterName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-blue-500 transition-colors"
              title="Googleで検索"
            >
              <Search className="w-5 h-5" />
            </a>
            <ActivityModal initialFilter="holder" />
            <span className="text-muted-foreground text-sm">
              (EDINETコード: {holderInfo.edinetCode})
            </span>
          </div>
        ) : (
          <div className="text-muted-foreground">
            投資家情報が見つかりませんでした。
          </div>
        )}
      </div>

      <HolderStock history={history} />
    </div>
  );
}
