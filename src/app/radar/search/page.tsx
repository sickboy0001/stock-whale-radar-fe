export const runtime = "edge"; // この一行を追加

import { EntitySearch } from "@/components/pages/entity-search";

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-zinc-50/50">
      <EntitySearch />
    </main>
  );
}
