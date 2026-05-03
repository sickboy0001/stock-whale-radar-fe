"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  Users,
  Database,
  Menu,
  LogOut,
  TrendingUp,
  Activity,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";

const navItems = [
  { label: "ダッシュボード", href: "/", icon: LayoutDashboard },
  { label: "Whale Lookup", href: "/search", icon: Search },
  {
    label: "クジラの動き",
    href: "/movements",
    icon: TrendingUp,
  },
  { label: "アクティビティ", href: "/activity", icon: Activity },
  { label: "マイ・バケット", href: "/buckets", icon: LayoutDashboard },
];

const adminItems = [
  {
    label: "インポート管理",
    href: "https://stock-whale-radar-be-217119007226.asia-northeast1.run.app/",
    icon: Database,
    isExternal: true,
  },
  {
    label: "インポート進捗",
    href: "/admin/import-status",
    icon: LayoutDashboard,
  },
  { label: "インポート履歴", href: "/admin/import-history", icon: Activity },
];

interface SidebarContentProps {
  pathname: string;
  session: Session | null;
}

const SidebarContent = ({ pathname, session }: SidebarContentProps) => (
  <div className="flex flex-col h-full bg-slate-900 text-slate-100">
    <div className="p-6">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl">
        <div className="bg-blue-600 p-1.5 rounded">
          <Users className="w-6 h-6 text-white" />
        </div>
        <span>Whale Radar</span>
      </Link>
    </div>
    <ScrollArea className="flex-1 px-4">
      <div className="space-y-4">
        <div>
          <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            メイン
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white",
                  pathname === item.href
                    ? "bg-slate-800 text-white"
                    : "text-slate-400",
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {session?.user?.isAdmin && (
          <div>
            <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              管理
            </h2>
            <div className="space-y-1">
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.isExternal ? "_blank" : undefined}
                  rel={item.isExternal ? "noopener noreferrer" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white",
                    pathname === item.href
                      ? "bg-slate-800 text-white"
                      : "text-slate-400",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>

    {/* Logout button - shown only when logged in */}
    {session && (
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white text-slate-400"
        >
          <LogOut className="w-4 h-4" />
          ログアウト
        </button>
      </div>
    )}

    {/* Version footer */}
    <div className="p-4 border-t border-slate-800">
      <div className="flex items-center gap-3 px-2 py-2 text-xs text-slate-500">
        v1.0.0
      </div>
    </div>
  </div>
);

export function MainSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 z-50">
        <SidebarContent pathname={pathname} session={session} />
      </aside>

      {/* Mobile Sidebar Trigger */}
      <div className="lg:hidden fixed top-3 left-4 z-60">
        <Sheet>
          <SheetTrigger
            render={
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 w-10 bg-slate-900 border-slate-800 text-white hover:bg-slate-800"
              >
                <Menu className="w-5 h-5" />
              </button>
            }
          />
          <SheetContent side="left" className="p-0 w-64 border-none">
            <SidebarContent pathname={pathname} session={session} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
