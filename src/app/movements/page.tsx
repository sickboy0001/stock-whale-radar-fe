import { RecentWhaleMovements } from "@/components/pages/recent-whale-movements";
import { RecentWhaleMovementsList } from "@/components/organisms/entity/recent-whale-movements-list";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "クジラの動き | Stock Whale Radar",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ date?: string; period?: string; tab?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { date, period, tab } = await searchParams;
  const periodDays = period ? parseInt(period) : 30;
  const activeTab = (tab as "all" | "increase" | "decrease") || "all";

  return (
    <RecentWhaleMovements
      initialDate={date}
      initialPeriod={periodDays}
      initialTab={activeTab}
    >
      <Suspense
        fallback={
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-12 text-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="h-8 w-64 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
              <div className="h-4 w-48 bg-zinc-50 dark:bg-zinc-900 rounded"></div>
            </div>
          </div>
        }
      >
        <RecentWhaleMovementsList
          date={date}
          period={periodDays}
          activeTab={activeTab}
        />
      </Suspense>
    </RecentWhaleMovements>
  );
}
