import { getHolderStocks } from "@/service/holderstocks";
import { HolderStocksPage } from "@/components/pages/entity/holder";
import { auth } from "@/auth";
import { recordViewHistory } from "@/actions/record-history";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getHolderStocks(id);
  const holderName = data?.holderInfo?.submitterName || id;

  return {
    title: `${holderName} | 保有銘柄一覧 | Stock Whale Radar`,
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const edinetCode = id;

  if (!edinetCode) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold">投資家が指定されていません</h1>
      </div>
    );
  }

  // 閲覧履歴を記録
  // 非同期で実行するが、画面表示を待たせない
  recordViewHistory({
    targetCode: edinetCode,
    targetType: "entity",
    userId: session?.user?.id,
  }).catch(console.error);

  const data = await getHolderStocks(edinetCode);

  return (
    <HolderStocksPage
      holderInfo={data?.holderInfo || null}
      history={data?.history || []}
    />
  );
}
