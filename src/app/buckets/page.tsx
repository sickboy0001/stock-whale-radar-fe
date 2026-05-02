import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function BucketsPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">マイ・バケット</h1>
      <p>あなたの注目銘柄グループを管理します。</p>
    </div>
  );
}
