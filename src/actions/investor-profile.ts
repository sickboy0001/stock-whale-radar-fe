"use server";

import { db } from "@/db";
import { investorProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrGenerateProfile } from "@/service/investor-intel";
import { revalidatePath } from "next/cache";

/**
 * プロフィールを取得する（AI生成を含む）
 */
export async function fetchInvestorProfile(edinetCode: string, name: string) {
  try {
    const data = await getOrGenerateProfile(edinetCode, name);
    return data;
  } catch (error) {
    console.error("fetchInvestorProfile error:", error);
    return null;
  }
}

/**
 * AIを使用してプロフィールを生成または再取得する
 */
export async function refreshProfileFromAI(edinetCode: string, name: string) {
  try {
    await getOrGenerateProfile(edinetCode, name, true);
    revalidatePath(`/entity/holder/${edinetCode}`);
    return { success: true };
  } catch (error) {
    console.error("refreshProfileFromAI error:", error);
    return { success: false, error: "AI生成に失敗しました" };
  }
}

/**
 * 手動でプロフィールを更新する
 */
export async function updateInvestorProfile(
  edinetCode: string,
  formData: {
    summary: string;
    aum: string;
    established: string;
    location: string;
    website: string;
  },
) {
  const today = new Date().toISOString().split("T")[0];
  try {
    await db
      .update(investorProfiles)
      .set({
        summary: formData.summary,
        aum: formData.aum,
        established: formData.established,
        location: formData.location,
        website: formData.website,
        lastUpdated: today,
      })
      .where(eq(investorProfiles.edinetCode, edinetCode));

    revalidatePath(`/entity/holder/${edinetCode}`);
    return { success: true };
  } catch (error) {
    console.error("updateInvestorProfile error:", error);
    return { success: false, error: "更新に失敗しました" };
  }
}
