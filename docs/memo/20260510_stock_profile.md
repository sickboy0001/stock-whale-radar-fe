
# 機能仕様書：企業インテリジェンス・パネル (Stock Intelligence)

## 1. 目的
銘柄の正式名称だけでは分かりにくい「具体的な事業内容」「市場でのポジション」「企業の歴史」などをAIで自動収集し、ナレッジパネル形式で表示することで、銘柄分析の効率を最大化する。

## 2. データベース設計 (`stock_profiles`)
証券コード（5桁）を主キーとして情報をキャッシュします。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `sec_code` | TEXT (PK) | 証券コード（例: 83060） |
| `official_name` | TEXT | 正式名称（EDINET/マスタデータ） |
| `display_name` | TEXT | AIが生成した読みやすい通称（例: 三菱UFJ） |
| `summary` | TEXT | 事業内容の概要（日本語） |
| `business_model` | TEXT | 収益の柱・ビジネスモデルの詳細 |
| `established` | TEXT | 設立日 |
| `key_people` | TEXT | 代表者、創業者など（JSON形式） |
| `location` | TEXT | 本社所在地 |
| `website` | TEXT | 公式サイトURL |
| `last_updated` | TEXT | 最終更新日(yyyy-MM-dd) |

---

## 3. 実装コード案

### ① プロフィール取得用サービス (`src/service/stock-intel.ts`)

```typescript
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getOrGenerateStockProfile(secCode: string, officialName: string, forceRefresh = false) {
  // 1. キャッシュ確認
  if (!forceRefresh) {
    const cached = await db.execute({
      sql: "SELECT * FROM stock_profiles WHERE sec_code = ?",
      args: [secCode]
    });
    if (cached.rows.length > 0) {
      const data: any = cached.rows[0];
      return { ...data, key_people: JSON.parse(data.key_people) };
    }
  }

  // 2. Gemini API で情報生成
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    対象企業: "${officialName}" (証券コード: ${secCode})
    上記の日本の上場企業について調査し、投資家向けに要約して以下のJSON形式で回答してください。

    【重要ルール】
    - display_name は、一般的で読みやすい社名にしてください（例: "トヨタ自動車"）。
    - summary は、何をしている会社か、主要な事業内容を200文字程度で記載してください。
    - business_model は、どの事業で稼いでいるのか、市場シェアや強みを含めて記載してください。
    - key_people は [{ "name": "...", "role": "..." }] の形式にしてください。
    - 不明な項目は "不明" と記載してください。

    項目:
    - display_name, summary, business_model, established, key_people, location, website
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = JSON.parse(result.response.text());
    const today = new Date().toISOString().split('T')[0];

    // 3. TursoにUPSERT
    await db.execute({
      sql: `INSERT OR REPLACE INTO stock_profiles 
            (sec_code, official_name, display_name, summary, business_model, established, key_people, location, website, last_updated) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        secCode, 
        officialName, 
        response.display_name, 
        response.summary, 
        response.business_model,
        response.established, 
        JSON.stringify(response.key_people), 
        response.location, 
        response.website,
        today
      ]
    });

    return { ...response, sec_code: secCode, last_updated: today };
  } catch (error) {
    console.error("Stock Gemini Generation Error:", error);
    return null;
  }
}
```

### ② サーバーアクション (`src/app/actions/stock-profile.ts`)

```typescript
'use server'

import { getOrGenerateStockProfile } from "@/service/stock-intel";
import { revalidatePath } from "next/cache";

export async function refreshStockProfile(secCode: string, officialName: string) {
  await getOrGenerateStockProfile(secCode, officialName, true);
  revalidatePath(`/stock/${secCode.substring(0, 4)}`); // 銘柄詳細ページを再読込
}
```

### ③ UI コンポーネント (`src/components/stock/StockKnowledgeCard.tsx`)

```tsx
'use client'

