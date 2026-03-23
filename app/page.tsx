"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-black text-sm">TF</div>
            <span className="font-bold text-lg">TribeFIND</span>
          </div>
          <nav className="flex gap-6 text-sm">
            <Link href="/tip" className="text-amber-400 hover:text-amber-300 transition font-medium">Submit Tip</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Find Missing People.{" "}
            <span className="text-amber-400">Follow the Money.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI-powered search across missing persons databases, cross-referenced with financial anomaly detection to surface trafficking patterns.
          </p>
        </div>

        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search by name, location, age, description..."
            className="flex-1 px-5 py-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none text-lg"
          />
          <button
            onClick={search}
            disabled={loading}
            className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          {["Recent Cases", "Children", "Washington", "California", "Oregon", "Unsolved"].map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300 hover:border-amber-500 hover:text-amber-400 transition"
            >
              {tag}
            </button>
          ))}
        </div>

        {searched && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-20 text-gray-500">Searching databases...</div>
            ) : results.length > 0 ? (
              <>
                <p className="text-sm text-gray-500 mb-4">{results.length} results found</p>
                {results.map((r, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{r.name}</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {r.age ? `Age: ${r.age}` : ""} {r.location ? `| ${r.location}` : ""} {r.date ? `| Missing since: ${r.date}` : ""}
                        </p>
                        <p className="text-gray-300 text-sm mt-2">{r.description}</p>
                      </div>
                      {r.financialFlag && (
                        <span className="px-2 py-1 bg-red-900/50 border border-red-700 rounded text-xs text-red-400 whitespace-nowrap">
                          Financial Signal
                        </span>
                      )}
                    </div>
                    {r.source && <p className="text-xs text-gray-600 mt-3">Source: {r.source}</p>}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500">No results found for &quot;{query}&quot;</p>
                <p className="text-gray-600 text-sm mt-2">Try a different name, location, or description</p>
              </div>
            )}
          </div>
        )}

        {!searched && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
            <StatCard label="Active Cases" value="600,000+" sub="Missing persons in the US" />
            <StatCard label="Financial Signals" value="Monitored" sub="Dark pool + options anomalies" />
            <StatCard label="AI-Powered" value="24/7" sub="Continuous pattern detection" />
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 px-6 py-8 mt-20">
        <div className="max-w-6xl mx-auto text-center text-gray-600 text-sm">
          <p>TribeFIND — AI-powered missing persons search + financial anomaly detection</p>
          <p className="mt-2">
            Built by <a href="https://engindearing.soy" className="text-amber-400 hover:underline">Engindearing</a>
            {" "}| If you have information, call <span className="text-white font-medium">1-800-THE-LOST</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-amber-400">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}
