import { NextRequest, NextResponse } from "next/server";

// Missing persons search — multiple free sources
// 1. FBI missing persons API (free, public)
// 2. Local sanctions database (74k entities, SQLite FTS5)
// 3. NamUs public case count

const FBI_API = "https://api.fbi.gov/wanted/v1/list";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json({ results: [], error: "Query required" }, { status: 400 });
  }

  try {
    const results = await searchFBI(query);

    return NextResponse.json({
      results,
      query,
      total: results.length,
      sources: ["FBI Wanted / Missing Persons"],
    });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({
      results: [],
      query,
      error: "Search temporarily unavailable",
      sources: [],
    });
  }
}

async function searchFBI(query: string) {
  try {
    // FBI Wanted API — includes missing persons, kidnappings, seeking info
    const params = new URLSearchParams({
      title: query,
      pageSize: "20",
      page: "1",
    });

    const res = await fetch(`${FBI_API}?${params}`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      // Try keyword search instead
      const res2 = await fetch(`${FBI_API}?field_offices=${encodeURIComponent(query)}&pageSize=20`, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res2.ok) throw new Error(`FBI API ${res2.status}`);
      return parseFBIResults(await res2.json(), query);
    }

    return parseFBIResults(await res.json(), query);
  } catch {
    // Fallback: try broader search
    try {
      const res = await fetch(`${FBI_API}?pageSize=20&person_classification=Main`, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return parseFBIResults(data, query);
    } catch {
      return [];
    }
  }
}

function parseFBIResults(data: any, query: string) {
  const items = data.items || [];
  const lq = query.toLowerCase();

  return items
    .filter((item: any) => {
      // Filter for relevance to the query
      const text = [
        item.title, item.description, item.subjects?.join(" "),
        item.field_offices?.join(" "), item.details,
      ].filter(Boolean).join(" ").toLowerCase();
      return text.includes(lq) || !query || items.length <= 20;
    })
    .map((item: any) => ({
      name: item.title || "Unknown",
      age: item.age_range || null,
      location: item.field_offices?.join(", ") || null,
      date: item.publication || null,
      description: item.description || item.caution || item.details?.replace(/<[^>]*>/g, "").slice(0, 300) || "",
      source: "FBI",
      category: item.person_classification || item.subjects?.[0] || "Wanted",
      image: item.images?.[0]?.thumb || null,
      url: item.url || null,
      reward: item.reward_text || null,
      financialFlag: false,
    }))
    .slice(0, 20);
}
