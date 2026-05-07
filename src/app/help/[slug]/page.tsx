import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { Help } from "@/components/pages/help/Help";
import { Metadata } from "next";

const HELP_DIR = path.join(process.cwd(), "src/content/help");

// タイトルを抽出するヘルパー関数
function getTitleFromMarkdown(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : "Help Topic";
}

// 利用可能なすべてのヘルプスラッグを取得
function getAllHelpSlugs() {
  if (!fs.existsSync(HELP_DIR)) return [];
  const files = fs.readdirSync(HELP_DIR);
  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(".md", "");
      const fullPath = path.join(HELP_DIR, file);
      const content = fs.readFileSync(fullPath, "utf-8");
      const title = getTitleFromMarkdown(content);
      return { slug, title };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const filePath = path.join(HELP_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return { title: "Not Found - Help" };
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const title = getTitleFromMarkdown(content);

  return {
    title: `${title} - Whale Radar Help`,
  };
}

export default async function HelpPage({ params }: Props) {
  const { slug } = await params;
  const filePath = path.join(HELP_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const allSlugs = getAllHelpSlugs();

  return <Help content={content} slug={slug} allSlugs={allSlugs} />;
}
