import { getRecentWhaleMovements } from "@/service/whale-movements";
import { RecentWhaleMovements } from "@/components/pages/recent-whale-movements";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ date?: string; period?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { date, period } = await searchParams;
  const periodDays = period ? parseInt(period) : 30;

  const data = await getRecentWhaleMovements(date, periodDays);
  if (!data) return null;
  return (
    <RecentWhaleMovements
      data={data}
      initialDate={date}
      initialPeriod={periodDays}
    />
  );
}
