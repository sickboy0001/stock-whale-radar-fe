以下の機能を追加したいです。

* 履歴の登録（個人、全体）（間近１週間、間近１か月、間近３か月）
  * 要件
    * 個人でレコード（表示したとき）としもつこと
    * 対象はファンド、企業どちらも想定
    * あとで、間近で参照した企業確認できること
    * 匿名でも残るようにする
    * 間近で表示されたものを履歴として表示できること
    * 呼ばれた頻度ベースでも見れるように（間近１週間基準、１か月基準、３カ月基準などで）
    * ３カ月以前の物は削除する想定
    * 履歴はコンポーネント化して、様々な場所で利用する想定
    * 頻度ベースでのページもコンポーネント化して、様々な場所で利用する想定

テーブル案、画面案もらえるでしょうか

---

## 実装完了概要

SQLite (Turso) + Drizzle ORM を使用した閲覧履歴機能の実装が完了しました。

### 作成されたファイル一覧

| ファイル | 説明 |
|----------|------|
| [`src/db/schema/index.ts`](src/db/schema/index.ts) | `viewHistory` テーブル定義を追加 |
| [`src/lib/guest-tracker.ts`](src/lib/guest-tracker.ts) | 匿名ユーザーの Cookie 管理ユーティリティ |
| [`src/actions/record-history.ts`](src/actions/record-history.ts) | 履歴登録・削除 Server Action |
| [`src/service/view-history.ts`](src/service/view-history.ts) | 履歴取得 Service (個人履歴・注目ランキング) |

### 使用した依存関係

- `nanoid`: 匿名ユーザー ID 生成用 (インストール済み)

### 次のステップ

1. **Migration の実行**: `npx drizzle-kit push` で DB スキーマを適用
2. **コンポーネント作成**: `RecentHistoryList` と `TrendingWhales` コンポーネントの実装
3. **詳細画面への組み込み**: 各詳細画面で `recordViewHistory` を呼び出す
4. **定期タスク設定**: 3 ヶ月以上前のデータ削除ジョブの設定 (GitHub Actions など)

---

「閲覧履歴」と「注目（頻度）ランキング」は、ユーザーが再訪する理由を作る強力な機能ですね。
匿名ユーザーへの対応を含め、プロフェッショナルなフロントエンドエンジニアの視点で、スケーラブルなテーブル設計とコンポーネント構成を提案します。

---

### 1. テーブル設計案 (Turso / SQLite)

履歴データは肥大化しやすいため、**「誰が」「何を」「いつ」**見たかに特化したシンプルな構成にします。

```sql
-- 閲覧履歴テーブルの作成
CREATE TABLE view_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  guest_id TEXT,
  target_type TEXT NOT NULL CHECK(target_type IN ('entity', 'fund')),
  target_code TEXT NOT NULL,
  viewed_at TEXT DEFAULT (datetime('now'))
);

-- インデックスの作成
CREATE INDEX idx_view_history_user_guest ON view_history(user_id, guest_id);
CREATE INDEX idx_view_history_viewed_at ON view_history(viewed_at);
CREATE INDEX idx_view_history_target ON view_history(target_type, target_code);

```

**クリーニング処理 (定期削除):**
GitHub Actions等で、以下のクエリを定期実行して3ヶ月以上前のデータを削除します。
`DELETE FROM view_history WHERE viewed_at < date('now', '-3 months');`

---

### 2. 匿名ユーザー対応のロジック

フロントエンド（Next.js）側で、匿名ユーザーを識別するために `nanoid` 等で生成したUUIDをクッキー（`localStorage` ではなく、サーバーサイドでも読める `Cookie` が望ましい）に保存します。

```typescript
// hooks/useUserTracking.ts 等
import { v4 as uuidv4 } from 'uuid';
import { setCookie, getCookie } from 'cookies-next';

export const getOrCreateGuestId = () => {
  let guestId = getCookie('radar_guest_id');
  if (!guestId) {
    guestId = uuidv4();
    setCookie('radar_guest_id', guestId, { maxAge: 60 * 60 * 24 * 365 }); // 1年有効
  }
  return guestId as string;
};
```

