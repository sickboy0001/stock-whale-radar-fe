FastAPIを使用せず、**Next.js (Server Components/Actions) から直接 Turso DB と外部APIを操作する**構成での「投資家プロフィール自動生成機能」の仕様書をまとめました。

この仕様により、誰かがその投資家のページを開いた瞬間に、AIやWikipediaから情報を自動収集し、DBにキャッシュして表示することが可能になります。

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

### ① プロフィール取得用サービス (`src/service/investor-intel.ts`)
Gemini API を使って、ネット上の断片的な情報から構造化データを生成する例です。

```typescript
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getOrGenerateProfile(edinetCode: string, name: string) {
  // 1. DBから既存キャッシュを確認
  const cached = await db.execute({
    sql: "SELECT * FROM investor_profiles WHERE edinet_code = ?",
    args: [edinetCode]
  });

  if (cached.rows.length > 0) return cached.rows[0];

  // 2. キャッシュがない場合、Geminiで情報を生成（Google検索風に）
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `${name}という投資家・運用会社について、以下の情報を日本語で調査しJSON形式で回答してください。
    項目: 概要(summary), 運用資産額(aum), 設立年(established), 主要人物(key_people), 本社所在地(location), 公式サイト(website)
    返答例
    {
    "summary": "香港に拠点を置く独立系の投資運用会社で、主にアクティビスト（物言う株主）として知られています。2002年にセス・フィッシャーによって設立され、日本市場を含むアジア圏でのコーポレート・ガバナンス改革の推進や、企業価値向上を目的とした積極的な投資活動を展開しています。近年では花王や小林製薬、ニデックなどの日本企業に対しても経営改善や株主提案を積極的に行っています。",
    "aum": "約140億米ドル（2026年時点の推計値）",
    "established": "2002年",
    "key_people": [
      {
        "name": "Seth H. Fischer（セス・フィッシャー）",
        "role": "Founder and Chief Investment Officer"
      },
      {
        "name": "Phillip Meyer（フィリップ・メイヤー）",
        "role": "General Counsel, CCO and Co-COO"
      }
    ],
    "location": "LHT Tower, 31 Queen's Road Central, Hong Kong（香港本社）",
    "website": "https://oasiscm.com"
  }
    `;

  const result = await model.generateContent(prompt);
  const response = JSON.parse(result.response.text());

  // 3. Tursoにキャッシュとして保存
  await db.execute({
    sql: `INSERT OR REPLACE INTO investor_profiles 
          (edinet_code, summary, aum, established, key_people, location, website) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [edinetCode, response.summary, response.aum, response.established, response.key_people, response.location, response.website]
  });

  return response;
}
```

### ② UI コンポーネントの配置
「投資家詳細分析」ページの右側に配置することを想定したグリッドレイアウトです。

```tsx
// src/app/entity/holder/[id]/page.tsx
export default async function InvestorInsightsPage({ params }: { params: { id: string } }) {
  const investorName = "オアシス・マネジメント"; // DBから取得
  const profile = await getOrGenerateProfile(params.id, investorName);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-8">
      {/* 左側: メインの保有銘柄や履歴 (既存) */}
      <div className="flex-1">
         <InvestorMainContent />
      </div>

      {/* 右側: ナレッジパネル (新規) */}
      <aside className="w-full lg:w-80 shrink-0">
         <InvestorKnowledgeCard profile={profile} />
      </aside>
    </div>
  );
}
```

---

## 5. 運用のポイント

1.  **プロフィールの手動修正**:
    手動での修正や、再度AIからの取り込みも可能とする
2.  **オンデマンド生成**:
    「すべての投資家」のプロフィールを事前に作る必要はありません。**「誰かが見た時だけ作る」**ことで、API料金とDB容量を節約できます。

