"use client";

import React, { useState } from "react";
import {
  Globe,
  Users,
  MapPin,
  Calendar,
  Briefcase,
  RefreshCw,
  Info,
} from "lucide-react";
import { refreshStockProfile } from "@/actions/stock-profile";

interface StockProfile {
  display_name: string;
  summary: string;
  business_model: string;
  established: string;
  key_people: Array<{ name: string; role: string }>;
  location: string;
  website: string;
  last_updated: string;
}

export const StockKnowledgeCard = ({
  profile,
  officialName,
  secCode,
}: {
  profile: StockProfile | null;
  officialName: string;
  secCode: string;
}) => {
  const [loading, setLoading] = useState(false);

  const onRefresh = async () => {
    if (!secCode || !officialName) return;
    setLoading(true);
    try {
      await refreshStockProfile(secCode, officialName);
    } catch (error) {
      console.error("Failed to refresh stock profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile)
    return (
      <button
        onClick={onRefresh}
        disabled={loading}
        className="w-full p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all text-xs font-bold flex flex-col items-center justify-center gap-2"
      >
        {loading ? (
          <RefreshCw className="animate-spin" size={20} />
        ) : (
          <>
            <Info size={20} />
            <span>AIで企業プロフィールを生成</span>
          </>
        )}
      </button>
    );

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm sticky top-6">
      {/* ヘッダーエリア */}
      <div className="p-5 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/30">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 leading-tight">
            {profile.display_name}
          </h2>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-zinc-300 hover:text-blue-500 transition-colors p-1"
            title="情報を更新"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <p
          className="text-[10px] text-zinc-400 font-medium uppercase truncate"
          title={officialName}
        >
          {officialName}
        </p>
      </div>

      {/* 事業概要 */}
      <div className="p-5 border-b border-zinc-50 dark:border-zinc-800">
        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1">
          <Info size={12} /> Business Summary
        </h3>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
          "{profile.summary}"
        </p>
      </div>

      {/* ビジネスモデル・強み */}
      <div className="p-5 border-b border-zinc-50 dark:border-zinc-800 bg-blue-50/10">
        <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1">
          <Briefcase size={12} /> Strengths & Model
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {profile.business_model}
        </p>
      </div>

      {/* スペックリスト */}
      <div className="p-5 space-y-4">
        <InfoItem
          icon={<Calendar size={16} />}
          label="設立"
          value={profile.established}
        />

        <div className="flex items-start gap-3 text-sm">
          <Users size={16} className="text-zinc-400 mt-1 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
              代表者 / 役員
            </p>
            {profile.key_people && profile.key_people.length > 0 ? (
              profile.key_people.map((p, i) => (
                <div
                  key={i}
                  className="font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  {p.name}{" "}
                  <span className="text-[10px] font-normal text-zinc-500 ml-1">
                    ({p.role})
                  </span>
                </div>
              ))
            ) : (
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                不明
              </p>
            )}
          </div>
        </div>

        <InfoItem
          icon={<MapPin size={16} />}
          label="本社所在地"
          value={profile.location}
        />

        {profile.website && profile.website !== "不明" && (
          <div className="pt-2">
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
              <Globe size={14} /> 公式サイト
            </a>
          </div>
        )}

        <div className="text-[9px] text-zinc-300 text-right mt-4">
          Last AI Update: {profile.last_updated}
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3 text-sm">
    <div className="text-zinc-400 mt-1 flex-shrink-0">{icon}</div>
    <div>
      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
        {label}
      </p>
      <p className="font-semibold text-zinc-800 dark:text-zinc-200">{value}</p>
    </div>
  </div>
);
