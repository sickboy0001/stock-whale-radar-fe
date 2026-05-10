"use client";

import React, { useState } from "react";
import {
  Globe,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  RefreshCw,
  Edit3,
} from "lucide-react";
import { refreshProfileFromAI } from "@/actions/investor-profile";

interface InvestorProfile {
  edinetCode?: string;
  edinet_code?: string;
  summary: string;
  aum: string;
  established: string;
  key_people?: { name: string; role: string }[];
  keyPeople?: string;
  location: string;
  website: string;
  lastUpdated?: string;
  last_updated?: string;
}

export const InvestorKnowledgeCard = ({
  profile,
  name,
  edinetCode,
}: {
  profile: InvestorProfile | null;
  name: string;
  edinetCode: string;
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfileFromAI(edinetCode, name);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!profile)
    return (
      <div className="p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center">
        <p className="text-sm text-zinc-500 mb-4">プロフィール未生成です</p>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          AIでプロフィールを生成
        </button>
      </div>
    );

  // key_people のパース
  const keyPeople = Array.isArray(profile.key_people)
    ? profile.key_people
    : profile.keyPeople
      ? JSON.parse(profile.keyPeople)
      : [];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm sticky top-6">
      {/* 概要セクション */}
      <div className="p-5 border-b border-zinc-50 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
            Entity Intelligence
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="AIで再更新"
              className="text-zinc-400 hover:text-blue-500 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? "animate-spin" : ""}
              />
            </button>
            <button
              title="手動修正"
              className="text-zinc-400 hover:text-emerald-500 transition-colors"
            >
              <Edit3 size={14} />
            </button>
          </div>
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
          "{profile.summary}"
        </p>
      </div>

      {/* スペックリスト */}
      <div className="p-5 space-y-4">
        <InfoRow
          icon={<DollarSign size={16} />}
          label="運用資産額"
          value={profile.aum}
        />
        <InfoRow
          icon={<Calendar size={16} />}
          label="設立"
          value={profile.established}
        />

        {/* 主要人物（配列の展開） */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-zinc-400">
            <Users size={16} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              主要人物
            </p>
            <div className="space-y-1 mt-1">
              {keyPeople && keyPeople.length > 0 ? (
                keyPeople.map((person: any, i: number) => (
                  <div key={i} className="text-xs">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {person.name}
                    </span>
                    <span className="text-zinc-500 ml-1.5">
                      — {person.role}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-zinc-500">不明</div>
              )}
            </div>
          </div>
        </div>

        <InfoRow
          icon={<MapPin size={16} />}
          label="本社所在地"
          value={profile.location}
        />

        {/* 公式サイトリンク */}
        {profile.website && profile.website !== "不明" && (
          <div className="pt-4 border-t border-zinc-50 dark:border-zinc-800">
            <a
              href={
                profile.website.startsWith("http")
                  ? profile.website
                  : `https://${profile.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline"
            >
              <Globe size={14} />
              Official Website
            </a>
          </div>
        )}

        <div className="text-[9px] text-zinc-300 text-right mt-4">
          Last Updated: {profile.last_updated || profile.lastUpdated}
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-zinc-400">{icon}</div>
    <div>
      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {value || "不明"}
      </p>
    </div>
  </div>
);
