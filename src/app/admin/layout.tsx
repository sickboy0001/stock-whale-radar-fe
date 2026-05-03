import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - Stock Whale Radar",
  description: "管理画面",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
