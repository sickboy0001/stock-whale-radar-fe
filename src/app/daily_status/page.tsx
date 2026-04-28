import { getDailyImportStatus } from "@/service/daily-import";
import { DailyStatusPage } from "@/components/pages/daily_status";

interface PageProps {
  searchParams?: Promise<{
    year?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const currentYear = new Date().getFullYear();
  // URL パラメータから年を取得、なければ現在の年を使用
  const resolvedSearchParams = await searchParams;
  const year = resolvedSearchParams?.year
    ? parseInt(resolvedSearchParams.year, 10)
    : currentYear;

  const initialData = await getDailyImportStatus(year);

  return <DailyStatusPage initialData={initialData} initialYear={year} />;
}
