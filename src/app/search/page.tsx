import { EntitySearch } from "@/components/pages/entity/entity-search";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "検索 | Stock Whale Radar",
};

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-zinc-50/50">
      <EntitySearch />
    </main>
  );
}
