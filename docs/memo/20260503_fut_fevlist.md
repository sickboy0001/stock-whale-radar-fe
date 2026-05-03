「閲覧履歴」および「注目ランキング」機能の追加ですね。
ユーザーがどの銘柄やファンドに注目しているかを可視化することは、SaaSとしての回遊性を高める非常に重要な機能です。

プロのエンジニア視点で、**「パーソナル履歴（自分用）」**と**「トレンド（全体用）」**を統合した機能仕様書と実装案をまとめました。

---

# 機能仕様書：閲覧アクティビティ・インスペクター

## 1. 目的
*   ユーザーが過去にチェックした銘柄・ファンドに素早く再アクセスできるようにする。
*   全ユーザーの閲覧統計から、今まさに「どのクジラが注目されているか」を可視化する。

## 2. 閲覧トラッキング（データ登録）
*   **トリガー**: 企業詳細画面、またはファンド詳細画面が表示された時。
*   **登録先**: `view_history` テーブル。
*   **識別ロジック**:
    *   ログイン時: `user_id`（Google Auth ID）を記録。
    *   未ログイン時: `guest_id`（クッキーに保存したUUID）を記録。

## 3. 画面仕様（参照機能）
閲覧履歴画面（例：`/activity`）は以下の2つのセクションで構成します。

### A. パーソナル履歴（Your Recent Activity）
*   **表示対象**: 現在のユーザー（ログインIDまたはゲストID）に紐づく過去の閲覧データ。
*   **表示件数**: 直近20件（重複は排除し、最新の閲覧日時でソート）。
*   **自動削除**: 3ヶ月以上前のデータはバッチ処理で削除。

### B. トレンドランキング（Trending Whales）
*   **表示対象**: 全ユーザーの閲覧ログを期間集計したもの。
*   **切替タブ**: 「24時間以内」「1週間」「1ヶ月」。
*   **ロジック**: `target_code` ごとに `COUNT(*)` し、降順で表示。

---

## 4. 実装コード案

### ① データ取得用 SQL（Server Action / Service層）

```typescript
// src/service/history.ts
import { db } from "@/lib/db";

// 個人履歴の取得
export async function getPersonalHistory(identifier: { userId?: string; guestId?: string }) {
  return await db.execute({
    sql: `
      SELECT target_type, target_code, MAX(viewed_at) as last_viewed
      FROM view_history
      WHERE user_id = ? OR guest_id = ?
      GROUP BY target_type, target_code
      ORDER BY last_viewed DESC
      LIMIT 20
    `,
    args: [identifier.userId || null, identifier.guestId || null]
  });
}

// トレンド（全体）の取得
export async function getTrendingWhales(period: '24h' | '7d' | '30d') {
  const intervalMap = { '24h': '-1 day', '7d': '-7 days', '30d': '-30 days' };
  
  return await db.execute({
    sql: `
      SELECT target_type, target_code, COUNT(*) as view_count
      FROM view_history
      WHERE viewed_at >= datetime('now', ?)
      GROUP BY target_type, target_code
      ORDER BY view_count DESC
      LIMIT 10
    `,
    args: [intervalMap[period]]
  });
}
```

### ② 画面 UI コンポーネント (`src/components/pages/ActivityPage.tsx`)

デザインは、これまでの「Whale Radar」のトーン（ダークネイビー／白）に合わせ、高密度なリスト形式にします。

```tsx
"use client";
import { History, Flame, Building2, Landmark, ChevronRight } from "lucide-react";
import { useState } from "react";

export const ActivityPage = ({ personalData, trendingData }: any) => {
  const [period, setPeriod] = useState('7d');

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      {/* セクション1: あなたの履歴 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="text-zinc-400" size={20} />
          <h2 className="text-xl font-bold italic">YOUR HISTORY</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {personalData.map((item: any) => (
            <HistoryCard key={item.target_code} item={item} />
          ))}
        </div>
      </section>

      {/* セクション2: トレンド */}
      <section className="space-y-4">
        <div className="flex justify-between items-end border-b border-zinc-100 pb-2">
          <div className="flex items-center gap-2">
            <Flame className="text-orange-500" size={20} />
            <h2 className="text-xl font-bold italic">TRENDING NOW</h2>
          </div>
          <div className="flex gap-2">
            {['24h', '7d', '30d'].map((p) => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)}
                className={`text-[10px] font-black px-3 py-1 rounded-full transition-all ${
                  period === p ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          {trendingData.map((item: any, idx: number) => (
            <TrendingItem key={item.target_code} item={item} rank={idx + 1} />
          ))}
        </div>
      </section>
    </div>
  );
};

// 小コンポーネント：履歴カード
const HistoryCard = ({ item }: any) => (
  <div className="p-4 bg-white border border-zinc-200 rounded-xl hover:border-blue-500 transition-all cursor-pointer group flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${item.target_type === 'entity' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
        {item.target_type === 'entity' ? <Building2 size={18} /> : <Landmark size={18} />}
      </div>
      <div>
        <div className="text-sm font-bold text-zinc-900">{item.target_code}</div>
        <div className="text-[10px] text-zinc-400">{item.last_viewed}</div>
      </div>
    </div>
    <ChevronRight className="text-zinc-300 group-hover:text-blue-500 transition-colors" size={16} />
  </div>
);

// 小コンポーネント：トレンド項目
const TrendingItem = ({ item, rank }: any) => (
  <div className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0">
    <span className="text-lg font-black text-zinc-200 w-6">{rank}</span>
    <div className="flex-1 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.target_type === 'entity' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {item.target_type.toUpperCase()}
        </span>
        <span className="font-bold text-zinc-800">{item.target_code}</span>
      </div>
      <div className="text-xs font-mono text-zinc-400">{item.view_count} views</div>
    </div>
  </div>
);
```

---

### プロのアドバイス：開発を加速させる工夫

1.  **名称の結合 (JOIN)**:
    `view_history` には `code` しか入っていませんが、画面表示の際には `edinet_codes` や `fund_codes` と JOIN して「社名」や「ファンド名」を表示するようにしてください。
2.  **ゲスト履歴の引き継ぎ**:
    ログインに成功したタイミングで、`UPDATE view_history SET user_id = :uid WHERE guest_id = :gid` を一回実行すると、未ログイン時の履歴がアカウントに統合され、非常に親切な UX になります。
3.  **Netlifyでのパフォーマンス**:
    トレンドランキングは全ページ共通で頻繁に呼ばれるため、Next.js の `revalidatePath` または `revalidateTag` を使い、1時間程度のキャッシュを効かせると、Turso への負荷を大幅に軽減できます。

この構成で、まずは「履歴の記録」と「一覧表示」から着手してみるのはいかがでしょうか？必要であれば、Turso への UPSERT ロジックの詳細も作成可能です。