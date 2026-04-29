import React from "react";
import { TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { toHalfWidth, formatWithUnit, cn } from "@/lib/utils";
import Link from "next/link";
import { getRecentWhaleMovements } from "@/service/whale-movements";

export interface WhaleMovementData {
  secCode: string | null;
  issuerName: string | null;
  submitterName: string | null;
  submitterEdinetCode: string | null;
  submitterSecCode?: string | null;
  issuerEdinetCode: string | null;
  obligationDate: string | null;
  submitDatetime: string | null;
  holdingRatio: number | null;
  prevHoldingRatio: number | null;
  holdingPurpose: string | null;
  docId: string | null;
  ratioDiff: number;
  movementValue: number;
  marketCap: number;
  lastPrice: number | undefined;
}

interface RecentWhaleMovementsListProps {
  date?: string;
  period?: number;
  activeTab?: "all" | "increase" | "decrease";
}

export async function RecentWhaleMovementsList({
  date,
  period = 30,
  activeTab = "all",
}: RecentWhaleMovementsListProps) {
  const data = await getRecentWhaleMovements(date, period);

  if (!data) {
    return (
      <div className="text-center py-12 text-zinc-500 italic">
        データの取得に失敗しました
      </div>
    );
  }

  const displayData = (() => {
    switch (activeTab) {
      case "increase":
        return data.increases;
      case "decrease":
        return data.decreases;
      default:
        return data.all;
    }
  })();

  if (displayData.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 italic bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        該当するデータがありません
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 text-xs uppercase font-bold">
            <th className="px-6 py-4 w-16">Rank</th>
            <th className="px-6 py-4">義務発生日 / 銘柄</th>
            <th className="px-6 py-4">投資家</th>
            <th className="px-6 py-4 text-right">保有比率変化</th>
            <th className="px-6 py-4 text-right">移動推計額</th>
            <th className="px-6 py-4">保有目的</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
          {displayData.map((item, index) => (
            <tr
              key={`${item.docId}-${index}`}
              className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors"
            >
              <td className="px-6 py-4">
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
                    index < 3
                      ? activeTab === "increase"
                        ? "bg-emerald-500 text-white"
                        : activeTab === "decrease"
                          ? "bg-rose-500 text-white"
                          : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500",
                  )}
                >
                  {index + 1}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-row items-center gap-2 mb-1 flex-wrap">
                  <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                    <span className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-[8px] font-bold">
                      義務
                    </span>
                    {item.obligationDate}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1 rounded text-[8px] font-bold">
                      報告
                    </span>
                    {item.submitDatetime?.split(" ")[0]}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/stockholders/list?stock_code=${item.secCode?.substring(0, 4) || ""}&edinet_code=${item.issuerEdinetCode || ""}`}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors block leading-tight"
                  >
                    {toHalfWidth(item.issuerName || "")}
                  </Link>
                  <a
                    href={`https://finance.yahoo.co.jp/quote/${item.secCode?.substring(0, 4)}.T`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-blue-500 transition-colors"
                    title="Yahoo!ファイナンスで表示"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                  {item.secCode?.substring(0, 4)}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/holderstocks/list?found_code=${item.submitterEdinetCode || ""}`}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {toHalfWidth(item.submitterName || "")}
                  </Link>
                  {item.submitterSecCode && (
                    <a
                      href={`https://finance.yahoo.co.jp/quote/${item.submitterSecCode.substring(0, 4)}.T`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-blue-500 transition-colors"
                      title="Yahoo!ファイナンスで表示"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div
                  className={cn(
                    "text-sm font-bold flex items-center justify-end gap-1",
                    item.ratioDiff > 0 ? "text-emerald-500" : "text-rose-500",
                  )}
                >
                  {item.ratioDiff > 0 ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  {item.ratioDiff > 0 ? "+" : ""}
                  {item.ratioDiff.toFixed(2)}%
                </div>
                <div className="text-[10px] text-zinc-400">
                  {item.prevHoldingRatio?.toFixed(2)}% →{" "}
                  {item.holdingRatio?.toFixed(2)}%
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div
                  className={cn(
                    "text-base font-black",
                    item.ratioDiff > 0 ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {item.movementValue > 0 ? "▲" : "▼"}
                  {formatWithUnit(Math.abs(item.movementValue), "円")}
                </div>
              </td>
              <td className="px-6 py-4">
                <div
                  className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-[200px] line-clamp-2"
                  title={item.holdingPurpose || ""}
                >
                  {item.holdingPurpose || "-"}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
