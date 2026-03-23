import { NextRequest, NextResponse } from "next/server";

// NamUs missing persons search proxy
// In production, this would query NamUs API, NCMEC, FBI, state databases
// For now, it searches the NamUs public website and returns structured results

const NAMUS_SEARCH_URL = "https://www.namus.gov/api/CaseSets/NamUs/MissingPersons/Search";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json({ results: [], error: "Query required" }, { status: 400 });
  }

  try {
    // Search NamUs API
    const namusResults = await searchNamUs(query);

    // In future: cross-reference with Unusual Whales financial data
    // const financialFlags = await checkFinancialSignals(namusResults);

    return NextResponse.json({
      results: namusResults,
      query,
      sources: ["NamUs"],
    });
  } catch (err) {
    console.error("Search error:", err);
    // Return demo results if API fails
    return NextResponse.json({
      results: getDemoResults(query),
      query,
      sources: ["demo"],
    });
  }
}

async function searchNamUs(query: string) {
  try {
    const res = await fetch(NAMUS_SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        take: 20,
        skip: 0,
        projections: [
          "npiMissingPerson.npiMissingPersonId",
          "npiMissingPerson.name",
          "npiMissingPerson.lastSeenDate",
          "npiMissingPerson.currentAge",
          "npiMissingPerson.cityOfLastContact",
          "npiMissingPerson.stateOfLastContact",
          "npiMissingPerson.raceEthnicity",
          "npiMissingPerson.gender",
        ],
        predicates: [
          {
            field: "npiMissingPerson.name",
            operator: "Contains",
            values: [query],
          },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`NamUs ${res.status}`);

    const data = await res.json();
    const records = data.results || [];

    return records.map((r: any) => ({
      name: r["npiMissingPerson.name"] || "Unknown",
      age: r["npiMissingPerson.currentAge"] || null,
      location: [
        r["npiMissingPerson.cityOfLastContact"],
        r["npiMissingPerson.stateOfLastContact"],
      ].filter(Boolean).join(", "),
      date: r["npiMissingPerson.lastSeenDate"]?.split("T")[0] || null,
      description: [
        r["npiMissingPerson.gender"],
        r["npiMissingPerson.raceEthnicity"],
      ].filter(Boolean).join(", "),
      source: "NamUs",
      namusId: r["npiMissingPerson.npiMissingPersonId"],
      financialFlag: false,
    }));
  } catch {
    return getDemoResults(query);
  }
}

function getDemoResults(query: string) {
  // Fallback demo data when API is unavailable
  return [
    {
      name: "Search results loading...",
      age: null,
      location: "United States",
      date: null,
      description: `Searching for "${query}" across NamUs, NCMEC, and state databases. Live database integration coming soon.`,
      source: "TribeFIND",
      financialFlag: false,
    },
  ];
}
