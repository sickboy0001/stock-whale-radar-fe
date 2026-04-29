## Recent Whale Movements

間近ので大量保有者の動きを表示する機能です。
「直近1ヶ月間の**義務発生日**を基準に、株価（時価総額）を考慮した**『移動金額（推計）』が大きい順**のトップ30」を表示するランキング画面で、左のメニューから選択できる画面とする

以下での実装を措定しています。

URL:http://localhost:3000/rader/RecentWhaleMovements
コンポーネント：src\components\pages\RecentWhaleMovements.tsx


### 1. ロジックの設計

この画面を実現するために、以下のステップでデータを処理します。

1.  **DB（Turso）から抽出**: 直近1ヶ月の `obligation_date` を持つ `ownership_reports` と `documents` を結合して取得。
2.  **時価総額の取得**: 該当する銘柄の最新時価総額を **yFinance** から取得。
3.  **計算**: `(今回保有比率 - 前回保有比率) × 時価総額` ＝ **移動推計額** を算出。
4.  **ランキング**: 移動推計額の絶対値が大きい順にソートし、上位30件を抽出。

---

### 2. バックエンド（データ取得ロジック）

Next.jsの Server Component で動作する、データ集計のイメージです。

```typescript
// src/lib/ranking.ts
import { db } from "@/lib/db";
import yahooFinance from 'yahoo-finance2';

export async function getTopWhaleMovements() {
  // 1. 直近1ヶ月の報告書を取得
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const reports = await db.execute({
    sql: `
      SELECT 
        d.sec_code, d.issuer_name, d.submitter_name,
        o.obligation_date, o.holding_ratio, o.prev_holding_ratio, o.holding_purpose
      FROM ownership_reports o
      JOIN documents d ON o.doc_id = d.doc_id
      WHERE o.obligation_date >= ?
      ORDER BY o.obligation_date DESC
    `,
    args: [oneMonthAgo.toISOString().split('T')[0]]
  });

  // 2. 銘柄ごとの時価総額を取得して移動額を計算
  // (実際には複数の銘柄をまとめてyFinanceに投げる最適化を推奨)
  const results = await Promise.all(reports.rows.map(async (row) => {
    const ticker = `${row.sec_code.toString().substring(0, 4)}.T`;
    const quote = await yahooFinance.quote(ticker);
    const marketCap = quote.marketCap || 0;
    
    const ratioDiff = (row.holding_ratio as number) - (row.prev_holding_ratio as number);
    const movementValue = marketCap * (ratioDiff / 100);

    return {
      ...row,
      ratioDiff,
      movementValue, // これがランキングの基準
      currentPrice: quote.regularMarketPrice,
    };
  }));

  // 3. 移動額の絶対値でソートしてTOP 30を返す
  return results
    .sort((a, b) => Math.abs(b.movementValue) - Math.abs(a.movementValue))
    .slice(0, 30);
}
```

---

### 3. フロントエンド UI 実装 (Tailwind CSS)

添付いただいた画像のトーン＆マナーに合わせたランキング画面の実装案です。

```tsx
// src/components/pages/WhaleRanking.tsx
import { TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";

export const WhaleRanking = ({ data }: { data: any[] }) => {
  return (
    <div className="space-y-6 p-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight">大口投資家 動向ランキング</h1>
        <p className="text-zinc-500 mt-1">直近1ヶ月の義務発生日ベース / 移動推計額 TOP 30</p>
      </header>

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 border-b border-zinc-100 text-zinc-500 text-xs uppercase font-bold">
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">義務発生日 / 銘柄</th>
              <th className="px-6 py-4">投資家</th>
              <th className="px-6 py-4 text-right">保有比率変化</th>
              <th className="px-6 py-4 text-right">移動推計額</th>
              <th className="px-6 py-4">保有目的</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                    index < 3 ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {index + 1}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-[10px] text-zinc-400 font-mono mb-1">{item.obligation_date}</div>
                  <div className="font-bold text-zinc-900">{item.issuer_name}</div>
                  <div className="text-xs text-zinc-400">{item.sec_code.toString().substring(0,4)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                    {item.submitter_name}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className={`text-sm font-bold flex items-center justify-end gap-1 ${
                    item.ratioDiff > 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {item.ratioDiff > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {item.ratioDiff > 0 ? '+' : ''}{item.ratioDiff.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {item.prev_holding_ratio}% → {item.holding_ratio}%
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className={`text-base font-black ${
                    item.ratioDiff > 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {item.movementValue > 0 ? '▲' : '▼'} 
                    {Math.abs(item.movementValue / 100000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    <span className="text-xs ml-0.5">億円</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-[10px] leading-relaxed text-zinc-500 max-w-[200px] line-clamp-2">
                    {item.holding_purpose}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

---

### 4. ブラッシュアップのためのアドバイス

1.  **「買い増し」と「減らし」の切り替え**:
    タブ（Tabs）を用意して、「買い増し（純増）ランキング」と「売り出し（純減）ランキング」を切り替えられるようにすると、ユーザーがより特定の投資戦略（例：空売りの買い戻し探しなど）を見つけやすくなります。

2.  **移動額の精度**:
    義務発生日の終値を使って計算するのが理想的ですが、過去の特定日の終値を yFinance で全件取得するのは API 制限に当たりやすいため、まずは **「最新の時価総額」** をベースにした「現在価値に直すとこれくらい動いた」という推計値から始めるのが賢明です。

3.  **Skeleton Screen の導入**:
    yFinance と Turso 両方からのデータ取得には数秒かかる場合があるため、読み込み中は Skeleton（グレーの線が動くやつ）を表示させると、ユーザー体験が向上します。

このランキング画面を実装するための、より具体的な SQL や API 連携部分の詳細が必要であれば、引き続きサポートします！