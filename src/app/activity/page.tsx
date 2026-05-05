import { auth } from "@/auth";
import { cookies } from "next/headers";
import { getPersonalHistory, getTrendingWhales } from "@/service/view-history";
import { ActivityPage } from "@/components/pages/activity/ActivityPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity - Whale Radar",
  description: "Your recent activity and trending whales.",
};

const GUEST_COOKIE_NAME = "radar_guest_id";

export default async function Page() {
  const session = await auth();
  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value;

  const userId = session?.user?.id;

  // 個人履歴とトレンド（初期表示用 7d）を取得
  const [personalData, initialTrendingData] = await Promise.all([
    getPersonalHistory({ userId, guestId, limit: 20 }),
    getTrendingWhales("7d", 10),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50/50">
      <div className="py-8">
        <ActivityPage
          personalData={personalData}
          initialTrendingData={initialTrendingData}
        />
      </div>
    </div>
  );
}
