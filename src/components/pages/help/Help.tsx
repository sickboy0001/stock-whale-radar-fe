"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeft, BookOpen } from "lucide-react";

interface HelpPageProps {
  content: string;
  slug: string;
  allSlugs: { slug: string; title: string }[];
}

export function Help({ content, slug, allSlugs }: HelpPageProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Header Navigation */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 mb-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">アプリに戻る</span>
            </Link>
            <div className="flex items-center gap-2 text-blue-600 font-bold">
              <BookOpen size={20} />
              <span>Whale Radar Help</span>
            </div>
          </div>

          {/* Chips Navigation */}
          <div className="flex flex-wrap gap-2">
            {allSlugs.map((item) => (
              <Link
                key={item.slug}
                href={`/help/${item.slug}`}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  slug === item.slug
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700",
                )}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 md:p-12">
          <article className="prose prose-zinc dark:prose-invert max-w-none prose-h1:text-3xl prose-h1:font-bold prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-li:text-zinc-600 dark:prose-li:text-zinc-400">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
}
