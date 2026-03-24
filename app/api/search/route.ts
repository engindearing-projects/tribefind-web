import { NextRequest, NextResponse } from "next/server";

// Proxy to local TribeFIND API server (exposed via Cloudflare tunnel)
const API_BASE = process.env.TRIBEFIND_API_URL || "https://sound-victory-doom-membership.trycloudflare.com";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  if (!query.trim()) return NextResponse.json({ results: [], error: "Query required" }, { status: 400 });

  try {
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return NextResponse.json(await res.json());
  } catch (err: any) {
    return NextResponse.json({ results: [], error: err.message, query }, { status: 502 });
  }
}
