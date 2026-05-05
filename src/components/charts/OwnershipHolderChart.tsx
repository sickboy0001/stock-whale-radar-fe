"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface HolderHistoryItem {
  obligationDate: string | null;
  issuerName: string | null;
  issuerEdinetCode: string | null;
  secCode: string | null;
  holdingRatio: number | null;
  prevHoldingRatio: number | null;
  sharesOutstanding?: number | null;
  prevClose?: number | null;
}

interface Props {
  history: HolderHistoryItem[];
}

// カラーパレット
const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#6366f1",
];

// 金額フォーマット関数
const formatCurrency = (value: number) => {
  if (value >= 1_000_000_000_000) {
    return (value / 1_000_000_000_000).toFixed(2) + "兆円";
  }
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + "十億円";
  }
  if (value >= 100_000_000) {
    return (value / 100_000_000).toFixed(2) + "億円";
  }
  if (value >= 10_000) {
    return (value / 10_000).toFixed(2) + "万円";
  }
  return value.toFixed(0) + "円";
};

export function OwnershipHolderChart({ history }: Props) {
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 次のフレームでチャートを描画可能にする
    const rafId = requestAnimationFrame(() => {
      setIsReady(true);
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  const chartData = useMemo(() => {
    if (!history.length) return [];

    // 1. 期間の設定 (過去 1 年)
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const startDateStr = oneYearAgo.toISOString().split("T")[0];
    const endDateStr = today.toISOString().split("T")[0];

    // 2. 義務発生日を抽出 (null を除外)
    const validHistory = history.filter(
      (h): h is HolderHistoryItem & { obligationDate: string } =>
        !!h.obligationDate,
    );

    // 3. 最新の時点で保有金額が高い Top10 銘柄を抽出
    const latestDataByIssuer = new Map<
      string,
      {
        holdingValue: number;
        holdingRatio: number;
        issuerName: string;
        latestPrice: number;
        sharesOutstanding: number;
      }
    >();

    validHistory.forEach((h) => {
      if (!h.issuerEdinetCode) return;

      const holdingValue =
        (h.sharesOutstanding || 0) *
        ((h.holdingRatio || 0) / 100) *
        (h.prevClose || 0);

      const existing = latestDataByIssuer.get(h.issuerEdinetCode);
      if (!existing || h.obligationDate >= startDateStr) {
        latestDataByIssuer.set(h.issuerEdinetCode, {
          holdingValue,
          holdingRatio: h.holdingRatio || 0,
          issuerName: h.issuerName || "",
          latestPrice: h.prevClose || 0,
          sharesOutstanding: h.sharesOutstanding || 0,
        });
      }
    });

    // Top10 を holdingValue でソートして抽出
    const top10Issuers = Array.from(latestDataByIssuer.entries())
      .sort((a, b) => (b[1].holdingValue || 0) - (a[1].holdingValue || 0))
      .slice(0, 10)
      .map(([_, data]) => data.issuerName);

    const top10IssuerNames = top10Issuers.filter(Boolean) as string[];

    // 4. 全ての日付ポイントを作成
    const timePoints = new Set<string>();
    timePoints.add(startDateStr);
    timePoints.add(endDateStr);

    const tempDate = new Date(oneYearAgo);
    while (tempDate <= today) {
      timePoints.add(tempDate.toISOString().split("T")[0]);
      tempDate.setMonth(tempDate.getMonth() + 1);
      tempDate.setDate(1);
    }

    validHistory.forEach((h) => {
      if (h.obligationDate >= startDateStr && h.obligationDate <= endDateStr) {
        timePoints.add(h.obligationDate);
      }
    });

    const allDates = Array.from(timePoints).sort();

    // 5. 日付ごとのデータ構造を作成
    const latestPrices = new Map<string, number>();
    const latestSharesOutstanding = new Map<string, number>();

    latestDataByIssuer.forEach((data, edinetCode) => {
      latestPrices.set(edinetCode, data.latestPrice);
      latestSharesOutstanding.set(edinetCode, data.sharesOutstanding);
    });

    let lastKnownRatios: Record<string, number> = {};

    top10IssuerNames.forEach((issuer) => {
      const preHistory = history
        .filter(
          (h) =>
            h.issuerName === issuer &&
            h.obligationDate &&
            h.obligationDate < startDateStr,
        )
        .sort((a, b) => (b.obligationDate! > a.obligationDate! ? 1 : -1));

      if (preHistory.length > 0) {
        lastKnownRatios[issuer] =
          preHistory[0].prevHoldingRatio ?? preHistory[0].holdingRatio ?? 0;
      }
    });

    return allDates.map((date) => {
      const dayData: Record<string, number | string> = { date };

      validHistory
        .filter((h) => h.obligationDate === date)
        .forEach((h) => {
          if (h.issuerName && top10IssuerNames.includes(h.issuerName)) {
            lastKnownRatios[h.issuerName] = h.holdingRatio || 0;
          }
        });

      top10IssuerNames.forEach((issuer) => {
        const ratio = lastKnownRatios[issuer] || 0;
        const edinetCode = validHistory.find(
          (h) => h.issuerName === issuer,
        )?.issuerEdinetCode;
        const price = edinetCode ? latestPrices.get(edinetCode) || 0 : 0;
        const shares = edinetCode
          ? latestSharesOutstanding.get(edinetCode) || 0
          : 0;

        // 保有金額を計算し、0 未満にならないようにする
        dayData[issuer] = Math.max(0, shares * (ratio / 100) * price);
      });

      return dayData;
    });
  }, [history]);

  const uniqueIssuers = useMemo(() => {
    if (!history.length) return [];

    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    const startDateStr = oneYearAgo.toISOString().split("T")[0];

    const validHistory = history.filter(
      (h): h is HolderHistoryItem & { obligationDate: string } =>
        !!h.obligationDate,
    );

    const latestDataByIssuer = new Map<
      string,
      { holdingValue: number; issuerName: string }
    >();

    validHistory.forEach((h) => {
      if (!h.issuerEdinetCode) return;

      const holdingValue =
        (h.sharesOutstanding || 0) *
        ((h.holdingRatio || 0) / 100) *
        (h.prevClose || 0);

      const existing = latestDataByIssuer.get(h.issuerEdinetCode);
      if (!existing || h.obligationDate >= startDateStr) {
        latestDataByIssuer.set(h.issuerEdinetCode, {
          holdingValue,
          issuerName: h.issuerName || "",
        });
      }
    });

    return Array.from(latestDataByIssuer.entries())
      .sort((a, b) => (b[1].holdingValue || 0) - (a[1].holdingValue || 0))
      .slice(0, 10)
      .map(([_, data]) => data.issuerName)
      .filter(Boolean) as string[];
  }, [history]);

  if (!chartData.length || !uniqueIssuers.length) {
    return (
      <div className="w-full h-[400px] mt-6 flex items-center justify-center text-muted-foreground">
        表示するデータがありません
      </div>
    );
  }

  if (!isReady) {
    return (
      <div
        ref={containerRef}
        className="w-full h-[400px] mt-6 flex items-center justify-center text-muted-foreground"
      >
        読み込み中...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-[400px] mt-6"
      style={{ width: "100%", height: "400px" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />
          <XAxis
            dataKey="date"
            fontSize={10}
            tickMargin={10}
            minTickGap={30}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis
            fontSize={11}
            tickFormatter={(value) => {
              if (value >= 1_000_000_000_000) {
                return (value / 1_000_000_000_000).toFixed(1) + "T";
              }
              if (value >= 1_000_000_000) {
                return (value / 1_000_000_000).toFixed(1) + "B";
              }
              if (value >= 100_000_000) {
                return (value / 100_000_000).toFixed(1) + "M";
              }
              if (value >= 10_000) {
                return (value / 10_000).toFixed(1) + "K";
              }
              return value.toFixed(0);
            }}
            domain={[0, "auto"]}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              return (
                <div
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    padding: "8px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      marginBottom: "4px",
                    }}
                  >
                    {label}
                  </p>
                  {payload.map((entry, index) => (
                    <p
                      key={index}
                      style={{ fontSize: "12px", color: entry.color }}
                    >
                      {entry.name}: {formatCurrency(entry.value as number)}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "20px" }} />
          {uniqueIssuers.map((name, index) => (
            <Bar
              key={name}
              dataKey={name}
              stackId="a"
              fill={COLORS[index % COLORS.length]}
              radius={[0, 0, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
