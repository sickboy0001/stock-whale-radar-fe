import { getStockholdersByStock } from "@/service/stockholders";
import { StockholdersPage } from "@/components/pages/entity/stock";
import { auth } from "@/auth";
import { recordViewHistory } from "@/actions/record-history";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    stock_code?: string;
  }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const search = await searchParams;
    const isEdinetCode = id.startsWith("E");

    const data = await getStockholdersByStock({
      secCode: isEdinetCode ? search.stock_code : id,
      edinetCode: isEdinetCode ? id : undefined,
    });

    const stockName = data?.stockInfo?.submitterName || id;
    return {
      title: `${stockName} | 大口株主構成 | Stock Whale Radar`,
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "大口株主構成 | Stock Whale Radar",
    };
  }
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const search = await searchParams;
  const session = await auth();
  const isEdinetCode = id.startsWith("E");

  // 閲覧履歴を記録
  recordViewHistory({
    targetCode: id,
    targetType: isEdinetCode ? "entity" : "stock",
    userId: session?.user?.id,
  }).catch(console.error);

  const data = await getStockholdersByStock({
    secCode: isEdinetCode ? search.stock_code : id,
    edinetCode: isEdinetCode ? id : undefined,
  });

  return (
    <StockholdersPage
      initialStockInfo={data?.stockInfo || null}
      edinetCode={data?.stockInfo?.edinetCode || (isEdinetCode ? id : null)}
    />
  );
}