---

### 3. コンポーネント案

#### ① パーソナル履歴コンポーネント (`RecentHistoryList`)
「最近あなたが見たクジラ」を表示します。サイドバーや検索画面の下部に配置する想定です。

```tsx
// src/components/history/RecentHistoryList.tsx
import { History, Building2, Landmark } from "lucide-react";

export const RecentHistoryList = ({ historyItems }: { historyItems: any[] }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-zinc-500 text-sm font-bold px-2">
        <History size={16} />
        <span>最近チェックした銘柄・ファンド</span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {historyItems.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-400 group-hover:text-blue-500">
                {item.target_type === 'entity' ? <Building2 size={16} /> : <Landmark size={16} />}
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{item.name}</div>
                <div className="text-[10px] text-zinc-400 font-mono">{item.target_code}</div>
              </div>
            </div>
            <div className="text-[10px] text-zinc-300">{item.relative_time}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### ② 頻度ベース・トレンドコンポーネント (`TrendingWhales`)
「今、注目されているクジラ」を表示します。期間切り替え（1W, 1M, 3M）タブを内蔵します。

```tsx
// src/components/dashboard/TrendingWhales.tsx
"use client";
import { useState } from "react";
import { Flame } from "lucide-react";

export const TrendingWhales = ({ initialData }: { initialData: any[] }) => {
  const [period, setPeriod] = useState("1w"); // '1w', '1m', '3m'

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-zinc-50 dark:border-zinc-900 flex justify-between items-center">
        <h2 className="text-sm font-black flex items-center gap-2">
          <Flame className="text-orange-500" size={18} />
          TRENDING WHALES
        </h2>
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
          {['1w', '1m', '3m'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                period === p ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600' : 'text-zinc-500'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-2 space-y-1">
        {initialData.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all group">
            <span className="text-xs font-black text-zinc-300 group-hover:text-zinc-500 w-4">{idx + 1}</span>
            <div className="flex-1">
              <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">{item.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded font-mono">{item.target_code}</span>
                <span className="text-[9px] text-zinc-400">{item.view_count} views</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### 4. 集計用クエリのロジック案

#### 頻度ベース（ランキング）の取得
期間（1週間など）で絞り込んで、ターゲットごとにカウントします。

```sql
SELECT 
    target_code, 
    target_type,
    -- ※実際にはedinet_codesやfund_codesとJOINして名称を取得
    COUNT(*) as view_count 
FROM view_history 
WHERE viewed_at >= datetime('now', '-7 days')
GROUP BY target_code, target_type
ORDER BY view_count DESC 
LIMIT 10;
```

#### 個人履歴の取得（最新10件）
ログインユーザーまたはゲストIDに基づいて取得します。

```sql
SELECT DISTINCT target_code, target_type, MAX(viewed_at) as latest_view
FROM view_history
WHERE user_id = :uid OR guest_id = :gid
GROUP BY target_code, target_type
ORDER BY latest_view DESC
LIMIT 10;
```

---

### 5. 開発を加速させるためのアドバイス

1.  **「登録」のタイミング**: 
    詳細画面の `page.tsx` (Server Component) が呼ばれた際に、バックグラウンドで `db.execute` を使って `INSERT` します。これによりフロントエンドの表示速度に影響を与えずに履歴を残せます。
2.  **匿名からログインへの引き継ぎ**:
    Google Authでログインした瞬間に、その `guest_id` に紐づく履歴を `user_id` に一括更新（UPDATE）する処理を入れると、ユーザー体験が非常に良くなります。
3.  **コンポーネントの配置場所**:
    *   `TrendingWhales`: ダッシュボードのサイドバー、検索トップ画面。
    *   `RecentHistoryList`: 検索窓のフォーカス時、または個別銘柄画面の下部。

この設計案で進めたい方向と合致しておりますでしょうか？必要であれば、具体的なAPIルートの実装例なども提示可能です。

フロントエンド開発において、閲覧履歴の登録には2つのアプローチがあります。

1.  **Next.js の Server Actions を使う方法** (推奨：APIを新設せず最速で実装可能)
2.  **Next.js の Route Handlers (API Route) を使う方法** (標準的なHTTPリクエスト)

フロントエンド側（Next.js）から直接 Turso DB にアクセスする前提として、両方のパターンと、FastAPI用に設計する場合のJSONスキーマの3つの案を提示します。

---

### 案1: Server Actions を使う場合 (Next.js 14+ 推奨)
APIのURLを定義する必要がなく、コンポーネントから直接関数として呼び出せます。セキュリティも高く、最もコード量が少なくなります。

#### 1. サーバーアクションの定義 (`src/app/actions/history.ts`)

```typescript
'use server'

import { db } from "@/lib/db";
import { cookies } from "next/headers";

interface RecordHistoryProps {
  targetCode: string;
  targetType: 'entity' | 'fund';
}

export async function recordViewHistory({ targetCode, targetType }: RecordHistoryProps) {
  // クッキーから guest_id を取得
  const cookieStore = cookies();
  const guestId = cookieStore.get('radar_guest_id')?.value;
  
  // 本来はここにログインユーザーのセッション確認を入れる
  const userId = null; 

  if (!guestId && !userId) {
    return { success: false, error: "Identifier not found" };
  }

  try {
    await db.execute({
      sql: `
        INSERT INTO view_history (user_id, guest_id, target_type, target_code)
        VALUES (?, ?, ?, ?)
      `,
      args: [userId, guestId, targetType, targetCode],
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to record history:", error);
    return { success: false, error: "DB Error" };
  }
}
```

#### 2. コンポーネント（詳細画面）での呼び出し方

```tsx
// src/app/whales/[id]/page.tsx
'use client'
import { useEffect } from 'react';
import { recordViewHistory } from '@/app/actions/history';

export default function WhaleDetailPage({ params }: { params: { id: string } }) {
  useEffect(() => {
    // 画面が開かれたら履歴に登録 (非同期でバックグラウンド実行)
    recordViewHistory({ 
      targetCode: params.id, 
      targetType: 'entity' 
    });
  }, [params.id]);

  return <div>詳細画面のコンテンツ</div>;
}
```

---

### 案2: Route Handlers を使う場合 (APIリクエスト)
「特定のURLにPOSTして登録したい」場合の、Next.js標準のAPIエンドポイントです。

#### 1. エンドポイントの定義 (`src/app/api/history/route.ts`)

```typescript
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { targetCode, targetType } = await req.json();
    
    // クッキーから取得
    const guestId = req.cookies.get('radar_guest_id')?.value;
    const userId = null; // ログインセッションがあれば取得

    if (!targetCode || !targetType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await db.execute({
      sql: "INSERT INTO view_history (user_id, guest_id, target_type, target_code) VALUES (?, ?, ?, ?)",
      args: [userId, guestId, targetType, targetCode],
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

---

### 案3: FastAPI（別Playground検討用）で実装する場合のAPI定義

もし全てのデータ登録をバックエンド（FastAPI）に集約させる場合の、エンドポイントのインターフェース設計（JSONスキーマ）です。

*   **URL**: `POST /api/v1/history`
*   **Request Body (JSON)**:

```json
{
  "target_code": "E01234",
  "target_type": "entity",
  "user_id": "usr_99999", 
  "guest_id": "uuid-xxxx-xxxx-xxxx"
}
```
※FastAPIで受ける場合は、フロント側から `user_id` または `guest_id` を明示的にBodyに載せて送る必要があります。

---

### プロとしての選定アドバイス

このSaaS（個人開発）においては、**案1（Server Actions）**が圧倒的におすすめです。
*   **理由**: APIのルーティング（URL管理）が不要になり、フロントエンドのコードからシームレスにDBへ書き込めるため、開発スピードが非常に速くなります。

この Server Actions の実装で、フロントエンド側を構築していきましょうか？