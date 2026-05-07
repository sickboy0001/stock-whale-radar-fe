
---

# 機能仕様書：投資家インテリジェンス・パネル (Entity Intelligence)

## 1. 目的
投資家（クジラ）の名称だけでは判別が難しい背景情報（運用方針、設立、拠点、運用資産額など）を自動収集し、Googleのナレッジパネル形式で表示することで、ユーザーの分析を強力にサポートする。

## 2. データベース設計 (`investor_profiles`)
Next.js から直接 Turso へアクセスし、情報をキャッシュします。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `edinet_code` | TEXT (PK) | 投資家を識別する一意のコード |
| `summary` | TEXT | 投資家の概要（日本語） |
| `aum` | TEXT | 運用資産残高 (Assets Under Management) |
| `established` | TEXT | 設立日 |
| `key_people` | TEXT | 創業者、CEO、CIOなど |
| `location` | TEXT | 本社所在地 |
| `website` | TEXT | 公式サイトURL |
| `last_updated` | TEXT | データの最終更新日(yyyy-MM-dd形式で保存) |

---

## 3. データ取得ロジック（キャッシュ・ファースト戦略）
Next.js の Server Component 内で以下のフローを実行します。

1.  **DB確認**: Turso DB に `edinet_code` に紐づくプロフィールがあるか確認。
2.  **表示**: データがあり、かつ更新が新しい（例：1ヶ月以内）場合はそのまま表示。
3.  **自動生成 (Background Fetch)**: 
    *   データがない、または古い場合、Wikipedia API または **Google Gemini API (Server-side SDK)** を呼び出す。
    *   取得した構造化データを Turso DB に `UPSERT`（保存/更新）する。
    *   ユーザーには生成されたばかりの情報を表示する。

---

## 4. 実装コード案

### 1 プロフィール取得用サービス (`src/service/investor-intel.ts`)
Gemini API を使って、ネット上の断片的な情報から構造化データを生成する例です。

```typescript
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getOrGenerateProfile(edinetCode: string, name: string, forceRefresh = false) {
  // 1. キャッシュ確認（forceRefreshがfalseの場合のみ）
  if (!forceRefresh) {
    const cached = await db.execute({
      sql: "SELECT * FROM investor_profiles WHERE edinet_code = ?",
      args: [edinetCode]
    });
    if (cached.rows.length > 0) {
      const data = cached.rows[0];
      // key_peopleはJSON文字列で入っているためパース
      return { ...data, key_people: JSON.parse(data.key_people as string) };
    }
  }

  // 2. Gemini API で情報生成
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" } // JSON出力を強制
  });

  const prompt = `${name}（EDINETコード: ${edinetCode}）という投資家・運用会社について、以下の情報を日本語で調査しJSON形式で回答してください。
    項目: 概要(summary), 運用資産額(aum), 設立年(established), 主要人物(key_people), 本社所在地(location), 公式サイト(website)
    
    【重要ルール】
    - key_peopleは [{ "name": "...", "role": "..." }] の形式にしてください。
    - 不明な項目は空文字ではなく "不明" と記載してください。
    - 投資方針や近年の活動を含めた要約をsummaryに記載してください。`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const response = JSON.parse(text);

    // 3. TursoにUPSERT (last_updatedは yyyy-MM-dd)
    const today = new Date().toISOString().split('T')[0];
    
    await db.execute({
      sql: `INSERT OR REPLACE INTO investor_profiles 
            (edinet_code, summary, aum, established, key_people, location, website, last_updated) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        edinetCode, 
        response.summary, 
        response.aum, 
        response.established, 
        JSON.stringify(response.key_people), // 配列を文字列化して保存
        response.location, 
        response.website,
        today
      ]
    });

    return { ...response, edinet_code: edinetCode, last_updated: today };
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return null;
  }
}
```


### 2 サーバーアクション (`src/app/actions/investor-profile.ts`)
UI（クライアントコンポーネント）から「再取得」や「手動更新」を行うための関数です。

```typescript
'use server'

import { db } from "@/lib/db";
import { getOrGenerateProfile } from "@/service/investor-intel";
import { revalidatePath } from "next/cache";

