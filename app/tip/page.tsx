"use client";

import { useState } from "react";
import Link from "next/link";

export default function TipPage() {
  const [form, setForm] = useState({ name: "", location: "", details: "", contact: "", anonymous: false });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!form.details.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setSubmitted(true);
    } catch {}
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-6">&#9989;</div>
          <h1 className="text-2xl font-bold mb-4">Tip Submitted</h1>
          <p className="text-gray-400 mb-8">Thank you. Your information has been securely recorded and will be reviewed.</p>
          <p className="text-gray-500 text-sm mb-8">If this is an emergency, call 911 immediately.</p>
          <Link href="/" className="text-amber-400 hover:underline">&larr; Back to search</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-black text-sm">TF</div>
            <span className="font-bold text-lg">TribeFIND</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Submit a Tip</h1>
        <p className="text-gray-400 mb-8">All information is kept confidential. You can submit anonymously.</p>

        <div className="space-y-6">
          <Field label="Person's Name" hint="If known">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name of missing person or suspect" className="input-field" />
          </Field>

          <Field label="Location" hint="Where were they last seen, or where is suspicious activity?">
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, state, address, or landmark" className="input-field" />
          </Field>

          <Field label="Details" required hint="What did you see? What do you know?">
            <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Describe what you observed, any suspicious activity, vehicle descriptions, or other relevant information..." rows={6} className="input-field resize-none" />
          </Field>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="anon" checked={form.anonymous} onChange={(e) => setForm({ ...form, anonymous: e.target.checked })} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500" />
            <label htmlFor="anon" className="text-gray-300 text-sm">Submit anonymously</label>
          </div>

          {!form.anonymous && (
            <Field label="Your Contact Info" hint="Optional — in case investigators need to follow up">
              <input type="text" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Phone or email" className="input-field" />
            </Field>
          )}

          <button onClick={submit} disabled={submitting || !form.details.trim()} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition disabled:opacity-50 text-lg">
            {submitting ? "Submitting..." : "Submit Tip"}
          </button>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-sm text-gray-400">
            <p className="font-medium text-gray-300 mb-2">Emergency?</p>
            <p>If someone is in immediate danger, call <span className="text-white font-bold">911</span> first.</p>
            <p className="mt-2">National Center for Missing & Exploited Children: <span className="text-white">1-800-THE-LOST</span></p>
            <p>National Human Trafficking Hotline: <span className="text-white">1-888-373-7888</span></p>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgb(17, 17, 17);
          border: 1px solid #333;
          border-radius: 0.75rem;
          color: white;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-field:focus { border-color: #f59e0b; }
        .input-field::placeholder { color: #555; }
      `}</style>
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-gray-200 font-medium text-sm mb-1.5 block">
        {label}{required && <span className="text-amber-400 ml-1">*</span>}
      </span>
      {hint && <span className="text-gray-500 text-xs block mb-1.5">{hint}</span>}
      {children}
    </label>
  );
}
