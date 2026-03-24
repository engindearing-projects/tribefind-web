import { NextRequest, NextResponse } from "next/server";

// Financial Intelligence API — free public data sources
// SEC EDGAR: institutional holdings, insider trades, company ownership
// FINRA: dark pool / ATS transparency data
// OpenSanctions: sanctioned entities, PEPs, criminal records
// OFAC: Treasury SDN list

const EDGAR_FULL_TEXT = "https://efts.sec.gov/LATEST/search-index?q=";
const EDGAR_COMPANY = "https://data.sec.gov/submissions/CIK";
// Local sanctions API via Cloudflare tunnel
const TRIBEFIND_API = process.env.TRIBEFIND_API_URL || "https://sound-victory-doom-membership.trycloudflare.com";
const OFAC_SDN_URL = "https://www.treasury.gov/ofac/downloads/sdn.csv";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  const type = req.nextUrl.searchParams.get("type") || "all"; // all, edgar, sanctions, darkpool

  if (!query.trim()) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const results: any = { query, signals: [] };

  // Search SEC EDGAR for entity filings
  if (type === "all" || type === "edgar") {
    try {
      const edgarResults = await searchEdgar(query);
      results.edgar = edgarResults;
      if (edgarResults.length > 0) {
        results.signals.push({
          source: "SEC EDGAR",
          type: "corporate_filing",
          count: edgarResults.length,
          summary: `${edgarResults.length} SEC filings found for "${query}"`,
        });
      }
    } catch (e) {
      results.edgar = [];
    }
  }

  // Search sanctions via local API
  if (type === "all" || type === "sanctions") {
    try {
      const sanctionsResults = await searchSanctionsLocal(query);
      results.sanctions = sanctionsResults;
      if (sanctionsResults.length > 0) {
        results.signals.push({
          source: "OpenSanctions",
          type: "sanctions_match",
          count: sanctionsResults.length,
          severity: "high",
          summary: `${sanctionsResults.length} sanctions/watchlist matches for "${query}"`,
        });
      }
    } catch (e) {
      results.sanctions = [];
    }
  }

  // Search FINRA ATS data for dark pool activity
  if (type === "all" || type === "darkpool") {
    try {
      const darkpoolResults = await searchDarkPool(query);
      results.darkpool = darkpoolResults;
      if (darkpoolResults.length > 0) {
        results.signals.push({
          source: "FINRA ATS",
          type: "dark_pool_activity",
          count: darkpoolResults.length,
          summary: `Dark pool trading activity found for "${query}"`,
        });
      }
    } catch (e) {
      results.darkpool = [];
    }
  }

  results.totalSignals = results.signals.length;
  results.sources = ["SEC EDGAR", "OpenSanctions", "FINRA ATS"];

  return NextResponse.json(results);
}

// SEC EDGAR full-text search
async function searchEdgar(query: string) {
  try {
    const res = await fetch(
      `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(query)}%22&dateRange=custom&startdt=2020-01-01&forms=4,13F-HR,10-K,8-K&from=0&size=10`,
      {
        headers: { "User-Agent": "TribeFIND/1.0 (j@engindearing.soy)" },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) throw new Error(`EDGAR ${res.status}`);
    const data = await res.json();

    return (data.hits?.hits || []).map((h: any) => ({
      form: h._source?.form_type,
      entity: h._source?.entity_name,
      filed: h._source?.file_date,
      description: h._source?.file_description || h._source?.form_type,
      url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(query)}&type=&dateb=&owner=include&count=10`,
    }));
  } catch {
    // Fallback: use EDGAR full-text search API
    try {
      const res = await fetch(
        `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(query)}%22&forms=4,13F-HR&from=0&size=5`,
        {
          headers: { "User-Agent": "TribeFIND/1.0 (j@engindearing.soy)" },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.hits?.hits || []).slice(0, 5).map((h: any) => ({
        form: h._source?.form_type,
        entity: h._source?.entity_name,
        filed: h._source?.file_date,
      }));
    } catch { return []; }
  }
}

// OpenSanctions search
async function searchSanctions(query: string) {
  try {
    const res = await fetch(
      `${OPENSANCTIONS_API}?q=${encodeURIComponent(query)}&limit=10`,
      {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data.results || []).map((r: any) => ({
      name: r.caption || r.name,
      type: r.schema, // Person, Company, LegalEntity
      datasets: (r.datasets || []).join(", "),
      countries: (r.properties?.country || []).join(", "),
      topics: (r.properties?.topics || []).join(", "),
      firstSeen: r.first_seen,
      lastSeen: r.last_seen,
    }));
  } catch { return []; }
}

// FINRA ATS / dark pool data search
async function searchDarkPool(query: string) {
  // FINRA publishes weekly ATS transparency data
  // For real-time, would need a paid source — but historical patterns are enough for trafficking detection
  try {
    const res = await fetch(
      `https://api.finra.org/data/group/otcMarket/name/weeklySummary?filter=(symbol eq '${query.toUpperCase()}')&limit=5`,
      {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data || [];
  } catch { return []; }
}

// Local sanctions search via Cloudflare tunnel
async function searchSanctionsLocal(query: string) {
  try {
    const res = await fetch(`${TRIBEFIND_API}/api/sanctions?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      name: r.name,
      type: r.type,
      countries: r.country || "",
      datasets: r.datasets || "",
      topics: r.topics || "",
    }));
  } catch { return []; }
}
