import { db } from "@/db";
import { investorProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getOrGenerateProfile(
  edinetCode: string,
  officialName: string,
  forceRefresh = false,
) {
  // 1. キャッシュ確認（forceRefreshがfalseの場合のみ）
  if (!forceRefresh) {
    try {
      const cached = await db.query.investorProfiles.findFirst({
        where: eq(investorProfiles.edinetCode, edinetCode),
      });

      if (cached) {
        return {
          ...cached,
          key_people: cached.keyPeople ? JSON.parse(cached.keyPeople) : [],
          // キャメルケースをスネークケースに変換して返却（UI側がスネークケースを想定しているため）
          edinet_code: cached.edinetCode,
          display_name: cached.displayName,
          last_updated: cached.lastUpdated,
        };
      }
    } catch (e) {
      console.error("Cache fetch error (might be missing table):", e);
      // テーブルがない場合は、生成フローへ進む（生成フローのUPSERTでエラーになるかもしれないが）
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
    正式名称: "${officialName}"
    EDINETコード: "${edinetCode}"
    上記の上場銘柄の大口保有者について、日本市場での投資活動を中心に調査し、以下のJSON形式で回答してください。
    【重要ルール】
    - key_peopleは [{ "name": "...", "role": "..." }] の形式にしてください。
    - 不明な項目は空文字ではなく "不明" と記載してください。
    - 投資方針や近年の活動を含めた要約をsummaryに記載してください。
    項目:
    - display_name: 日本語での一般的かつ簡潔な通称（例: "三菱UFJ銀行"、"オアシス・マネジメント"）
    - summary: 投資スタイル（アクティビスト、バリュー投資等）や近年の日本での動向を含む200文字程度の解説
    - aum: 運用資産残高（可能な限り最新の円またはドル表記）
    - established: 設立年
    - key_people: 主要な人物のリスト（name, role）
    - location: 本社または主要拠点の所在地
    - website: 公式サイトのURL
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // JSON部分だけを抽出する（Markdownのコードブロックが含まれる場合への対策）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    const response = JSON.parse(jsonStr);

    // 3. TursoにUPSERT (last_updatedは yyyy-MM-dd)
    const today = new Date().toISOString().split("T")[0];

    await db
      .insert(investorProfiles)
      .values({
        edinetCode,
        officialName,
        displayName: response.display_name,
        summary: response.summary,
        aum: response.aum,
        established: response.established,
        keyPeople: JSON.stringify(response.key_people),
        location: response.location,
        website: response.website,
        lastUpdated: today,
      })
      .onConflictDoUpdate({
        target: investorProfiles.edinetCode,
        set: {
          officialName,
          displayName: response.display_name,
          summary: response.summary,
          aum: response.aum,
          established: response.established,
          keyPeople: JSON.stringify(response.key_people),
          location: response.location,
          website: response.website,
          lastUpdated: today,
        },
      });

    return {
      ...response,
      edinet_code: edinetCode,
      last_updated: today,
      key_people: response.key_people,
    };
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return null;
  }
}
