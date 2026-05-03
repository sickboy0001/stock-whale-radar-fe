import YahooFinance from "yahoo-finance2";
import { ChartDataPoint } from "@/type/stock";

// yahoo-finance2 v3 ではインスタンス化が必要
// https://github.com/gadicc/yahoo-finance2/blob/dev/docs/UPGRADING.md
const yf = new YahooFinance();

export interface StockQuote {
  marketCap?: number;
  per?: number;
  pbr?: number;
  dividendYield?: number;
  lastPrice?: number;
  currency?: string;
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
  symbol?: string;
}

/**
 * yfinance (Yahoo Finance) から銘柄の時価情報を取得します。
 * @param symbol 証券コード (4桁) またはティッカーシンボル (例: "7203.T")
 */
export async function getStockQuote(
  symbol: string,
): Promise<StockQuote | null> {
  if (!yf || typeof yf.quote !== "function") {
    console.error("Yahoo Finance client is not initialized correctly");
    return null;
  }

  try {
    // 4桁の数字のみの場合は .T (東証) をデフォルトで付与
    const ticker = /^\d{4}$/.test(symbol) ? `${symbol}.T` : symbol;

    // quoteSummary ではなく quote を使用して主要な指標を一度に取得
    const result = (await yf.quote(ticker)) as any;

    if (!result) return null;

    return {
      marketCap: result.marketCap,
      per: result.forwardPE || result.trailingPE,
      pbr: result.priceToBook,
      dividendYield: result.trailingAnnualDividendYield,
      lastPrice: result.regularMarketPrice,
      currency: result.currency,
      // 追加項目
      prevClose: result.regularMarketPreviousClose,
      open: result.regularMarketOpen,
      high: result.regularMarketDayHigh,
      low: result.regularMarketDayLow,
      volume: result.regularMarketVolume,
      tradingValue:
        (result.regularMarketVolume || 0) * (result.regularMarketPrice || 0),
      sharesOutstanding: result.sharesOutstanding,
      dividendRate: result.trailingAnnualDividendRate,
      eps: result.forwardEps,
      bps: result.bookValue,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow,
    };
  } catch (error: any) {
    console.error(
      `Failed to fetch yfinance data for ${symbol}:`,
      error?.message || error,
    );
    return null;
  }
}

/**
 * 複数の銘柄の時価情報を一括取得します。
 * @param symbols 証券コード (4桁) またはティッカーシンボルの配列
 */
export async function getBatchStockQuotes(
  symbols: string[],
): Promise<Record<string, Partial<StockQuote>>> {
  if (!symbols.length) return {};

  try {
    const tickers = symbols.map((s) => (/^\d{4}$/.test(s) ? `${s}.T` : s));
    const results = (await yf.quote(tickers)) as any[];

    const dataMap: Record<string, Partial<StockQuote>> = {};
    results.forEach((result) => {
      if (!result || !result.symbol) return;
      const symbol = result.symbol.split(".")[0]; // "7203.T" -> "7203"
      dataMap[symbol] = {
        marketCap: result.marketCap,
        per: result.forwardPE || result.trailingPE,
        pbr: result.priceToBook,
        dividendYield: result.trailingAnnualDividendYield,
        lastPrice: result.regularMarketPrice,
        currency: result.currency,
        prevClose: result.regularMarketPreviousClose,
        sharesOutstanding: result.sharesOutstanding,
      };
    });
    return dataMap;
  } catch (error) {
    console.error("Failed to fetch batch yfinance data:", error);
    return {};
  }
}

/**
 * Lightweight Charts 用のチャートデータを取得します。
 * @param symbol 証券コード (4桁)
 */
export async function getChartData(symbol: string): Promise<ChartDataPoint[]> {
  try {
    const ticker = /^\d{4}$/.test(symbol) ? `${symbol}.T` : symbol;

    // 90日前の日付を計算 (移動平均線計算のために長めに取得)
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 365);

    const result = await yf.chart(ticker, {
      period1: from,
      interval: "1d",
    });

    if (!result || !result.quotes) return [];

    // Lightweight Charts形式 (time, open, high, low, close, volume) に変換
    return result.quotes
      .filter((d: any) => d.date && d.open !== null && d.close !== null)
      .map((d: any) => ({
        time: d.date.toISOString().split("T")[0], // YYYY-MM-DD
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume || 0,
      }));
    // slice(-30) はコンポーネント側で行うか、ここで行うか。
    // 移動平均線の計算には全期間が必要なので、ここでは全件返す。
  } catch (error) {
    console.error(`Failed to fetch chart data for ${symbol}:`, error);
    return [];
  }
}
