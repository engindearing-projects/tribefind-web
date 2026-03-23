"use client";

import { useState } from "react";
import Link from "next/link";

export default function FinancialPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/financial?q=${encodeURIComponent(query)}`);
      setResults(await res.json());
    } catch {
      setResults({ signals: [], error: "Search failed" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-black text-sm">TF</div>
            <span className="font-bold text-lg">TribeFIND</span>
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/" className="text-gray-400 hover:text-white transition">Search</Link>
            <Link href="/tip" className="text-amber-400 hover:text-amber-300 transition font-medium">Submit Tip</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">
          Financial <span className="text-amber-400">Intelligence</span>
        </h1>
        <p className="text-gray-400 mb-8">
          Search SEC filings, sanctions lists, and dark pool data. Cross-reference entities with missing persons cases to surface trafficking patterns.
        </p>

        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Company name, person, ticker, or entity..."
            className="flex-1 px-5 py-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none text-lg"
          />
          <button onClick={search} disabled={loading} className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition disabled:opacity-50">
            {loading ? "Scanning..." : "Scan"}
          </button>
        </div>

        {results && (
          <div className="space-y-6">
            {/* Signal Summary */}
            {results.signals?.length > 0 ? (
              <div className="bg-gray-900 border border-amber-800/50 rounded-xl p-5">
                <h3 className="font-semibold text-amber-400 mb-3">{results.totalSignals} Signal{results.totalSignals !== 1 ? "s" : ""} Detected</h3>
                <div className="space-y-2">
                  {results.signals.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${s.severity === "high" ? "bg-red-500" : "bg-amber-500"}`} />
                      <span className="text-sm text-gray-300">{s.summary}</span>
                      <span className="text-xs text-gray-600 ml-auto">{s.source}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center text-gray-500">
                No financial signals found for &quot;{results.query}&quot;
              </div>
            )}

            {/* Sanctions Results */}
            {results.sanctions?.length > 0 && (
              <div className="bg-gray-900 border border-red-900/50 rounded-xl p-5">
                <h3 className="font-semibold text-red-400 mb-3">Sanctions / Watchlist Matches</h3>
                <div className="space-y-3">
                  {results.sanctions.map((s: any, i: number) => (
                    <div key={i} className="border-b border-gray-800 last:border-0 pb-3 last:pb-0">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-sm text-gray-400">{s.type} {s.countries ? `| ${s.countries}` : ""}</p>
                      {s.datasets && <p className="text-xs text-gray-600 mt-1">Lists: {s.datasets}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEC EDGAR Results */}
            {results.edgar?.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-gray-300 mb-3">SEC Filings</h3>
                <div className="space-y-2">
                  {results.edgar.map((e: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                      <div>
                        <span className="text-sm">{e.entity || e.form}</span>
                        {e.description && <span className="text-xs text-gray-500 ml-2">({e.description})</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">{e.form}</span>
                        {e.filed && <span className="text-xs text-gray-600 ml-2">{e.filed}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Sources */}
            <div className="text-xs text-gray-600 text-center">
              Sources: {results.sources?.join(", ")} | All data is publicly available
            </div>
          </div>
        )}

        {!results && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-8">
            <h3 className="font-semibold mb-3">Data Sources (all free)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-400">
              <div>
                <p className="text-amber-400 font-medium">SEC EDGAR</p>
                <p>13F institutional holdings, Form 4 insider trades, 10-K annual reports, 8-K material events</p>
              </div>
              <div>
                <p className="text-red-400 font-medium">OpenSanctions</p>
                <p>Global sanctions lists, politically exposed persons, criminal watchlists, company registries</p>
              </div>
              <div>
                <p className="text-blue-400 font-medium">FINRA ATS</p>
                <p>Weekly dark pool transparency data, off-exchange trading volumes, alternative trading systems</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
