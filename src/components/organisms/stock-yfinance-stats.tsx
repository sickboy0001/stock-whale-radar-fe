"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  PieChart,
} from "lucide-react";
import { StockInfo } from "@/type/stock";
import { Button } from "@/components/ui/button";
import { formatWithUnit, formatCurrency } from "@/lib/utils";

interface StockYFinanceStatsProps {
  stockInfo: StockInfo;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col p-3 gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
        {label}
      </span>
      <span className="text-sm font-mono font-semibold truncate">{value}</span>
    </div>
  );
}

export function StockYFinanceStats({ stockInfo }: StockYFinanceStatsProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-50/50 dark:bg-zinc-900/50 border-blue-100/50 dark:border-blue-900/20 shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              現在値
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(stockInfo.lastPrice, stockInfo.currency)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-50/50 dark:bg-zinc-900/50 shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <CircleDollarSign className="w-3.5 h-3.5 text-emerald-500" />
              時価総額
            </div>
            <div className="text-2xl font-bold">
              {formatWithUnit(stockInfo.marketCap, "円")}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-50/50 dark:bg-zinc-900/50 shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
              PER / PBR
            </div>
            <div className="text-2xl font-bold">
              {stockInfo.per?.toFixed(1) || "-"}x /{" "}
              {stockInfo.pbr?.toFixed(2) || "-"}x
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-50/50 dark:bg-zinc-900/50 shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <PieChart className="w-3.5 h-3.5 text-rose-500" />
              配当利回り
            </div>
            <div className="text-2xl font-bold">
              {stockInfo.dividendYield
                ? (stockInfo.dividendYield * 100).toFixed(2) + "%"
                : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-200"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          {showDetails ? "詳細情報を閉じる" : "詳細情報を表示"}
        </Button>
      </div>

      {showDetails && (
        <Card className="animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm shadow-inner">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x border-b last:border-b-0 divide-zinc-200/50 dark:divide-zinc-800/50">
              <DetailItem
                label="前日終値"
                value={formatCurrency(stockInfo.prevClose, stockInfo.currency)}
              />
              <DetailItem
                label="始値"
                value={formatCurrency(stockInfo.open, stockInfo.currency)}
              />
              <DetailItem
                label="高値"
                value={formatCurrency(stockInfo.high, stockInfo.currency)}
              />
              <DetailItem
                label="安値"
                value={formatCurrency(stockInfo.low, stockInfo.currency)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x border-b last:border-b-0 divide-zinc-200/50 dark:divide-zinc-800/50">
              <DetailItem
                label="出来高"
                value={formatWithUnit(stockInfo.volume, "株")}
              />
              <DetailItem
                label="売買代金 (概算)"
                value={formatWithUnit(stockInfo.tradingValue, "円")}
              />
              <DetailItem
                label="発行済株式数"
                value={formatWithUnit(stockInfo.sharesOutstanding, "株")}
              />
              <DetailItem label="単元株数" value="100 株" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x border-b last:border-b-0 divide-zinc-200/50 dark:divide-zinc-800/50">
              <DetailItem
                label="1株配当"
                value={formatCurrency(
                  stockInfo.dividendRate,
                  stockInfo.currency,
                )}
              />
              <DetailItem
                label="EPS (予想)"
                value={stockInfo.eps ? `¥${stockInfo.eps.toFixed(1)}` : "-"}
              />
              <DetailItem
                label="BPS (実績)"
                value={stockInfo.bps ? `¥${stockInfo.bps.toFixed(0)}` : "-"}
              />
              <DetailItem label="ROE (実績)" value="-" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x border-b last:border-b-0 divide-zinc-200/50 dark:divide-zinc-800/50">
              <DetailItem label="自己資本比率" value="-" />
              <DetailItem
                label="年初来高値"
                value={formatCurrency(
                  stockInfo.fiftyTwoWeekHigh,
                  stockInfo.currency,
                )}
              />
              <DetailItem
                label="年初来安値"
                value={formatCurrency(
                  stockInfo.fiftyTwoWeekLow,
                  stockInfo.currency,
                )}
              />
              <DetailItem label="証券コード" value={stockInfo.secCode || "-"} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