// AIからの再取得
export async function refreshProfileFromAI(edinetCode: string, name: string) {
  await getOrGenerateProfile(edinetCode, name, true);
  revalidatePath(`/entity/holder/${edinetCode}`);
}

// 手動でのプロフィール更新
export async function updateInvestorProfile(edinetCode: string, formData: any) {
  const today = new Date().toISOString().split('T')[0];
  await db.execute({
    sql: `UPDATE investor_profiles SET summary=?, aum=?, established=?, location=?, website=?, last_updated=? WHERE edinet_code=?`,
    args: [formData.summary, formData.aum, formData.established, formData.location, formData.website, today, edinetCode]
  });
  revalidatePath(`/entity/holder/${edinetCode}`);
}
```


### 3 UI コンポーネント (`src/components/investor/InvestorKnowledgeCard.tsx`)
Googleナレッジパネル風のデザインに、「更新」ボタンなどの運用機能を追加しました。

```tsx
'use client'

import React, { useState } from 'react';
import { Globe, Users, MapPin, Calendar, DollarSign, RefreshCw, Edit3 } from "lucide-react";
import { refreshProfileFromAI } from "@/app/actions/investor-profile";

export const InvestorKnowledgeCard = ({ profile, name }: { profile: any, name: string }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfileFromAI(profile.edinet_code, name);
    setIsRefreshing(false);
  };

  if (!profile) return (
    <div className="p-6 border-2 border-dashed border-zinc-200 rounded-2xl text-center">
      <p className="text-sm text-zinc-500 mb-4">プロフィール未生成です</p>
      <button onClick={handleRefresh} className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all">
        <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
        AIでプロフィールを生成
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm sticky top-6">
      {/* 概要セクション */}
      <div className="p-5 border-b border-zinc-50 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Entity Intelligence</h3>
          <div className="flex gap-2">
             <button onClick={handleRefresh} title="AIで再更新" className="text-zinc-400 hover:text-blue-500 transition-colors">
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
             </button>
             <button title="手動修正" className="text-zinc-400 hover:text-emerald-500 transition-colors">
                <Edit3 size={14} />
             </button>
          </div>
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
          "{profile.summary}"
        </p>
      </div>

      {/* スペックリスト */}
      <div className="p-5 space-y-4">
        <InfoRow icon={<DollarSign size={16} />} label="運用資産額" value={profile.aum} />
        <InfoRow icon={<Calendar size={16} />} label="設立" value={profile.established} />
        
        {/* 主要人物（配列の展開） */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-zinc-400"><Users size={16} /></div>
          <div className="flex-1">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">主要人物</p>
            <div className="space-y-1 mt-1">
              {profile.key_people?.map((person: any, i: number) => (
                <div key={i} className="text-xs">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{person.name}</span>
                  <span className="text-zinc-500 ml-1.5">— {person.role}</span>
                </div>
              )) || "不明"}
            </div>
          </div>
        </div>

        <InfoRow icon={<MapPin size={16} />} label="本社所在地" value={profile.location} />

        {/* 公式サイトリンク */}
        {profile.website && profile.website !== "不明" && (
          <div className="pt-4 border-t border-zinc-50 dark:border-zinc-800">
            <a href={profile.website} target="_blank" className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline">
              <Globe size={14} />
              Official Website
            </a>
          </div>
        )}
        
        <div className="text-[9px] text-zinc-300 text-right mt-4">
          Last Updated: {profile.last_updated}
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }: any) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-zinc-400">{icon}</div>
    <div>
      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{value}</p>
    </div>
  </div>
);
```

---

## 5. 運用のポイント

1.  **プロフィールの手動修正**:
    手動での修正や、再度AIからの取り込みも可能とする
2.  **オンデマンド生成**:
    「すべての投資家」のプロフィールを事前に作る必要はありません。**「誰かが見た時だけ作る」**ことで、API料金とDB容量を節約できます。
3.  **UI/UXの連動**: 再取得ボタンに `animate-spin` を付与し、処理中であることを明示。さらに `revalidatePath` を使うことで、DB更新後に即座に画面が最新情報に切り替わるようにしています。


