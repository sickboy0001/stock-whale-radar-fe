export const runtime = "edge"; // この一行を追加

import { getStockholdersByStock } from "@/service/stockholders";
import { StockholdersPage } from "@/components/pages/stockholders";

interface PageProps {
  searchParams: Promise<{
    stock_code?: string;
    edinet_code?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getStockholdersByStock({
    secCode: params.stock_code,
    edinetCode: params.edinet_code,
  });

  return (
    <StockholdersPage
      stockInfo={data?.stockInfo || null}
      history={data?.history || []}
    />
  );
}
