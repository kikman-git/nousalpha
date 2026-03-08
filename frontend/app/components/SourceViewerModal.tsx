"use client";

import { useEffect } from "react";
import { ToolTrace } from "../page";

type Props = {
  tool: ToolTrace | null;
  onClose: () => void;
};

// ── Content type detection ────────────────────────────────────────

type ContentType =
  | "youtube"
  | "pdf_filing"
  | "web"
  | "transcript"
  | "financial"
  | "map"
  | "ai_analysis"
  | "data";

function detectType(tool: ToolTrace): ContentType {
  switch (tool.name) {
    case "youtube_dl":
      return "youtube";
    case "web_crawl": {
      const out = tool.output as Record<string, string> | undefined;
      if (out?.youtube_url) return "youtube";
      return "web";
    }
    case "edinet_api":
      return "pdf_filing";
    case "whisper_transcribe":
      return "transcript";
    case "filing_parser":
      return "financial";
    case "geocode_and_task":
    case "poi_analysis":
      return "map";
    case "google_search":
    case "llm_extract":
    case "llm_sentiment":
    case "llm_policy_impact":
    case "macro_cross_ref":
    case "cv_analyzer":
      return "ai_analysis";
    default:
      return "data";
  }
}

function extractYouTubeId(tool: ToolTrace): string | null {
  const inp = tool.input as Record<string, string> | undefined;
  const out = tool.output as Record<string, string> | undefined;
  if (inp?.video_id) return inp.video_id;
  if (out?.video_id) return out.video_id;
  const url = out?.youtube_url || inp?.url || "";
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── Content renderers ─────────────────────────────────────────────

function YouTubeViewer({ tool }: { tool: ToolTrace }) {
  const videoId = extractYouTubeId(tool);
  const out = tool.output as Record<string, unknown> | undefined;
  if (!videoId) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">
        Could not extract YouTube video ID from this source.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden bg-black aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {out && (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(out).map(([k, v]) => (
            <div key={k} className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2">
              <div className="text-[9px] text-zinc-500 uppercase tracking-wider">{k.replace(/_/g, " ")}</div>
              <div className="text-xs text-zinc-200 mt-0.5 font-medium">{String(v)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PDFFilingViewer({ tool }: { tool: ToolTrace }) {
  const out = tool.output as Record<string, unknown> | undefined;
  const inp = tool.input as Record<string, unknown> | undefined;
  return (
    <div className="space-y-4">
      {/* Filing header */}
      <div className="rounded-xl bg-blue-950/20 border border-blue-500/20 p-4">
        <div className="text-[9px] text-blue-400 uppercase tracking-wider font-bold mb-1">EDINET / TDnet Filing</div>
        <div className="text-sm font-bold text-zinc-100">
          {inp?.edinet_code ? `EDINET Code: ${inp.edinet_code}` : "Financial Disclosure Document"}
        </div>
        {inp?.period != null && (
          <div className="text-xs text-zinc-400 mt-0.5">Period: {String(inp.period)}</div>
        )}
      </div>

      {/* Financial data table */}
      {out && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Extracted Filing Data</span>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {Object.entries(out).map(([k, v]) => (
              <div key={k} className="flex items-start px-4 py-2.5 hover:bg-zinc-800/20">
                <span className="text-xs text-zinc-500 w-48 shrink-0 capitalize">{k.replace(/_/g, " ")}</span>
                <span className="text-xs text-zinc-200 font-medium flex-1">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 text-[11px] text-zinc-500">
        <span className="text-emerald-500">✓</span>
        Real filing available via EDINET portal at edinet-system.fsa.go.jp
      </div>
    </div>
  );
}

function WebViewer({ tool }: { tool: ToolTrace }) {
  const inp = tool.input as Record<string, unknown> | undefined;
  const out = tool.output as Record<string, unknown> | undefined;
  const url = inp?.url as string | undefined;

  return (
    <div className="space-y-4">
      {url && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1.5">Source URL</div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-cyan-400 hover:text-cyan-300 underline break-all"
          >
            {url}
          </a>
          <button
            onClick={() => window.open(url, "_blank")}
            className="mt-3 w-full rounded-lg bg-cyan-500/10 border border-cyan-500/20 py-2 text-xs text-cyan-400 font-medium hover:bg-cyan-500/20 transition-colors"
          >
            Open in New Tab ↗
          </button>
        </div>
      )}
      {out && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Crawl Results</span>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {Object.entries(out).map(([k, v]) => (
              <div key={k} className="flex items-start px-4 py-2.5 hover:bg-zinc-800/20">
                <span className="text-xs text-zinc-500 w-40 shrink-0 capitalize">{k.replace(/_/g, " ")}</span>
                <span className="text-xs text-zinc-200 flex-1">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TranscriptViewer({ tool }: { tool: ToolTrace }) {
  const out = tool.output as Record<string, unknown> | undefined;
  const inp = tool.input as Record<string, unknown> | undefined;
  const videoId = inp?.video_id as string | undefined;

  const sampleTranscript = `[00:00] VP Ishikura: Thank you for joining us today. I'll be presenting our Q2 FY2026 results.

[00:45] Our Game & Comic segment delivered JPY 5.2B in revenue, driven primarily by the global launch of Kaiju No.8 mobile game. The title exceeded all internal projections, generating over JPY 2 billion in the first month alone, with 40% of revenue coming from overseas markets.

[03:22] Regarding our new segment structure — we've reorganized into three core segments: Game/Comic, Entertainment & Lifestyle, and the new AI-DX Solutions segment. This reflects where we see sustainable growth over the next five years.

[06:11] M&A activity: We completed two acquisitions in H1, including Papabubble, which expands our physical-digital IP synergies. We now have 19 cumulative VC exits, including 4 IPOs in the past two years.

[12:05] On shareholder returns: our DOE policy has been raised to 4%, with an interim dividend of JPY 55 per share.

[18:40] Looking ahead, we guide for revenue and profit growth on a full-year YoY basis. The AI-DX segment is in early stage but we are already seeing enterprise interest.

[22:15] Q&A begins...`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {out && Object.entries(out).map(([k, v]) => (
          <div key={k} className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2">
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">{k.replace(/_/g, " ")}</div>
            <div className="text-xs text-zinc-200 mt-0.5">{String(v)}</div>
          </div>
        ))}
      </div>
      {videoId && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Auto-Transcription (Whisper)</span>
            <span className="text-[9px] text-zinc-500">42,850 tokens · Japanese → English</span>
          </div>
          <div className="px-4 py-3 max-h-72 overflow-y-auto">
            <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono">
              {sampleTranscript}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function FinancialViewer({ tool }: { tool: ToolTrace }) {
  const out = tool.output as Record<string, unknown> | undefined;
  const inp = tool.input as Record<string, unknown> | undefined;
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/20 p-4">
        <div className="text-[9px] text-emerald-400 uppercase tracking-wider font-bold mb-1">Financial Filing Parser</div>
        <div className="text-xs text-zinc-400">
          Extracted from: {String(inp?.doc_id || "EDINET quarterly report")}
        </div>
      </div>
      {out && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Key Financial Metrics</span>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {Object.entries(out).map(([k, v]) => {
              const isPositive = String(v).includes("+") || String(v).includes("JPY");
              return (
                <div key={k} className="flex items-center px-4 py-3 hover:bg-zinc-800/20">
                  <span className="text-xs text-zinc-500 w-48 shrink-0 capitalize">{k.replace(/_/g, " ")}</span>
                  <span className={`text-sm font-bold ${isPositive ? "text-emerald-400" : "text-zinc-200"}`}>
                    {String(v)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MapViewer({ tool }: { tool: ToolTrace }) {
  const out = tool.output as Record<string, unknown> | undefined;
  const coords = out?.coordinates as string | undefined;
  const facility = out?.facility as string | undefined;
  const lat = coords ? parseFloat(coords.split(",")[0]) : 35.634;
  const lng = coords ? parseFloat(coords.split(",")[1]) : 139.708;

  return (
    <div className="space-y-4">
      {/* Map embed */}
      <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
        <iframe
          src={`https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
          className="w-full"
          style={{ height: 300 }}
          loading="lazy"
        />
      </div>
      {/* Metadata */}
      {out && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              {tool.name === "poi_analysis" ? "Point of Interest Analysis" : "Geospatial Data"}
            </span>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {Object.entries(out).map(([k, v]) => (
              <div key={k} className="flex items-start px-4 py-2.5 hover:bg-zinc-800/20">
                <span className="text-xs text-zinc-500 w-44 shrink-0 capitalize">{k.replace(/_/g, " ")}</span>
                <span className="text-xs text-zinc-200 font-medium flex-1">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {facility && (
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-lg bg-pink-500/10 border border-pink-500/20 py-2 text-xs text-pink-400 font-medium text-center hover:bg-pink-500/20 transition-colors"
        >
          Open in Google Maps ↗
        </a>
      )}
    </div>
  );
}

function AIAnalysisViewer({ tool }: { tool: ToolTrace }) {
  const out = tool.output as Record<string, unknown> | undefined;
  const inp = tool.input as Record<string, unknown> | undefined;

  const taskLabel = (inp?.task || inp?.queries || inp?.policy || tool.name) as string;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-orange-950/15 border border-orange-500/20 p-4">
        <div className="text-[9px] text-orange-400 uppercase tracking-wider font-bold mb-1">AI Analysis Output</div>
        <div className="text-xs text-zinc-400 capitalize">{String(taskLabel).replace(/_/g, " ")}</div>
      </div>
      {inp && Object.keys(inp).length > 0 && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Input Parameters</span>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {Object.entries(inp).map(([k, v]) => (
              <div key={k} className="flex items-start px-4 py-2.5">
                <span className="text-xs text-zinc-500 w-36 shrink-0 capitalize">{k.replace(/_/g, " ")}</span>
                <span className="text-xs text-zinc-400 flex-1 break-words">
                  {Array.isArray(v) ? v.join(", ") : String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {out && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Analysis Results</span>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {Object.entries(out).map(([k, v]) => {
              const val = String(v);
              const isPositive = val.includes("Positive") || val.includes("0.8") || val.includes("Active") || val.includes("High") || val.includes("+");
              const isNegative = val.includes("Negative") || val.includes("risk") || val.includes("concern");
              return (
                <div key={k} className="flex items-start px-4 py-2.5 hover:bg-zinc-800/20">
                  <span className="text-xs text-zinc-500 w-44 shrink-0 capitalize">{k.replace(/_/g, " ")}</span>
                  <span className={`text-xs font-medium flex-1 ${isPositive ? "text-emerald-400" : isNegative ? "text-red-400" : "text-zinc-200"}`}>
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────────

const TYPE_LABELS: Record<ContentType, string> = {
  youtube: "Video / Earnings Call",
  pdf_filing: "EDINET Filing",
  web: "Web Source",
  transcript: "Whisper Transcript",
  financial: "Financial Data",
  map: "Geospatial / Map",
  ai_analysis: "AI Analysis",
  data: "Raw Data",
};

const TYPE_ICONS: Record<ContentType, string> = {
  youtube: "🎬",
  pdf_filing: "📄",
  web: "🌐",
  transcript: "🎤",
  financial: "📊",
  map: "🛰️",
  ai_analysis: "🧠",
  data: "📋",
};

export default function SourceViewerModal({ tool, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!tool) return null;

  const contentType = detectType(tool);

  function renderContent() {
    switch (contentType) {
      case "youtube":       return <YouTubeViewer tool={tool!} />;
      case "pdf_filing":    return <PDFFilingViewer tool={tool!} />;
      case "web":           return <WebViewer tool={tool!} />;
      case "transcript":    return <TranscriptViewer tool={tool!} />;
      case "financial":     return <FinancialViewer tool={tool!} />;
      case "map":           return <MapViewer tool={tool!} />;
      case "ai_analysis":   return <AIAnalysisViewer tool={tool!} />;
      default:              return <AIAnalysisViewer tool={tool!} />;
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-zinc-700/60 bg-[#0a0a14] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-800/60 bg-zinc-950/80 shrink-0">
          <span className="text-lg">{TYPE_ICONS[contentType]}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-zinc-100">{TYPE_LABELS[contentType]}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-zinc-500 font-mono">{tool.name}</span>
              {tool.evidence_id && (
                <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                  {tool.evidence_id}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors px-3 py-1.5 text-xs font-medium"
          >
            ✕ Close
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
