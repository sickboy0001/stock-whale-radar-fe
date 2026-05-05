"use client";

import React, { useMemo, useState, useEffect } from "react";
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
import { HistoryItem } from "@/type/stock";

interface Props {
  history: HistoryItem[];
}

// 投資家ごとのカラーパレット
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

export function OwnershipStackedChart({ history }: Props) {
  const [isReady, setIsReady] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 初期チェック
    const checkSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setIsReady(true);
        return true;
      }
      return false;
    };

    // 初期サイズチェック
    if (checkSize()) return;

    // ResizeObserver でサイズ変化を監視
    const observer = new ResizeObserver(() => {
      if (checkSize()) {
        observer.disconnect();
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  const chartData = useMemo(() => {
    // 1. 全てのユニークな投資家を抽出
    const allSubmitters = Array.from(
      new Set(history.map((h) => h.submitterName)),
    ).filter(Boolean) as string[];

    // 2. 期間の設定 (過去 1 年)
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const startDateStr = oneYearAgo.toISOString().split("T")[0];
    const endDateStr = today.toISOString().split("T")[0];

    // 3. 義務発生日を抽出 (null を除外)
    const validHistory = history.filter(
      (h): h is HistoryItem & { obligationDate: string } => !!h.obligationDate,
    );

    // 4. 最新の時点で holdingValue が高い Top10 の投資家を抽出
    // 各投資家の最新の holdingValue を取得
    const latestDataBySubmitter = new Map<
      string,
      { holdingValue: number; holdingRatio: number }
    >();

    validHistory.forEach((h) => {
      if (!h.submitterName) return;
      const existing = latestDataBySubmitter.get(h.submitterName);
      // 最新のデータ（obligationDate が最も新しいもの）を保持
      if (!existing || (h.obligationDate && h.obligationDate >= startDateStr)) {
        latestDataBySubmitter.set(h.submitterName, {
          holdingValue: h.holdingValue || 0,
          holdingRatio: h.holdingRatio || 0,
        });
      }
    });

    // Top10 を holdingValue でソートして抽出
    const top10Submitters = Array.from(latestDataBySubmitter.entries())
      .sort((a, b) => (b[1].holdingValue || 0) - (a[1].holdingValue || 0))
      .slice(0, 10)
      .map(([name]) => name);

    // Top10 の投資家のみをフィルタリング
    const submitters = top10Submitters;

    // 5. 全ての日付ポイントを作成 (開始日、毎月 1 日、義務発生日、終了日)
    const timePoints = new Set<string>();
    timePoints.add(startDateStr);
    timePoints.add(endDateStr);

    // 毎月 1 日を追加して、時間軸の密度を均一に近づける
    const tempDate = new Date(oneYearAgo);
    while (tempDate <= today) {
      timePoints.add(tempDate.toISOString().split("T")[0]);
      tempDate.setMonth(tempDate.getMonth() + 1);
      tempDate.setDate(1); // 翌月の 1 日にセット
    }

    // 義務発生日を追加
    validHistory.forEach((h) => {
      if (h.obligationDate >= startDateStr && h.obligationDate <= endDateStr) {
        timePoints.add(h.obligationDate);
      }
    });

    const allDates = Array.from(timePoints).sort();

    // 6. 日付ごとのデータ構造を作成
    // 各日付時点で、各投資家が何％持っているかを算出
    // 開始日時点での値を決めるために、全履歴を使って初期値を計算
    let lastKnownRatios: Record<string, number> = {};

    // 開始日より前の最新の値を反映させる（Top10 の投資家のみ）
    submitters.forEach((s) => {
      const preHistory = history
        .filter(
          (h) =>
            h.submitterName === s &&
            h.obligationDate &&
            h.obligationDate < startDateStr,
        )
        .sort((a, b) => (b.obligationDate! > a.obligationDate! ? 1 : -1));

      if (preHistory.length > 0) {
        lastKnownRatios[s] = preHistory[0].holdingRatio || 0;
      }
    });

    return allDates.map((date) => {
      const dayData: any = { date };

      // その日の報告があれば反映 (開始日と同日の報告も含む)
      validHistory
        .filter((h) => h.obligationDate === date)
        .forEach((h) => {
          if (h.submitterName && submitters.includes(h.submitterName)) {
            lastKnownRatios[h.submitterName] = h.holdingRatio || 0;
          }
        });

      // Top10 投資家のその時点での値をセット
      submitters.forEach((s) => {
        dayData[s] = lastKnownRatios[s] || 0;
      });

      return dayData;
    });
  }, [history]);

  // Top10 の投資家のみを uniqueSubmitters として使用
  const uniqueSubmitters = useMemo(() => {
    // chartData で計算した Top10 を再利用するために、同じロジックを適用
    const validHistory = history.filter(
      (h): h is HistoryItem & { obligationDate: string } => !!h.obligationDate,
    );

    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    const startDateStr = oneYearAgo.toISOString().split("T")[0];

    const latestDataBySubmitter = new Map<string, { holdingValue: number }>();

    validHistory.forEach((h) => {
      if (!h.submitterName) return;
      const existing = latestDataBySubmitter.get(h.submitterName);
      if (!existing || (h.obligationDate && h.obligationDate >= startDateStr)) {
        latestDataBySubmitter.set(h.submitterName, {
          holdingValue: h.holdingValue || 0,
        });
      }
    });

    return Array.from(latestDataBySubmitter.entries())
      .sort((a, b) => (b[1].holdingValue || 0) - (a[1].holdingValue || 0))
      .slice(0, 10)
      .map(([name]) => name);
  }, [history]);

  return (
    <div ref={containerRef} className="w-full h-[400px] mt-6">
      {!isReady && <div className="w-full h-full" />}
      {isReady && (
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
                // YYYY-MM-DD -> MM/DD
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis fontSize={11} unit="%" domain={[0, "auto"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
              itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "20px" }} />
            {uniqueSubmitters.map((name, index) => (
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
      )}
    </div>
  );
}
