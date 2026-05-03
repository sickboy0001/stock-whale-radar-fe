export type StockInfo = {
  edinetCode: string;
  submitterName: string;
  secCode: string | null;
  industry: string | null;
  // yfinance fields
  marketCap?: number;
  per?: number;
  pbr?: number;
  dividendYield?: number;
  lastPrice?: number;
  currency?: string;
  // 詳細項目
  prevClose?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  tradingValue?: number;
  sharesOutstanding?: number;
  dividendRate?: number;
  eps?: number;
  bps?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
};

export type HistoryItem = {
  obligationDate: string | null;
  submitterName: string | null;
  submitterEdinetCode: string | null;
  holdingRatio: number | null;
  prevHoldingRatio: number | null;
  ratioDiff: number | null;
  holdingPurpose: string | null;
  docDescription: string | null;
  docId: string | null;
  // 追加フィールド：保有株数と保有金額
  holdingShares?: number | null;
  holdingValue?: number | null;
  // 株価データ（保有金額計算用）
  prevClose?: number | null;
  sharesOutstanding?: number | null;
};

export type ChartDataPoint = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
