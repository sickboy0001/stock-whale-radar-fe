# Lightweight Charts 実装仕様書

本ドキュメントでは、TradingView社が提供する `lightweight-charts` を用いた株価チャートの実装仕様について解説します。他のプロジェクトで同様のチャート機能を実装する際のガイドラインとして活用してください。

## 1. 概要

`lightweight-charts` は、高速でレスポンシブな金融チャートをウェブサイトに統合するためのライブラリです。React環境下では、DOMへの参照 (`useRef`) とライフサイクル管理 (`useEffect`) を組み合わせて実装します。

## 2. 技術スタック

- **Library**: `lightweight-charts`
- **Framework**: React / Next.js (Client Component)
- **Styling**: Tailwind CSS / インラインスタイル（ツールチップ用）

## 3. 基本的なコンポーネント構造

チャートコンポーネントは以下の構成で実装します。

1. **Container**: チャートを描画する空の `div` 要素。
2. **Chart Instance**: `createChart` で生成されるインスタンス。
3. **Series**: ローソク足、移動平均線、出来高などのデータ系列。
4. **Hooks**: テクニカル指標（MACDなど）の計算と管理を分離。

### ライフサイクル管理のポイント

```tsx
useEffect(() => {
  if (!chartContainerRef.current) return;

  // 1. インスタンスの作成
  const chart = createChart(chartContainerRef.current, { /* オプション */ });

  // 2. シリーズの追加
  const candlestickSeries = chart.addSeries(CandlestickSeries, { /* オプション */ });

  // 3. データ取得と設定
  const data = await fetchData();
  candlestickSeries.setData(data);

  // 4. イベントリスナーの設定（リサイズ等）
  const handleResize = () => {
    chart.applyOptions({ width: chartContainerRef.current.clientWidth });
  };
  window.addEventListener('resize', handleResize);

  // 5. クリーンアップ
  return () => {
    window.removeEventListener('resize', handleResize);
    chart.remove();
  };
}, [dependency]);
```

## 4. シリーズ構成と設定

### 4.1 ローソク足 (CandlestickSeries)
- **色設定**: 上昇 (`upColor`) と下落 (`downColor`) を明確に区別。
- **データ型**: `time` (UTCTimestamp), `open`, `high`, `low`, `close`

### 4.2 出来高 (HistogramSeries)
- **オーバーレイ表示**: `priceScaleId: ""` を設定することで、価格チャートと同じエリアに重ねて表示。
- **スケール調整**: `scaleMargins` を使用して、価格チャートの邪魔にならないよう下部に配置。

### 4.3 テクニカル指標 (LineSeries / HistogramSeries)
- **移動平均線 (MA)**: 短期・中期・長期で色を分け、`LineSeries` で描画。
- **MACD**: 
    - `priceScaleId` を独自（例: `"macd"`）に設定することで、価格とは別のスケールで描画。
    - `scaleMargins` を調整し、画面下部に独立したペインのように配置。

## 5. 高度なカスタマイズ

### 5.1 カスタムツールチップ
`lightweight-charts` 標準のフローティングツールチップではなく、DOM要素を自作して `subscribeCrosshairMove` で位置と内容を制御することで、より詳細な情報を柔軟に表示できます。

- **実装方法**:
    1. チャートコンテナー内に `absolute` 配置のツールチップ用 `div` を作成。
    2. `subscribeCrosshairMove` 内で、マウス位置 (`param.point`) に合わせて表示位置を計算。
    3. シリーズデータ (`param.seriesData`) から各項目の値を取得し、HTMLを更新。

### 5.2 将来の余白 (Right Offset)
`timeScale` の `rightOffset` を設定することで、チャートの右側に空白を確保できます。これにより、最新のデータが軸に張り付くのを防ぎ、視認性を向上させます。

## 6. データ仕様

### 6.1 基本フォーマット
`lightweight-charts` は `UTCTimestamp` (秒単位のUnix Timestamp) を使用します。JavaScriptの `Date.getTime()` はミリ秒単位であるため、1000で割る必要があります。

```typescript
type ChartData = {
  time: UTCTimestamp; // 秒単位の数値
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};
```

### 6.2 インジケーター計算
データ更新時に、元データ（OHLCV）を元にテクニカル指標を計算し、それぞれのシリーズに `setData` します。計算ロジックはカスタムフック（`useMACD`, `useMovingAverage`）にカプセル化することを推奨します。

## 7. 実装上の注意点 (Tips)

- **リサイズ対応**: 親要素の幅に合わせて `chart.applyOptions` を呼び出す。
- **メモリ管理**: コンポーネントのアンマウント時に必ず `chart.remove()` を呼び出す。
- **表示切り替え**: シリーズの `visible` オプションを使用して、再描画を伴わずに指標の表示/非表示を切り替える。
- **SSR対応**: `lightweight-charts` はブラウザAPIに依存するため、Next.jsでは `"use client"` 指定と `useEffect` 内での初期化が必須。
