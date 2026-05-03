"use client";

import React, { useEffect, useState } from "react";
import { StockChart } from "@/components/chart/StockChart";
import { ChartDataPoint } from "@/type/stock";
import { Loader2 } from "lucide-react";

interface StockChartSectionProps {
  edinetCode?: string | null;
  stockCode?: string | null;
}

export function StockChartSection({
  edinetCode,
  stockCode,
}: StockChartSectionProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!edinetCode && !stockCode) return;

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (edinetCode) params.set("edinet_code", edinetCode);
        if (stockCode) params.set("stock_code", stockCode);

        const res = await fetch(`/api/stock/chart?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch chart data");

        const chartData = await res.json();
        setData(chartData);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [edinetCode, stockCode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px] border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 text-red-500">
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 text-muted-foreground">
        チャートデータがありません。
      </div>
    );
  }

  return (
    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 shadow-inner">
      <StockChart data={data} />
    </div>
  );
}
