"use client";

import React, { useState } from "react";
import { definePlugin } from "sanity";

interface SyncSummary {
  mode: string;
  clickomCount: number;
  sanityCount: number;
  productMatches: number;
  productUnmatched: number;
  productAmbiguous: number;
  changed: number;
}

interface SyncResponse {
  ok?: boolean;
  summary?: SyncSummary;
  markdown?: string;
  error?: string;
}

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: 700,
};

function ClickomSyncTool() {
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const runSync = async (apply: boolean) => {
    setIsRunning(true);
    setError("");

    const response = await fetch("/api/clickom/product-sync", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "",
      },
      body: JSON.stringify({ apply }),
    });
    const data = (await response.json().catch(() => ({}))) as SyncResponse;
    setIsRunning(false);

    if (!response.ok) {
      setError(data.error || "Clickom product sync failed.");
      return;
    }

    setSummary(data.summary || null);
    setReport(data.markdown || "");
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, background: "#fff", color: "#111", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0, color: "#111" }}>Clickom Product Sync</h1>
          <p style={{ color: "#666", marginBottom: 0 }}>
            Match Sanity products to Clickom by SKU first, then exact product name. Dry run before applying.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={isRunning} onClick={() => runSync(false)} style={buttonStyle}>
            Dry Run
          </button>
          <button disabled={isRunning} onClick={() => runSync(true)} style={{ ...buttonStyle, background: "#111", color: "#fff" }}>
            Apply Sync
          </button>
        </div>
      </div>

      {isRunning && <p style={{ color: "#111" }}>Running sync...</p>}
      {error && <p style={{ color: "#b00020", fontWeight: 700 }}>{error}</p>}

      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            ["Mode", summary.mode],
            ["Clickom", summary.clickomCount],
            ["Sanity", summary.sanityCount],
            ["Matches", summary.productMatches],
            ["Unmatched", summary.productUnmatched],
            ["Ambiguous", summary.productAmbiguous],
            ["Changed", summary.changed],
          ].map(([label, value]) => (
            <div key={label} style={{ border: "1px solid #eee", padding: 12, background: "#fff", color: "#111" }}>
              <p style={{ margin: "0 0 6px", color: "#777", fontSize: 12 }}>{label}</p>
              <strong style={{ color: "#111" }}>{value}</strong>
            </div>
          ))}
        </div>
      )}

      {report && (
        <pre style={{ whiteSpace: "pre-wrap", background: "#f7f7f7", color: "#111", border: "1px solid #e5e5e5", padding: 16, overflowX: "auto" }}>
          {report}
        </pre>
      )}
    </div>
  );
}

export const clickomSyncTool = definePlugin({
  name: "clickom-sync-tool",
  tools: [
    {
      name: "clickom-sync",
      title: "Clickom Sync",
      component: ClickomSyncTool,
    },
  ],
});