import React, { useState } from 'react';
import { Globe, Users, MapPin, Calendar, Briefcase, RefreshCw, Info } from "lucide-react";
import { refreshStockProfile } from "@/app/actions/stock-profile";

export const StockKnowledgeCard = ({ profile, officialName, secCode }: { profile: any, officialName: string, secCode: string }) => {
  const [loading, setLoading] = useState(false);

  const onRefresh = async () => {
    setLoading(true);
    await refreshStockProfile(secCode, officialName);
    setLoading(false);
  };

  if (!profile) return (
    <button onClick={onRefresh} className="w-full p-6 border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-500 hover:bg-zinc-50 transition-all text-xs font-bold">
      {loading ? <RefreshCw className="animate-spin mx-auto" /> : "AIで企業プロフィールを生成"}
    </button>
  );

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm sticky top-6">
      {/* ヘッダーエリア */}
      <div className="p-5 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/30">
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 leading-tight">
            {profile.display_name}
          </h2>
          <button onClick={onRefresh} className="text-zinc-300 hover:text-blue-500 transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <p className="text-[10px] text-zinc-400 font-medium uppercase">{officialName}</p>
      </div>

      {/* 事業概要 */}
      <div className="p-5 border-b border-zinc-50 dark:border-zinc-800">
        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1">
          <Info size={12} /> Business Summary
        </h3>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
          "{profile.summary}"
        </p>
      </div>

      {/* ビジネスモデル・強み */}
      <div className="p-5 border-b border-zinc-50 dark:border-zinc-800 bg-blue-50/10">
        <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1">
          <Briefcase size={12} /> Strengths & Model
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {profile.business_model}
        </p>
      </div>

      {/* スペックリスト */}
      <div className="p-5 space-y-4">
        <InfoItem icon={<Calendar size={16}/>} label="設立" value={profile.established} />
        
        <div className="flex items-start gap-3 text-sm">
          <Users size={16} className="text-zinc-400 mt-1" />
          <div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">代表者 / 役員</p>
            {profile.key_people?.map((p: any, i: number) => (
              <div key={i} className="font-semibold text-zinc-800 dark:text-zinc-200">
                {p.name} <span className="text-[10px] font-normal text-zinc-500 ml-1">({p.role})</span>
              </div>
            ))}
          </div>
        </div>

        <InfoItem icon={<MapPin size={16}/>} label="本社所在地" value={profile.location} />

        {profile.website && profile.website !== "不明" && (
          <div className="pt-2">
            <a href={profile.website} target="_blank" className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline">
              <Globe size={14} /> 公式サイト
            </a>
          </div>
        )}
        
        <div className="text-[9px] text-zinc-300 text-right mt-4">
          Last AI Update: {profile.last_updated}
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }: any) => (
  <div className="flex items-start gap-3 text-sm">
    <div className="text-zinc-400 mt-1">{icon}</div>
    <div>
      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{label}</p>
      <p className="font-semibold text-zinc-800 dark:text-zinc-200">{value}</p>
    </div>
  </div>
);
```

---

## 4. 運用の工夫（プロのアドバイス）

1.  **表示場所の使い分け**:
    *   **Investor Insights (投資家画面)** では、右側にこのカードを配置。
    *   **Stock Insights (銘柄画面)** でも、右側に配置することで、チャートを見ながら「この会社は何の会社か」を即座に把握できるようにします。
2.  **ビジネスモデルの重要性**:
    投資家にとって企業の設立年よりも「どうやって稼いでいるか」の方が重要です。そのため、`business_model` カラムを目立つ位置に配置しています。
3.  **証券コードの紐付け**:
    投資家プロフィール（`edinet_code`）と異なり、企業は `sec_code` で管理するのが最も確実です（EDINETコードも持っていますが、株価やマスタとの連携は証券コードの方が容易なため）。

この「銘柄版インテリジェンス・パネル」を追加することで、あなたのアプリは**「EDINETの情報を読むサイト」から「企業のビジネスと投資家を同時に分析できるツール」**へとランクアップします。