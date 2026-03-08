"use client";

import { useState, useMemo } from "react";
import { ToolTrace } from "../page";

type Props = {
  tools: ToolTrace[];
};

type SourceCategory = "ALL" | "VIDEO" | "DOCS" | "SATELLITE" | "INTEL";

const TOOL_TO_CATEGORY: Record<string, SourceCategory> = {
  youtube_dl: "VIDEO",
  whisper_transcribe: "VIDEO",
  edinet_api: "DOCS",
  filing_parser: "DOCS",
  llm_extract: "DOCS",
  geocode_and_task: "SATELLITE",
  cv_analyzer: "SATELLITE",
  poi_analysis: "SATELLITE",
  google_search: "INTEL",
  web_crawl: "DOCS",
  llm_sentiment: "INTEL",
  llm_policy_impact: "INTEL",
  macro_cross_ref: "INTEL",
};

const CATEGORY_COLORS: Record<SourceCategory, string> = {
  ALL: "#71717a",
  VIDEO: "#ef4444",
  DOCS: "#3b82f6",
  SATELLITE: "#10b981",
  INTEL: "#f59e0b",
};

const TOOL_LABELS: Record<string, string> = {
  youtube_dl: "VIDEO",
  whisper_transcribe: "TRANSCRIPT",
  edinet_api: "EDINET",
  filing_parser: "FINANCIAL",
  llm_extract: "AI EXTRACT",
  web_crawl: "WEB CRAWL",
  geocode_and_task: "SAT IMAGE",
  cv_analyzer: "CV ANALYSIS",
  poi_analysis: "POI DATA",
  google_search: "SEARCH",
  llm_sentiment: "SENTIMENT",
  llm_policy_impact: "POLICY",
  macro_cross_ref: "MACRO",
};

// Determine if card should span 2 columns
function isWideCard(name: string): boolean {
  return name === "youtube_dl" || name === "whisper_transcribe" || name === "filing_parser";
}

// ── Video Card ──
function VideoCard({ source }: { source: ToolTrace }) {
  const [playing, setPlaying] = useState(false);
  const o = source.output || {};
  const videoId = (o.video_id as string) || "";
  const title = (o.title as string) || "Earnings Presentation";
  const duration = (o.duration as string) || "";
  const speaker = (o.speaker as string) || "";

  return (
    <div className="h-full flex flex-col">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <>
            {/* Styled thumbnail with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-950/90 via-zinc-900 to-black" />
            {/* Grid overlay for tech feel */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            {/* Waveform visualization (static) */}
            <div className="absolute bottom-8 left-4 right-4 h-12 flex items-end gap-[2px]">
              {Array.from({ length: 80 }).map((_, i) => {
                const h = Math.sin(i * 0.3) * 30 + Math.cos(i * 0.17) * 15 + 40;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: `${h}%`,
                      backgroundColor: `rgba(239, 68, 68, ${0.25 + Math.sin(i * 0.12) * 0.35})`,
                    }}
                  />
                );
              })}
            </div>
            {/* Title overlay */}
            <div className="absolute top-3 left-3 right-3">
              <div className="text-[9px] text-red-400 font-mono tracking-widest mb-1">EARNINGS CALL</div>
              <div className="text-xs text-white font-bold leading-tight">{title}</div>
            </div>
            {/* Play button */}
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center cursor-pointer group/play"
            >
              <div className="w-16 h-16 rounded-full bg-red-600/80 flex items-center justify-center backdrop-blur-sm border border-red-400/30 group-hover/play:bg-red-500/90 group-hover/play:scale-110 transition-all shadow-lg shadow-red-500/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <polygon points="8,5 20,12 8,19" />
                </svg>
              </div>
            </button>
            {/* Duration badge */}
            <div className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded font-mono">
              {duration}
            </div>
          </>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] text-zinc-400 truncate">{speaker}</span>
        <span className="text-[10px] text-zinc-600">|</span>
        <span className="text-[10px] text-zinc-500">{duration}</span>
      </div>
    </div>
  );
}

