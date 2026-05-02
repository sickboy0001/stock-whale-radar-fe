import { getStockholdersByStock } from "@/service/stockholders";
import { StockholdersPage } from "@/components/pages/entity/stockholders";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    stock_code?: string;
  }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const search = await searchParams;
  const data = await getStockholdersByStock({
    secCode: search.stock_code,
    edinetCode: id,
  });

  return (
    <StockholdersPage
      stockInfo={data?.stockInfo || null}
      history={data?.history || []}
      edinetCode={id}
    />
  );
}
