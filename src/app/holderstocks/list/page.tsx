import { getHolderStocks } from "@/service/holderstocks";
import { HolderStocksPage } from "@/components/pages/holderstocks";

interface PageProps {
  searchParams: Promise<{
    found_code?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const edinetCode = params.found_code;

  if (!edinetCode) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold">投資家が指定されていません</h1>
      </div>
    );
  }

  const data = await getHolderStocks(edinetCode);

  return (
    <HolderStocksPage
      holderInfo={data?.holderInfo || null}
      history={data?.history || []}
    />
  );
}