// ── Transcript Card ──
function TranscriptCard({ source }: { source: ToolTrace }) {
  const o = source.output || {};
  const preview = (o.transcript_preview as string) || "";
  const speaker = (o.speaker as string) || "";
  const tokens = (o.transcript_tokens as number) || 0;
  const topics = (o.key_topics as string[]) || [];

  return (
    <div className="h-full flex flex-col">
      {/* Waveform header */}
      <div className="h-10 flex items-center gap-[1px] px-1 mb-2 bg-purple-950/30 rounded-lg overflow-hidden">
        {Array.from({ length: 120 }).map((_, i) => {
          const h = Math.abs(Math.sin(i * 0.15) * Math.cos(i * 0.08)) * 80 + 10;
          return (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                backgroundColor: `rgba(168, 85, 247, ${0.2 + Math.abs(Math.sin(i * 0.1)) * 0.6})`,
              }}
            />
          );
        })}
      </div>
      {/* Speaker */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-[8px] text-purple-400">
          IS
        </div>
        <span className="text-[10px] text-purple-300 font-medium">{speaker}</span>
        <span className="text-[9px] text-zinc-600 ml-auto">{tokens.toLocaleString()} tokens</span>
      </div>
      {/* Transcript text */}
      <div className="flex-1 overflow-y-auto max-h-[160px] rounded-lg bg-zinc-900/50 p-3 border border-purple-500/10">
        <p className="text-[10px] text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
          {preview || "Transcript loading..."}
        </p>
      </div>
      {/* Topics */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {topics.map((t) => (
            <span key={t} className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Financial / Filing Parser Card ──
function FinancialCard({ source }: { source: ToolTrace }) {
  const o = source.output || {};

  const rows = [
    { label: "売上高 Revenue", value: o.revenue, highlight: true },
    { label: "営業利益 Operating Income", value: o.operating_income },
    { label: "当期純利益 Net Income", value: o.net_income },
    { label: "営業利益率 Op. Margin", value: o.operating_margin },
    { label: "Game/Comic", value: o.game_comic_revenue },
    { label: "Ent./Lifestyle", value: o.entame_lifestyle },
    { label: "AI-DX Solutions", value: o.ai_dx_solutions },
    { label: "配当 Dividend", value: o.dividend },
    { label: "DOE", value: o.doe },
  ].filter((r) => r.value);

  const docTitle = (o.doc_title as string) || "Quarterly Report";
  const filingDate = (o.filing_date as string) || "";

  return (
    <div className="h-full flex flex-col">
      {/* PDF-style header */}
      <div className="bg-gradient-to-r from-blue-950/80 to-zinc-900 rounded-t-lg px-3 py-2 border-b border-blue-500/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[8px] text-blue-400 tracking-widest font-mono">EDINET / E33829</div>
            <div className="text-[11px] text-white font-bold mt-0.5">{docTitle}</div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[8px] text-zinc-500">{filingDate}</div>
            <div className="text-[8px] text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded mt-1">PDF</div>
          </div>
        </div>
      </div>
      {/* Financial table */}
      <div className="flex-1 bg-zinc-950/80 rounded-b-lg overflow-hidden">
        <div className="divide-y divide-zinc-800/50">
          {rows.map((row, i) => (
            <div key={i} className={`flex items-center justify-between px-3 py-1.5 ${row.highlight ? "bg-blue-500/5" : ""}`}>
              <span className="text-[9px] text-zinc-400">{row.label as string}</span>
              <span className={`text-[11px] font-mono font-bold ${row.highlight ? "text-blue-400" : "text-zinc-200"}`}>
                {row.value as string}
              </span>
            </div>
          ))}
        </div>
        {/* YoY change bar */}
        {typeof o.yoy_revenue_growth === "string" && (
          <div className="px-3 py-2 border-t border-zinc-800/50 bg-emerald-500/5">
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-zinc-500">YoY Revenue</span>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "62%" }} />
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">{o.yoy_revenue_growth as string}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] text-zinc-500">YoY Op. Profit</span>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: "79%" }} />
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">{o.yoy_op_growth as string}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PDF / Q&A Card ──
function PDFCard({ source }: { source: ToolTrace }) {
  const o = source.output || {};
  const title = (o.qa_pdf_title as string) || (o.label as string) || "Document";
  const preview = (o.qa_pdf_preview as string) || "";

  return (
    <div className="h-full flex flex-col">
      {/* PDF header bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-t-lg border-b border-zinc-700/30">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="text-[10px] text-zinc-300 font-medium truncate flex-1">{title}</span>
        <span className="text-[8px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">PDF</span>
      </div>
      {/* Simulated PDF content */}
      <div className="flex-1 bg-zinc-950/50 rounded-b-lg p-3 overflow-y-auto max-h-[200px]">
        {preview ? (
          <div className="space-y-2">
            {preview.split("\n\n").map((block, i) => (
              <div key={i} className="text-[9px] leading-relaxed">
                {block.split("\n").map((line, j) => {
                  const isQ = line.startsWith("Q");
                  const isA = line.startsWith("A");
                  return (
                    <p key={j} className={`${isQ ? "text-blue-400 font-bold mt-1" : isA ? "text-zinc-300" : "text-zinc-400"}`}>
                      {line}
                    </p>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-2 bg-zinc-800/50 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── EDINET Filing Card ──
function FilingCard({ source }: { source: ToolTrace }) {
  const o = source.output || {};

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gradient-to-r from-blue-950/60 to-zinc-900 rounded-lg p-3 flex-1">
        <div className="text-[8px] text-blue-400 tracking-widest font-mono mb-2">EDINET FILING</div>
        <div className="space-y-1.5">
          {[
            { label: "EDINET Code", value: "E33829" },
            { label: "Documents", value: `${o.edinet_docs || 0} EDINET + ${o.tdnet_docs || 0} TDnet` },
            { label: "Segment Change", value: o.segment_change },
            { label: "Dividend", value: o.dividend_notice },
          ]
            .filter((r) => r.value)
            .map((row, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[9px] text-zinc-500">{row.label}</span>
                <span className="text-[9px] text-zinc-300 font-mono">{row.value as string}</span>
              </div>
            ))}
        </div>
        {/* Stamp effect */}
        <div className="mt-3 flex justify-center">
          <div className="border-2 border-blue-500/30 rounded px-3 py-1 text-[10px] text-blue-400/60 font-bold tracking-widest rotate-[-3deg]">
            VERIFIED
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Satellite / Geospatial Card ──
// Coordinate lookup: HQ = 35.6340, 139.7082 (Meguro); Event = 35.6595, 139.7005 (Shibuya)
const KNOWN_COORDS: Record<string, { lat: number; lon: number }> = {
  "35.6340N, 139.7082E": { lat: 35.634, lon: 139.7082 },
  "35.6595N, 139.7005E": { lat: 35.6595, lon: 139.7005 },
};

function parseCoords(source: ToolTrace): { lat: number; lon: number } | null {
  const o = source.output || {};
  const coordStr = (o.coordinates as string) || "";
  if (KNOWN_COORDS[coordStr]) return KNOWN_COORDS[coordStr];
  // For cv_analyzer / poi_analysis without explicit coords, use HQ default
  const inp = source.input || {};
  const targetCoords = (inp.coordinates as string) || "";
  if (KNOWN_COORDS[targetCoords]) return KNOWN_COORDS[targetCoords];
  // Default: Akatsuki HQ (Meguro)
  return { lat: 35.634, lon: 139.7082 };
}

function SatelliteCard({ source }: { source: ToolTrace }) {
  const o = source.output || {};
  const name = source.name;
  const loc = parseCoords(source);
  const lat = loc?.lat || 35.634;
  const lon = loc?.lon || 139.7082;

  // Determine facility label
  let facility = "";
  if (name === "geocode_and_task") {
    facility = (o.facility as string) || "Akatsuki HQ";
  } else if (name === "cv_analyzer") {
    facility = "Office Activity Analysis";
  } else if (name === "poi_analysis") {
    facility = (o.target as string) || (source.input?.target as string) || "POI Analysis";
  }

  // Build metrics
  const metrics: { label: string; value: string; color: string }[] = [];
  if (o.hq_occupancy) metrics.push({ label: "Occupancy", value: o.hq_occupancy as string, color: "#10b981" });
  if (o.parking_utilization) metrics.push({ label: "Parking", value: o.parking_utilization as string, color: "#06b6d4" });
  if (o.nearby_foot_traffic) metrics.push({ label: "Foot Traffic", value: o.nearby_foot_traffic as string, color: "#f59e0b" });
  if (o.venue_foot_traffic) metrics.push({ label: "Venue Traffic", value: o.venue_foot_traffic as string, color: "#10b981" });
  if (o.social_media_mentions) metrics.push({ label: "Social Buzz", value: o.social_media_mentions as string, color: "#ec4899" });
  if (o.nearby_retail_spillover) metrics.push({ label: "Retail Spillover", value: o.nearby_retail_spillover as string, color: "#f59e0b" });
  if (o.ground_resolution) metrics.push({ label: "Resolution", value: o.ground_resolution as string, color: "#06b6d4" });
  if (o.cloud_cover) metrics.push({ label: "Cloud Cover", value: o.cloud_cover as string, color: "#71717a" });
  if (o.expansion_indicator) metrics.push({ label: "Signal", value: o.expansion_indicator as string, color: "#f59e0b" });
  if (o.event_detected !== undefined) metrics.push({ label: "Event", value: o.event_detected ? "DETECTED" : "None", color: o.event_detected ? "#10b981" : "#71717a" });

  // OSM zoom: 16 for office, 15 for event area
  const zoom = name === "poi_analysis" ? 15 : 16;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.005},${lat - 0.003},${lon + 0.005},${lat + 0.003}&layer=mapnik&marker=${lat},${lon}`;

  return (
    <div className="h-full flex flex-col">
      {/* Map embed */}
      <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
        <iframe
          src={osmUrl}
          className="absolute inset-0 w-full h-full border-0"
          style={{ filter: "saturate(0.3) brightness(0.5) hue-rotate(80deg) contrast(1.3)" }}
          loading="lazy"
        />
        {/* HUD overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Scan line */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="animate-satellite-scan absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          </div>
          {/* Crosshair center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-6 h-6 rounded-full border border-emerald-400/50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-[1px] bg-emerald-400/20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-[1px] bg-emerald-400/20" />
          </div>
          {/* Facility label */}
          <div className="absolute top-2 left-2">
            <span className="text-[8px] bg-black/60 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 font-mono backdrop-blur-sm">
              {facility}
            </span>
          </div>
          {/* Coordinate overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between">
            <span className="text-[8px] font-mono text-emerald-400/80 bg-black/40 px-1 rounded">{lat.toFixed(4)}N, {lon.toFixed(4)}E</span>
            <span className="text-[8px] font-mono text-emerald-400/60 bg-black/40 px-1 rounded">{(o.image_date as string) || "LIVE"}</span>
          </div>
        </div>
      </div>
      {/* Metrics grid */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-1 mt-2">
          {metrics.slice(0, 6).map((m, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900/50">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-[7px] text-zinc-500">{m.label}</div>
                <div className="text-[9px] text-zinc-300 font-mono truncate">{m.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Intelligence / Analysis Card ──
function IntelCard({ source }: { source: ToolTrace }) {
  const o = source.output || {};
  const name = source.name;

  // Determine card content based on tool type
  let title = "";
  let entries: { label: string; value: string; color?: string }[] = [];

  if (name === "llm_sentiment") {
    title = "Management Sentiment";
    const score = (o.confidence_score as number) || 0;
    entries = [
      { label: "Tone", value: o.overall_tone as string || "", color: score > 0.7 ? "#10b981" : "#f59e0b" },
      { label: "Guidance", value: o.guidance as string || "" },
      { label: "Kaiju 8", value: o.kaiju8_launch as string || "" },
      { label: "M&A", value: o.m_and_a_stance as string || "" },
    ];
  } else if (name === "llm_policy_impact") {
    title = "Policy Impact Analysis";
    entries = [
      { label: "METI Content", value: o.meti_content_impact as string || "", color: "#10b981" },
      { label: "Digital Agency AI", value: o.digital_agency_ai as string || "", color: "#10b981" },
      { label: "JFTC Mobile", value: o.jftc_mobile as string || "", color: "#10b981" },
      { label: "Net Score", value: o.net_policy_score as string || "", color: "#10b981" },
    ];
  } else if (name === "macro_cross_ref") {
    title = "Macro Environment";
    entries = [
      { label: "BOJ Rate", value: o.boj_rate as string || "" },
      { label: "M&A Impact", value: o.m_and_a_impact as string || "", color: "#10b981" },
      { label: "VC Exits", value: o.vc_exit_env as string || "" },
      { label: "JPY Impact", value: o.yen_impact as string || "" },
    ];
  } else if (name === "google_search") {
    title = "Search Intelligence";
    const results = (o.total_results as number) || 0;
    const relevant = (o.sector_relevant as number) || 0;
    entries = [
      { label: "Results", value: `${results} found / ${relevant} relevant` },
    ];
    if (o.company) {
      entries = [
        { label: "Company", value: o.company as string },
        { label: "Ticker", value: o.ticker as string || "" },
        { label: "Sector", value: o.sector as string || "" },
      ];
    }
  } else if (name === "llm_extract") {
    title = "Segment Analysis";
    const segments = (o.new_segments as string[]) || [];
    entries = [
      { label: "Segments", value: segments.join(" / ") },
      { label: "M&A", value: o.m_and_a as string || "" },
      { label: "IPO Exits", value: o.ipo_exits as string || "" },
    ];
  } else {
    title = TOOL_LABELS[name] || name;
    // Generic: show all output keys
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string" || typeof v === "number") {
        entries.push({ label: k.replace(/_/g, " "), value: String(v) });
      }
    }
    entries = entries.slice(0, 5);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="text-[9px] text-amber-400/80 tracking-widest font-mono mb-2">{title.toUpperCase()}</div>
      <div className="flex-1 space-y-1.5">
        {entries.filter(e => e.value).map((entry, i) => (
          <div key={i}>
            <div className="text-[8px] text-zinc-500 mb-0.5">{entry.label}</div>
            <div className={`text-[9px] leading-relaxed ${entry.color ? "" : "text-zinc-300"}`} style={entry.color ? { color: entry.color } : undefined}>
              {entry.value}
            </div>
          </div>
        ))}
      </div>
      {/* Sentiment gauge for llm_sentiment */}
      {name === "llm_sentiment" && typeof o.confidence_score === "number" && (
        <div className="mt-2 pt-2 border-t border-zinc-800/50">
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-zinc-500">Confidence</span>
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                style={{ width: `${(o.confidence_score as number) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">
              {((o.confidence_score as number) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── IR Crawl Card ──
function CrawlCard({ source }: { source: ToolTrace }) {
  const o = source.output || {};
  const pdfs = (o.pdfs_found as number) || 0;
  const quarterly = (o.quarterly_reports as number) || 0;
  const latest = (o.latest as string) || "";

  return (
    <div className="h-full flex flex-col">
      <div className="text-[9px] text-cyan-400/80 tracking-widest font-mono mb-2">IR PAGE CRAWL</div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-cyan-400">{pdfs}</div>
          <div className="text-[7px] text-zinc-500">PDFs Found</div>
        </div>
        <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-cyan-400">{quarterly}</div>
          <div className="text-[7px] text-zinc-500">Quarterly</div>
        </div>
      </div>
      <div className="text-[9px] text-zinc-400">
        <span className="text-zinc-500">Latest: </span>{latest}
      </div>
    </div>
  );
}

// ── Main Component ──
export default function DataSourcesPanel({ tools }: Props) {
  const [activeTab, setActiveTab] = useState<SourceCategory>("ALL");

  const sources = useMemo(() => {
    const seen = new Set<string>();
    return tools.filter((t) => {
      if (t.status !== "completed" || !t.evidence_id) return false;
      if (seen.has(t.evidence_id)) return false;
      seen.add(t.evidence_id);
      return true;
    });
  }, [tools]);

  const filtered = useMemo(() => {
    if (activeTab === "ALL") return sources;
    return sources.filter((s) => TOOL_TO_CATEGORY[s.name] === activeTab);
  }, [sources, activeTab]);

  const categoryCounts = useMemo(() => {
    const counts: Record<SourceCategory, number> = { ALL: sources.length, VIDEO: 0, DOCS: 0, SATELLITE: 0, INTEL: 0 };
    for (const s of sources) {
      const cat = TOOL_TO_CATEGORY[s.name];
      if (cat) counts[cat]++;
    }
    return counts;
  }, [sources]);

  if (sources.length === 0) return null;

  function renderCard(source: ToolTrace) {
    switch (source.name) {
      case "youtube_dl":
        return <VideoCard source={source} />;
      case "whisper_transcribe":
        return <TranscriptCard source={source} />;
      case "filing_parser":
        return <FinancialCard source={source} />;
      case "edinet_api":
        return <FilingCard source={source} />;
      case "geocode_and_task":
      case "cv_analyzer":
      case "poi_analysis":
        return <SatelliteCard source={source} />;
      case "web_crawl":
        if (source.output?.qa_pdf_preview || source.output?.qa_pdf_title) {
          return <PDFCard source={source} />;
        }
        if (source.output?.pdfs_found) {
          return <CrawlCard source={source} />;
        }
        return <IntelCard source={source} />;
      default:
        return <IntelCard source={source} />;
    }
  }

  const tabs: SourceCategory[] = ["ALL", "VIDEO", "DOCS", "SATELLITE", "INTEL"];

  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/80 overflow-hidden backdrop-blur-sm">
      {/* Header with scan line */}
      <div className="relative px-4 py-3 border-b border-zinc-800/50 overflow-hidden">
        {/* Animated top border */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-zinc-300 tracking-wider">INTELLIGENCE SOURCES</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              {sources.length}
            </span>
          </div>
          <div className="text-[8px] text-zinc-600 font-mono">MULTI-SOURCE VERIFIED</div>
        </div>
        {/* Category tabs */}
        <div className="flex gap-1 mt-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            const color = CATEGORY_COLORS[tab];
            const count = categoryCounts[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[9px] px-2.5 py-1 rounded-md font-mono transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "text-white font-bold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                style={
                  isActive
                    ? { backgroundColor: color + "20", borderColor: color + "40", border: "1px solid", color }
                    : {}
                }
              >
                {tab}
                {count > 0 && (
                  <span
                    className="text-[7px] px-1 py-0 rounded-full"
                    style={isActive ? { backgroundColor: color + "30" } : { color: "#71717a" }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Source cards grid */}
      <div className="p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((source, i) => {
            const category = TOOL_TO_CATEGORY[source.name] || "INTEL";
            const color = CATEGORY_COLORS[category];
            const wide = isWideCard(source.name);

            return (
              <div
                key={source.evidence_id}
                className={`rounded-lg border overflow-hidden ${wide ? "md:col-span-2" : ""}`}
                style={{
                  borderColor: color + "25",
                  backgroundColor: "#0a0a1480",
                }}
              >
                {/* Card header */}
                <div
                  className="flex items-center justify-between px-3 py-1.5"
                  style={{ backgroundColor: color + "08" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-[8px] font-mono tracking-wider" style={{ color }}>
                      {TOOL_LABELS[source.name] || source.name}
                    </span>
                  </div>
                  <span className="text-[7px] text-zinc-600 font-mono">{source.evidence_id}</span>
                </div>
                {/* Card content */}
                <div className="p-3">{renderCard(source)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
