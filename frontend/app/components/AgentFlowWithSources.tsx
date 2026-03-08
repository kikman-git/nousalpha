"use client";

import { useState } from "react";
import { AgentState, ToolTrace } from "../page";
import AgentFlowGraph from "./AgentFlowGraph";
import SourceViewerModal from "./SourceViewerModal";

type Props = {
  agents: Record<string, AgentState>;
};

const DATA_AGENTS = [
  { id: "ir",        label: "IR Agent",      sub: "Filings & Disclosures", color: "#06b6d4" },
  { id: "company",   label: "Company Agent", sub: "Audio / Video",         color: "#f59e0b" },
  { id: "news",      label: "News Agent",    sub: "Policy & Macro",        color: "#22c55e" },
  { id: "satellite", label: "Satellite",     sub: "Geospatial",            color: "#ec4899" },
] as const;

const ICON_MAP: Record<string, string> = {
  google_search:      "🔍",
  web_crawl:          "🌐",
  edinet_api:         "📄",
  youtube_dl:         "🎬",
  whisper_transcribe: "🎤",
  filing_parser:      "📊",
  llm_extract:        "🧠",
  llm_sentiment:      "💬",
  llm_policy_impact:  "🏛️",
  macro_cross_ref:    "📈",
  geocode_and_task:   "🛰️",
  cv_analyzer:        "📷",
  poi_analysis:       "📍",
};

const TYPE_LABEL: Record<string, string> = {
  google_search:      "Search",
  web_crawl:          "Web Crawl",
  edinet_api:         "EDINET",
  youtube_dl:         "Video",
  whisper_transcribe: "Transcript",
  filing_parser:      "Financials",
  llm_extract:        "AI Extract",
  llm_sentiment:      "Sentiment",
  llm_policy_impact:  "Policy",
  macro_cross_ref:    "Macro",
  geocode_and_task:   "Satellite",
  cv_analyzer:        "Image AI",
  poi_analysis:       "Location",
};

export default function AgentFlowWithSources({ agents }: Props) {
  const [selectedTool, setSelectedTool] = useState<ToolTrace | null>(null);

  return (
    <div className="space-y-3">
      {/* ── Live flow graph ── */}
      <AgentFlowGraph agents={agents} />

      {/* ── Per-agent data collected ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-zinc-800/50 flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Data Collected</span>
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-[9px] text-zinc-600">Click any source to view</span>
        </div>

        <div className="grid grid-cols-4 divide-x divide-zinc-800/50">
          {DATA_AGENTS.map((cfg) => {
            const agent = agents[cfg.id];
            const status = agent?.status || "idle";
            const tools = agent?.tools || [];

            // deduplicate by evidence_id, only completed
            const seen = new Set<string>();
            const completed = tools.filter((t) => {
              if (!t.evidence_id || t.status !== "completed") return false;
              if (seen.has(t.evidence_id)) return false;
              seen.add(t.evidence_id);
              return true;
            });

            const calling = tools.find((t) => t.status === "calling");
            const isRunning = status === "running";
            const isDone = status === "completed";

            const headerColor =
              isDone    ? "#3b82f6"  :
              isRunning ? cfg.color  : "#3f3f46";

            return (
              <div key={cfg.id} className="flex flex-col min-h-[160px]">
                {/* Column header */}
                <div
                  className="px-3 py-2 border-b"
                  style={{ borderBottomColor: cfg.color + "25" }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: headerColor,
                          animation: isRunning ? "pulse 1.8s ease-in-out infinite" : undefined,
                        }}
                      />
                      <span className="text-[11px] font-bold" style={{ color: headerColor }}>
                        {cfg.label}
                      </span>
                    </div>
                    {completed.length > 0 && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: cfg.color + "20", color: cfg.color }}
                      >
                        {completed.length}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-zinc-600">{cfg.sub}</div>
                </div>

                {/* Source cards */}
                <div className="flex-1 p-1.5 space-y-1">
                  {completed.length === 0 && !calling && (
                    <div className="flex items-center justify-center h-full py-8">
                      {isRunning ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <div
                            className="h-1.5 w-1.5 rounded-full animate-pulse"
                            style={{ backgroundColor: cfg.color }}
                          />
                          <span className="text-[9px] text-zinc-600">Collecting…</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-zinc-700">
                          {status === "idle" ? "Waiting" : "—"}
                        </span>
                      )}
                    </div>
                  )}

                  {completed.map((tool) => {
                    const icon = ICON_MAP[tool.name] || "📎";
                    const label = TYPE_LABEL[tool.name] || tool.name;
                    const preview = tool.output
                      ? Object.values(tool.output)[0]?.toString().slice(0, 28)
                      : "";

                    return (
                      <button
                        key={tool.evidence_id}
                        onClick={() => setSelectedTool(tool)}
                        className="w-full text-left rounded-lg px-2 py-1.5 border border-zinc-800/30 hover:border-zinc-700/60 hover:bg-zinc-800/40 transition-colors group"
                      >
                        <div className="flex items-start gap-1.5">
                          <span className="text-sm leading-none mt-0.5 shrink-0">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-[10px] font-semibold leading-tight"
                              style={{ color: cfg.color + "cc" }}
                            >
                              {label}
                            </div>
                            {preview && (
                              <div className="text-[9px] text-zinc-600 truncate mt-0.5">{preview}</div>
                            )}
                          </div>
                          <span className="text-[8px] text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">↗</span>
                        </div>
                        <div className="text-[8px] text-zinc-700 mt-1 font-mono">{tool.evidence_id}</div>
                      </button>
                    );
                  })}

                  {/* In-progress tool */}
                  {calling && (
                    <div className="rounded-lg px-2 py-1.5 border border-dashed border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 rounded-full animate-pulse shrink-0"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <span className="text-[9px] text-zinc-500 truncate">{calling.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Source viewer modal */}
      {selectedTool && (
        <SourceViewerModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
      )}
    </div>
  );
}
