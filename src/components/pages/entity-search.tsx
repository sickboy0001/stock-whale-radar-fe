"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  Landmark,
  Briefcase,
  Tag,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchResult } from "@/service/search";

export const EntitySearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "entity" | "fund">("all");

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // 実際には Server Action または API Route を経由する
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const filteredResults = results.filter((r) => {
    if (activeTab === "all") return true;
    return r.type === activeTab;
  });

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      {/* Search Header */}
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-black tracking-tight italic">
          WHALE LOOKUP
        </h1>
        <p className="text-zinc-500">
          投資家、運用会社、またはファンドを検索します
        </p>

        <div className="relative max-w-2xl mx-auto">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            size={20}
          />
          <Input
            type="text"
            placeholder="名称 (日/英/カナ)、証券コード、EDINETコード..."
            className="w-full pl-12 pr-4 py-7 bg-white border-2 border-zinc-200 rounded-2xl focus:border-blue-500 focus:ring-0 transition-all text-lg shadow-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="animate-spin text-zinc-400" size={20} />
            </div>
          )}
        </div>
      </div>

      {/* Result Tabs / Filter */}
      <div className="flex gap-2 border-b border-zinc-100 pb-4">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            activeTab === "all"
              ? "bg-zinc-900 text-white"
              : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          全て
        </button>
        <button
          onClick={() => setActiveTab("entity")}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            activeTab === "entity"
              ? "bg-zinc-900 text-white"
              : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          法人 (Entity)
        </button>
        <button
          onClick={() => setActiveTab("fund")}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            activeTab === "fund"
              ? "bg-zinc-900 text-white"
              : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          ファンド (Fund)
        </button>
      </div>

      {/* Results Summary */}
      {query.length >= 2 && !isLoading && (
        <div className="text-sm text-zinc-500">
          {filteredResults.length} 件見つかりました
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResults.map((result) => (
          <div
            key={`${result.type}-${result.code}`}
            className={`group p-5 bg-white border border-zinc-200 rounded-2xl hover:shadow-md transition-all ${
              result.type === "entity"
                ? "hover:border-blue-500"
                : "hover:border-emerald-500"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <span
                className={`p-2 rounded-lg ${
                  result.type === "entity"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {result.type === "entity" ? (
                  <Building2 size={20} />
                ) : (
                  <Landmark size={20} />
                )}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-50 px-2 py-1 rounded">
                {result.code}
              </span>
            </div>
            <h3
              className={`font-bold text-lg text-zinc-900 transition-colors ${
                result.type === "entity"
                  ? "group-hover:text-blue-600"
                  : "group-hover:text-emerald-600"
              }`}
            >
              {result.name}
            </h3>
            {result.subName && (
              <p className="text-xs text-zinc-400 mb-4">{result.subName}</p>
            )}
            {!result.subName && result.issuerName && (
              <p className="text-xs text-zinc-400 mb-4">
                運用: {result.issuerName}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {result.industryOrCategory && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 text-[10px] font-bold"
                >
                  <Briefcase size={12} />
                  {result.industryOrCategory}
                </Badge>
              )}
              {result.secCode && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 text-[10px] font-bold"
                >
                  <Landmark size={12} />
                  証券コード: {result.secCode}
                </Badge>
              )}
              {result.type === "entity" && result.secCode && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 text-[10px] font-bold"
                >
                  <Tag size={12} />
                  上場
                </Badge>
              )}
            </div>

            <div className="flex gap-2 mt-auto">
              {result.secCode && (
                <Link
                  href={`/stockholders/list?stock_code=${result.secCode}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors"
                >
                  <Search size={14} />
                  企業情報
                </Link>
              )}
              <Link
                href={`/holderstocks/list?found_code=${result.code}`}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors"
              >
                <ExternalLink size={14} />
                保有銘柄
              </Link>
            </div>
          </div>
        ))}
      </div>

      {query.length >= 2 && !isLoading && filteredResults.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          一致する結果が見つかりませんでした。
        </div>
      )}
    </div>
  );
};
