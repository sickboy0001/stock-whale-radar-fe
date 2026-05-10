"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, Info } from "lucide-react";
import { toHalfWidth } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  HolderStock,
  type HistoryItem,
} from "@/components/organisms/entity/holder-stock";
import { ActivityModal } from "@/components/organisms/activity/activity-modal";
import { InvestorKnowledgeCard } from "@/components/organisms/investor/InvestorKnowledgeCard";
import { fetchInvestorProfile } from "@/actions/investor-profile";

type HolderInfo = {
  edinetCode: string;
  submitterName: string;
  submitterType: string | null;
  address: string | null;
};

interface HolderStocksPageProps {
  holderInfo: HolderInfo | null;
  history: HistoryItem[];
  profile: any;
}

export function HolderStocksPage({
  holderInfo,
  history,
  profile: initialProfile,
}: HolderStocksPageProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [profileLoading, setProfileLoading] = useState(false);

  // 詳細表示が ON になった時に初めてプロフィールを取得
  useEffect(() => {
    const fetchProfile = async () => {
      if (showProfile && !profile && holderInfo?.edinetCode) {
        setProfileLoading(true);
        try {
          const data = await fetchInvestorProfile(
            holderInfo.edinetCode,
            holderInfo.submitterName,
          );
          setProfile(data);
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        } finally {
          setProfileLoading(false);
        }
      }
    };
    fetchProfile();
  }, [showProfile, profile, holderInfo]);

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          投資家詳細分析（Investor Insights）
        </h1>
        {holderInfo ? (
          <div className="flex items-center gap-4 text-lg">
            <span className="font-bold text-2xl">
              {toHalfWidth(holderInfo.submitterName)}
            </span>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(holderInfo.submitterName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-blue-500 transition-colors"
              title="Googleで検索"
            >
              <Search className="w-5 h-5" />
            </a>
            <ActivityModal initialFilter="holder" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2"
            >
              {showProfile ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  詳細を隠す
                </>
              ) : (
                <>
                  <Info className="w-4 h-4" />
                  詳細を表示
                </>
              )}
            </Button>
            <span className="text-muted-foreground text-sm">
              (EDINETコード: {holderInfo.edinetCode})
            </span>
          </div>
        ) : (
          <div className="text-muted-foreground">
            投資家情報が見つかりませんでした。
          </div>
        )}
      </div>

      {showProfile && (
        <div className={profileLoading ? "animate-pulse" : ""}>
          <InvestorKnowledgeCard
            profile={profile}
            name={holderInfo?.submitterName || ""}
            edinetCode={holderInfo?.edinetCode || ""}
          />
        </div>
      )}

      <div className="space-y-8">
        <HolderStock history={history} />
      </div>
    </div>
  );
}
