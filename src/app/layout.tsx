import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MainSidebar } from "@/components/layout/main-sidebar";
import TopHeader from "@/components/layout/top-header";
import MainFooter from "@/components/layout/main-footer";
import AuthProvider from "@/components/providers/auth-provider";
import { GoogleAnalytics } from "@next/third-parties/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ダッシュボード | Stock Whale Radar",
  description: "大口投資家（クジラ）の動きを可視化・追跡するためのサービス",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-gray-50 text-slate-900 flex">
        <AuthProvider>
          <MainSidebar />
          <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
            <TopHeader />
            <main className="flex-1 pt-16">{children}</main>
            <MainFooter />
          </div>
        </AuthProvider>
        <GoogleAnalytics gaId="G-32KD3X1CT0" />
      </body>
    </html>
  );
}
