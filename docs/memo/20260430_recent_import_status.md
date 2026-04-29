「全体の俯瞰」から「直近の実行結果にフォーカスする」という、運用フェーズで非常に役立つ画面設計ですね。

最終的にダッシュボードの1つのパーツ（コンポーネント）として埋め込むことを想定し、**「一目で異常（失敗）を検知でき、かつ最近の進捗が手に取るようにわかる」**高密度なUIコードを提案します。

### 1. SQL クエリの設計
直近10営業日分（対象件数があるもの）を取得するためのクエリです。

```sql
SELECT 
  target_date,
  status,
  total_docs_count,
  target_docs_count,
  success_count,
  last_run_start_at,
  last_run_end_at,
  error_message
FROM import_daily_status
WHERE target_docs_count >= 1 -- 1件以上の対象がある日
ORDER BY target_date DESC     -- 直近から
LIMIT 10;                     -- 10件分
```

---

### 2. コンポーネントの実装案
将来的にダッシュボードへの埋め込みを考慮し、再利用可能なコンポーネントとして作成します。

#### ファイルパス: `src/components/dashboard/RecentImportStatus.tsx`

```tsx
"use client";

import React from 'react';
import { CheckCircle2, AlertCircle, Clock, Loader2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

type ImportStatus = {
  target_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  target_docs_count: number;
  success_count: number;
  last_run_start_at: string;
};

export const RecentImportStatus = ({ data }: { data: ImportStatus[] }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock className="text-zinc-400" size={18} />
          <h2 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">Recent Import Status (Last 10 Days)</h2>
        </div>
        <a href="/daily_status" className="text-xs text-blue-600 hover:underline flex items-center">
          View All <ChevronRight size={14} />
        </a>
      </div>
      
      <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
        {data.map((day) => (
          <div key={day.target_date} className="px-6 py-3 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
            {/* 左側：日付とステータス */}
            <div className="flex items-center gap-4">
              <div className="text-xs font-mono font-bold text-zinc-500 w-24">
                {day.target_date}
              </div>
              <StatusIndicator status={day.status} />
            </div>

            {/* 中央：進捗バー */}
            <div className="flex-1 max-w-[200px] px-8 hidden md:block">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-zinc-400 font-medium">Progress</span>
                <span className="font-bold">{day.success_count} / {day.target_docs_count}</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${day.status === 'failed' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${(day.success_count / day.target_docs_count) * 100}%` }}
                />
              </div>
            </div>

            {/* 右側：開始時刻 */}
            <div className="text-[10px] text-zinc-400 text-right">
              {day.last_run_start_at ? format(new Date(day.last_run_start_at), 'HH:mm:ss') : '--:--'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ステータス表示の小コンポーネント
const StatusIndicator = ({ status }: { status: string }) => {
  const config = {
    completed: { icon: <CheckCircle2 size={16} />, color: "text-emerald-500", label: "Success" },
    failed: { icon: <AlertCircle size={16} />, color: "text-rose-500", label: "Failed" },
    processing: { icon: <Loader2 size={16} className="animate-spin" />, color: "text-blue-500", label: "Running" },
    pending: { icon: <Clock size={16} />, color: "text-zinc-400", label: "Pending" },
  }[status] || { icon: <Clock size={16} />, color: "text-zinc-400", label: "Unknown" };

  return (
    <div className={`flex items-center gap-1.5 ${config.color}`}>
      {config.icon}
      <span className="text-[10px] font-black uppercase tracking-wider">{config.label}</span>
    </div>
  );
};
```

---

### 3. ページの実装案
#### ファイルパス: `src/app/recent_daily_status/page.tsx`

```tsx
import { db } from "@/lib/db";
import { RecentImportStatus } from "@/components/dashboard/RecentImportStatus";

export default async function RecentDailyStatusPage() {
  // Tursoからデータを直接取得
  const res = await db.execute(`
    SELECT * FROM import_daily_status 
    WHERE target_docs_count >= 1 
    ORDER BY target_date DESC 
    LIMIT 10
  `);

  const data = res.rows as any;

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tighter">RECENT RADAR LOGS</h1>
        <p className="text-zinc-500">直近10営業日のデータインポート状況の集約</p>
      </div>

      <RecentImportStatus data={data} />
      
      {/* 補足情報のカード（必要に応じて） */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-500">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50">
          <strong>モニタリングのヒント:</strong>
          <p className="mt-1">
            失敗(Failed)が続く場合は、EDINET APIの仕様変更、またはGitHub Actionsのシークレット期限切れを確認してください。
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### 4. 開発のポイント

1.  **ダッシュボードへの統合**:
    この `RecentImportStatus` コンポーネントを `app/dashboard/page.tsx` などに配置すれば、メイン画面で常に最新のインポート状況を監視できます。
2.  **異常値の検知**:
    もし10営業日のうち「失敗」が1つでも含まれていれば、タイトル横に赤いドットを表示するなどのカスタマイズを加えると、より「レーダー（監視ツール）」としての価値が高まります。
3.  **メニューへの追加**:
    `sidebar.tsx` 等のコンポーネントに `/recent_daily_status` へのリンクを追加し、アイコンには `LayoutDashboard` や `Activity` を使うと馴染みが良いです。

こちらのコードで、実装イメージに合致しておりますでしょうか？必要であれば、サイドメニューの実装例なども提供可能です。