"use server";

import { getOrGenerateStockProfile } from "@/service/stock-intel";
import { revalidatePath } from "next/cache";

/**
 * 銘柄プロフィールを取得する（AI生成を含む）
 */
export async function fetchStockProfile(secCode: string, officialName: string) {
  // 証券コードを4桁に調整 (5桁で末尾0の場合は切り捨て)
  const normalizedCode =
    secCode.length === 5 && secCode.endsWith("0")
      ? secCode.substring(0, 4)
      : secCode;

  const data = await getOrGenerateStockProfile(normalizedCode, officialName);
  return data;
}

/**
 * 銘柄プロフィールを再取得・生成する
 * @param secCode 証券コード (5桁)
 * @param officialName 正式名称
 */
export async function refreshStockProfile(
  secCode: string,
  officialName: string,
) {
  // 証券コードを4桁に調整 (5桁で末尾0の場合は切り捨て)
  const normalizedCode =
    secCode.length === 5 && secCode.endsWith("0")
      ? secCode.substring(0, 4)
      : secCode;

  await getOrGenerateStockProfile(normalizedCode, officialName, true);

  // 銘柄詳細ページを再読込
  revalidatePath(`/entity/stock/${normalizedCode}`);
}
