"use client";

import { useState } from "react";
import { AgentState, ToolTrace } from "../page";
import SourceViewerModal from "./SourceViewerModal";

type Props = {
  agents: Record<string, AgentState>;
};

// ── Category definitions ──────────────────────────────────────────

const CATEGORIES = [
  {
    id: "ir",
    label: "IR & Disclosures",
    description: "EDINET, TDNET, SEC filings, accounting & finance",
    color: "#3b82f6",
    icon: "📄",
    agentIds: ["ir"],
  },
  {
    id: "company",
    label: "Shareholder Comms",
    description: "Earnings call audio, Whisper transcripts, IR meetings",
    color: "#f59e0b",
    icon: "🎤",
    agentIds: ["company"],
  },
  {
    id: "macro",
    label: "Macro & Policy",
    description: "Government, Digital Agency, BOJ, SEC announcements",
    color: "#22c55e",
    icon: "🏛️",
    agentIds: ["news"],
  },
  {
    id: "geo",
    label: "Geospatial",
    description: "Satellite imagery, foot traffic, location intelligence",
    color: "#ec4899",
    icon: "🛰️",
    agentIds: ["satellite"],
  },
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
  edinet_api:         "EDINET Filing",
  youtube_dl:         "Video",
  whisper_transcribe: "Transcript",
  filing_parser:      "Financials",
  llm_extract:        "AI Extract",
  llm_sentiment:      "Sentiment",
  llm_policy_impact:  "Policy Analysis",
  macro_cross_ref:    "Macro Cross-Ref",
  geocode_and_task:   "Satellite Image",
  cv_analyzer:        "Image Analysis",
  poi_analysis:       "Location Data",
};

function SourceRow({
  tool,
  color,
  onClick,
}: {
  tool: ToolTrace;
  color: string;
  onClick: () => void;
}) {
  const icon = ICON_MAP[tool.name] || "📎";
  const label = TYPE_LABEL[tool.name] || tool.name;
  const preview = tool.output
    ? Object.values(tool.output)[0]?.toString().slice(0, 38)
    : "";

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-800/40 transition-colors group border border-transparent hover:border-zinc-700/40"
    >
      <span className="text-sm shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium text-zinc-300 group-hover:text-zinc-100 truncate">
          {label}
        </div>
        {preview && (
          <div className="text-[9px] text-zinc-600 truncate mt-0.5">{preview}</div>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[8px] font-mono text-zinc-600">{tool.evidence_id}</span>
        <span
          className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity font-medium"
          style={{ color }}
        >
          View ↗
        </span>
      </div>
    </button>
  );
}

export default function GroupedSourcesPanel({ agents }: Props) {
  const [selectedTool, setSelectedTool] = useState<ToolTrace | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(["ir", "company", "macro", "geo"])
  );

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build per-category tool lists from agents
  const categoryTools = CATEGORIES.map((cat) => {
    const tools: ToolTrace[] = [];
    const seen = new Set<string>();

    for (const agentId of cat.agentIds) {
      const agentTools = agents[agentId]?.tools || [];
      for (const t of agentTools) {
        if (t.status !== "completed" || !t.evidence_id) continue;
        if (seen.has(t.evidence_id)) continue;
        seen.add(t.evidence_id);
        tools.push(t);
      }
    }
    return { ...cat, tools };
  });

  const totalSources = categoryTools.reduce((n, c) => n + c.tools.length, 0);

  return (
    <>
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/50 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-zinc-800/50 flex items-center justify-between">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sources</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
            {totalSources} total
          </span>
        </div>

        {/* Category accordion */}
        <div className="divide-y divide-zinc-800/40">
          {categoryTools.map((cat) => {
            const isOpen = openCategories.has(cat.id);
            return (
              <div key={cat.id}>
                {/* Category header — always visible, click to expand */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-zinc-800/20 transition-colors text-left group"
                >
                  <span className="text-base shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: cat.color }}
                      >
                        {cat.label}
                      </span>
                      {cat.tools.length > 0 && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: cat.color + "18", color: cat.color }}
                        >
                          {cat.tools.length}
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-zinc-600 mt-0.5 truncate">{cat.description}</div>
                  </div>
                  <span className="text-[10px] text-zinc-600 shrink-0 transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : undefined }}>
                    ▾
                  </span>
                </button>

                {/* Source list */}
                {isOpen && cat.tools.length > 0 && (
                  <div className="pb-1.5 px-1.5 space-y-0.5 border-t border-zinc-800/30">
                    {cat.tools.map((tool) => (
                      <SourceRow
                        key={tool.evidence_id}
                        tool={tool}
                        color={cat.color}
                        onClick={() => setSelectedTool(tool)}
                      />
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {isOpen && cat.tools.length === 0 && (
                  <div className="py-3 px-4 border-t border-zinc-800/30">
                    <span className="text-[9px] text-zinc-700">No sources collected</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Source viewer modal */}
      {selectedTool && (
        <SourceViewerModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
      )}
    </>
  );
}
