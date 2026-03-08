"use client";

import { useState } from "react";
import { ToolTrace } from "../page";
import SourceViewerModal from "./SourceViewerModal";

type Props = {
  tools: ToolTrace[];
};

const ICON_MAP: Record<string, string> = {
  google_search:     "🔍",
  web_crawl:         "🌐",
  edinet_api:        "📄",
  youtube_dl:        "🎬",
  whisper_transcribe:"🎤",
  filing_parser:     "📊",
  llm_extract:       "🧠",
  llm_sentiment:     "💬",
  llm_policy_impact: "🏛️",
  macro_cross_ref:   "📈",
  geocode_and_task:  "🛰️",
  cv_analyzer:       "📷",
  poi_analysis:      "📍",
};

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  google_search:     { label: "Search",          color: "#f59e0b" },
  web_crawl:         { label: "Web Page",         color: "#06b6d4" },
  edinet_api:        { label: "EDINET Filing",    color: "#3b82f6" },
  youtube_dl:        { label: "Video",            color: "#ef4444" },
  whisper_transcribe:{ label: "Transcript",       color: "#a855f7" },
  filing_parser:     { label: "Financial Data",   color: "#22c55e" },
  llm_extract:       { label: "AI Analysis",      color: "#f97316" },
  llm_sentiment:     { label: "Sentiment",        color: "#ec4899" },
  llm_policy_impact: { label: "Policy Analysis",  color: "#14b8a6" },
  macro_cross_ref:   { label: "Macro Data",       color: "#6366f1" },
  geocode_and_task:  { label: "Satellite Image",  color: "#f43f5e" },
  cv_analyzer:       { label: "Image Analysis",   color: "#d946ef" },
  poi_analysis:      { label: "Location Data",    color: "#84cc16" },
};

export default function DataSourcesPanel({ tools }: Props) {
  const [selected, setSelected] = useState<ToolTrace | null>(null);

  // Deduplicate by evidence_id, only completed tools
  const seen = new Set<string>();
  const sources = tools.filter((t) => {
    if (t.status !== "completed" || !t.evidence_id) return false;
    if (seen.has(t.evidence_id)) return false;
    seen.add(t.evidence_id);
    return true;
  });

  if (sources.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/50 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sources</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{sources.length}</span>
          </div>
        </div>
        <div className="p-2 space-y-0.5 max-h-[500px] overflow-y-auto">
          {sources.map((tool) => {
            const icon = ICON_MAP[tool.name] || "📎";
            const typeInfo = TYPE_MAP[tool.name] || { label: tool.name, color: "#71717a" };
            const title = tool.output
              ? Object.values(tool.output)[0]?.toString().slice(0, 40) || tool.name
              : tool.name;

            return (
              <button
                key={tool.evidence_id}
                onClick={() => setSelected(tool)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-800/40 transition-colors cursor-pointer group text-left"
              >
                <span className="text-base shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">
                    {title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded font-medium"
                      style={{ backgroundColor: typeInfo.color + "15", color: typeInfo.color }}
                    >
                      {typeInfo.label}
                    </span>
                    <span className="text-[8px] text-zinc-600">{tool.evidence_id}</span>
                  </div>
                </div>
                <span className="text-[9px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0 font-medium">
                  View ↗
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <SourceViewerModal tool={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
