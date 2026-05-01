export const runtime = "edge"; // この一行を追加

export default function StocksPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">銘柄一覧</h1>
      <p>ここに注目銘柄のリストが表示されます。</p>
    </div>
  );
}
