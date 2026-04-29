import YahooFinance from "yahoo-finance2";

// yahoo-finance2 v2系では環境によってインスタンス化が必要な場合があります。
// エラーメッセージの推奨に従い、インスタンスを生成して使用します。
const yf = new (YahooFinance as any)();

/**
 * yfinance (Yahoo Finance) から銘柄の時価情報を取得します。
 * @param symbol 証券コード (4桁) またはティッカーシンボル (例: "7203.T")
 */
export async function getStockQuote(symbol: string) {
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
  } catch (error) {
    console.error(`Failed to fetch yfinance data for ${symbol}:`, error);
    return null;
  }
}

/**
 * 複数の銘柄の時価情報を一括取得します。
 * @param symbols 証券コード (4桁) またはティッカーシンボルの配列
 */
export async function getBatchStockQuotes(symbols: string[]) {
  if (!symbols.length) return {};

  try {
    const tickers = symbols.map((s) => (/^\d{4}$/.test(s) ? `${s}.T` : s));
    const results = (await yf.quote(tickers)) as any[];

    const dataMap: Record<string, any> = {};
    results.forEach((result) => {
      if (!result) return;
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
