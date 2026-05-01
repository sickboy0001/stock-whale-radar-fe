export const runtime = "edge"; // この一行を追加

import { NextRequest, NextResponse } from "next/server";
import { searchWhales } from "@/service/search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchWhales(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
