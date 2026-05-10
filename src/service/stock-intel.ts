import { db } from "@/db";
import { stockProfiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getOrGenerateStockProfile(
  secCode: string,
  officialName: string,
  forceRefresh = false,
) {
  // 証券コードを4桁に調整 (5桁で末尾0の場合は切り捨て)
  const normalizedSecCode =
    secCode.length === 5 && secCode.endsWith("0")
      ? secCode.substring(0, 4)
      : secCode;

  // 0. テーブル作成 (存在しない場合)
  try {
    await db.run(
      sql`CREATE TABLE IF NOT EXISTS stock_profiles (
        sec_code TEXT PRIMARY KEY,
        official_name TEXT,
        display_name TEXT,
        summary TEXT,
        business_model TEXT,
        established TEXT,
        key_people TEXT,
        location TEXT,
        website TEXT,
        last_updated TEXT
      )`,
    );
  } catch (e) {
    console.error("Failed to create stock_profiles table:", e);
  }

  // 1. キャッシュ確認（forceRefreshがfalseの場合のみ）
  if (!forceRefresh) {
    try {
      const cached = await db.query.stockProfiles.findFirst({
        where: eq(stockProfiles.secCode, normalizedSecCode),
      });

      if (cached) {
        return {
          ...cached,
          key_people: cached.keyPeople ? JSON.parse(cached.keyPeople) : [],
          // UI側が期待するスネークケースに変換
          sec_code: cached.secCode,
          display_name: cached.displayName,
          business_model: cached.businessModel,
          last_updated: cached.lastUpdated,
        };
      }
    } catch (e) {
      console.error("Cache fetch error (might be missing table):", e);
    }
  }

  // 2. Gemini API で情報生成
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set");
    return null;
  }

  const model = genAI.getGenerativeModel(
    {
      model: "gemini-flash-latest",
    },
    { apiVersion: "v1beta" },
  );

  const prompt = `
    対象企業: "${officialName}" (証券コード: ${normalizedSecCode})
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
    const text = result.response.text();
    // JSON部分だけを抽出する（Markdownのコードブロックが含まれる場合への対策）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    const response = JSON.parse(jsonStr);
    const today = new Date().toISOString().split("T")[0];

    // 3. TursoにUPSERT
    await db
      .insert(stockProfiles)
      .values({
        secCode: normalizedSecCode,
        officialName,
        displayName: response.display_name,
        summary: response.summary,
        businessModel: response.business_model,
        established: response.established,
        keyPeople: JSON.stringify(response.key_people),
        location: response.location,
        website: response.website,
        lastUpdated: today,
      })
      .onConflictDoUpdate({
        target: stockProfiles.secCode,
        set: {
          officialName,
          displayName: response.display_name,
          summary: response.summary,
          businessModel: response.business_model,
          established: response.established,
          keyPeople: JSON.stringify(response.key_people),
          location: response.location,
          website: response.website,
          lastUpdated: today,
        },
      });

    return {
      ...response,
      sec_code: normalizedSecCode,
      last_updated: today,
      key_people: response.key_people,
    };
  } catch (error) {
    console.error("Stock Gemini Generation Error:", error);
    return null;
  }
}
