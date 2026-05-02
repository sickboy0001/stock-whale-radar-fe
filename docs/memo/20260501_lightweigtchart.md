
---

# 実装仕様書：株価チャート表示機能 (Lightweight Charts)


ご提示いただいた要件に基づき、**「TradingView Lightweight Charts」**を用いた株価チャート実装のための詳細仕様書および実装コード案を作成しました。

このライブラリは、ブルームバーグやTradingView本家でも使われている「軽量・高速・モバイル対応」に優れた金融チャートライブラリで、今回のSaaSに最適です。


## 要件
* チャートの実装 [lightweight-charts](https://tradingview.github.io/lightweight-charts/)
  * URL/stock/chart
    * 引数としてはedinet_code、stock_codeを指定できるようにする
    * どちらか入力されていること。edinet_codeだと、EdiNetCodesからstock_codeを取得する
  * lightweight-chartsを利用して、間近のチャートを３０日分表示できるようにしたいです。今日から１日前から１月前までの表示を想定しています。
  * データはYFinanceから取得する
    * YFinanceの引数はxxxx.Tのように「.T」を付与しての４桁が条件として必要

## 1. 概要
指定された `edinet_code` または `stock_code` に基づき、直近30日間の日足チャート（ローソク足）を表示する。データソースには yFinance を使用する。

## 2. ルーティング・引数仕様
*   **URL**: `/stock/chart`
*   **クエリパラメータ**:
    *   `edinet_code` (任意): 例 `E04237`
    *   `stock_code` (任意): 例 `9107` または `91070`
*   **バリデーション**:
    *   いずれかの入力が必須。
    *   `edinet_code` が優先。入力がある場合、DB(`edinet_codes`)から `sec_code` を取得する。
    *   `sec_code` は末尾の `0` を削除した4桁に変換し、末尾に `.T` を付与して yFinance 形式にする。

## 3. データ取得ロジック
*   **対象期間**: 今日から遡って30日間（営業日）。
*   **取得項目**: 日付 (Time), 始値 (Open), 高値 (High), 安値 (Low), 終値 (Close)。
*   **ライブラリ**: `yahoo-finance2` (Node.js環境)。

## 4. フロントエンド仕様
*   **ライブラリ**: `lightweight-charts`
*   **表示形式**: ローソク足チャート。
*   **レスポンシブ**: 親コンテナの幅に合わせて自動リサイズ。
*   **配色**:
    *   上昇（Up）: `#22c55e` (Emerald 500)
    *   下落（Down）: `#ef4444` (Red 500)

---

### 5. 実装コード案

#### ① データ取得用関数 (`src/lib/chart-data.ts`)
yFinance からデータを取得し、Lightweight Charts が読める形式に変換します。

```typescript
import yahooFinance from 'yahoo-finance2';

export async function getChartData(ticker4digits: string) {
  const ticker = `${ticker4digits}.T`;
  
  // 30日前の日付を計算
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 45); // 土日を考慮して少し長めに取得

  const result = await yahooFinance.historical(ticker, {
    period1: from,
    interval: '1d',
  });

  // Lightweight Charts形式 (time, open, high, low, close) に変換
  return result
    .map(d => ({
      time: d.date.toISOString().split('T')[0], // YYYY-MM-DD
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }))
    .slice(-30); // 直近30日分に切り出し
}
```

#### ② チャートコンポーネント (`src/components/chart/StockChart.tsx`)

```tsx
"use client";
import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

export const StockChart = ({ data }: { data: any[] }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#a1a1aa',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#27272a' },
        horzLines: { color: '#27272a' },
      },
      timeScale: { borderColor: '#3f3f46' },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    candlestickSeries.setData(data);
    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-[400px]" />;
};
```

#### ③ ページの実装 (`src/app/stock/chart/page.tsx`)

```tsx
import { db } from "@/lib/db";
import { getChartData } from "@/lib/chart-data";
import { StockChart } from "@/components/chart/StockChart";
import { notFound } from "next/navigation";

export default async function ChartPage({
  searchParams,
}: {
  searchParams: { edinet_code?: string; stock_code?: string };
}) {
  let ticker = "";

  if (searchParams.edinet_code) {
    // 1. EDINETコードから証券コードを引く
    const res = await db.execute({
      sql: "SELECT sec_code FROM edinet_codes WHERE edinet_code = ?",
      args: [searchParams.edinet_code]
    });
    const secCode = res.rows[0]?.sec_code as string;
    if (secCode) ticker = secCode.substring(0, 4);
  } else if (searchParams.stock_code) {
    // 2. 証券コードを4桁に整形
    ticker = searchParams.stock_code.substring(0, 4);
  }

  if (!ticker) return notFound();

  // 3. yFinanceからデータ取得
  const chartData = await getChartData(ticker);

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">株価チャート (直近30日)</h1>
        <span className="px-3 py-1 bg-zinc-800 rounded-lg font-mono text-sm">{ticker}.T</span>
      </div>
      
      <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800">
        <StockChart data={chartData} />
      </div>
    </div>
  );
}
```

---

### プロのアドバイス
1.  **データ取得のタイムラグ**:
    `yahoo-finance2` はサーバーサイドで動作させる必要があります（ブラウザからの直接取得はCORS制限で不可）。そのため、上記のように `Page` (Server Component) でデータを取得して `StockChart` (Client Component) に渡す構成がベストです。
2.  **休場日の考慮**:
    日本の株式市場は土日祝日が休みです。`from` 日付を30日前ジャストにすると、営業日が足りなくなるため、45日前程度から取得して `slice(-30)` するのが定石です。
3.  **UIの統合**:
    チャートの背景を `transparent` に設定しているので、親要素（`bg-zinc-950` 等）のデザインに綺麗に馴染みます。

この構成でチャートの実装を進めていただけますでしょうか？必要であれば、インジケーター（移動平均線など）の追加方法もサポート可能です。
