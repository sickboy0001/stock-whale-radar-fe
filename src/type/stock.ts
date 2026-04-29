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
};
