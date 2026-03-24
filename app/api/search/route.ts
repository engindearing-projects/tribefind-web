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
    // Search FBI in parallel with different strategies
    const [titleResults, broadResults] = await Promise.all([
      searchFBI(query, "title"),
      searchFBI(query, "broad"),
    ]);

    // Dedupe by name
    const seen = new Set();
    const results = [...titleResults, ...broadResults].filter(r => {
      if (seen.has(r.name)) return false;
      seen.add(r.name);
      return true;
    });

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

async function searchFBI(query: string, strategy: string = "title") {
  try {
    let url: string;

    if (strategy === "title") {
      // Search by title keyword
      url = `${FBI_API}?title=${encodeURIComponent(query)}&pageSize=20&page=1`;
    } else {
      // Broad search — pull cases and filter locally
      // Try subjects filter for missing persons categories
      const subjects = query.toLowerCase().includes("child") ? "Kidnappings and Missing Persons"
        : query.toLowerCase().includes("trafficking") ? "Human Trafficking"
        : "";

      if (subjects) {
        url = `${FBI_API}?subject=${encodeURIComponent(subjects)}&pageSize=50&page=1`;
      } else {
        // Pull latest and filter by query
        url = `${FBI_API}?pageSize=50&page=1`;
      }
    }

    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];
    return parseFBIResults(await res.json(), query);
  } catch {
    return [];
  }
}

function parseFBIResults(data: any, query: string) {
  const items = data.items || [];
  const lq = query.toLowerCase();

  // Split query into words for flexible matching
  const words = lq.split(/\s+/).filter(w => w.length > 2);

  return items
    .filter((item: any) => {
      if (!query || words.length === 0) return true;
      const text = [
        item.title, item.description, item.subjects?.join(" "),
        item.field_offices?.join(" "), item.details,
      ].filter(Boolean).join(" ").toLowerCase();
      // Match if ANY query word appears
      return words.some(w => text.includes(w));
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
