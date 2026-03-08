"use client";

import { useRef, useState } from "react";
import { exportReportPDF } from "../utils/exportPdf";

type AlphaData = {
  expected_return: number;
  probability: number;
  drivers: { factor: string; impact: number; evidence_ids: string[] }[];
};

type BetaData = {
  risk_score: number;
  probability: number;
  factors: { factor: string; severity: number; evidence_ids: string[] }[];
};

type ThesisItem = {
  claim: string;
  evidence_ids: string[];
};

type Props = {
  company?: string;
  signal: string;
  confidence: number;
  summary?: string;
  thesis?: ThesisItem[];
  risks?: ThesisItem[];
  debate_summary?: {
    rounds: number;
    bull_score: string;
    bear_score: string;
    verdict_basis: string;
  };
  alpha?: AlphaData;
  beta?: BetaData;
};

// Mock historical price — replace with live data when available
const BASE_PRICE = 2420;
const PRICE_HISTORY = [
  { label: "Sep", price: 1780 },
  { label: "Oct", price: 1850 },
  { label: "Nov", price: 1920 },
  { label: "Dec", price: 2050 },
  { label: "Jan", price: 2180 },
  { label: "Feb", price: 2350 },
  { label: "Mar'26", price: 2420 },
];

function ProjectionChart({ alpha, beta }: { alpha?: AlphaData; beta?: BetaData }) {
  const currentPrice = BASE_PRICE;
  const alphaReturn = alpha?.expected_return ?? 65;
  // risk_score treated as 0-1 downside fraction (e.g. 0.3 → -30%)
  const betaLossFrac = beta ? Math.min(beta.risk_score, 0.7) : 0.25;

  const alphaTarget = Math.round(currentPrice * (1 + alphaReturn / 100));
  const betaTarget = Math.round(currentPrice * (1 - betaLossFrac));
  const alphaPct = Math.round(((alphaTarget - currentPrice) / currentPrice) * 100);
  const betaPct = Math.round(((betaTarget - currentPrice) / currentPrice) * 100);

  // Projection quarters over ~3 years
  const QUARTERS = ["Now", "Q3'26", "Q1'27", "Q3'27", "Q1'28", "Q3'28", "Q1'29"];
  const PREDICTION = QUARTERS.map((label, i) => {
    const frac = i / (QUARTERS.length - 1);
    return {
      label,
      upper: Math.round(currentPrice + (alphaTarget - currentPrice) * frac),
      lower: Math.round(currentPrice + (betaTarget - currentPrice) * frac),
    };
  });

  const W = 700;
  const H = 240;
  const padL = 60;
  const padR = 36;
  const padT = 28;
  const padB = 40;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const allPrices = [
    ...PRICE_HISTORY.map((p) => p.price),
    ...PREDICTION.map((p) => p.upper),
    ...PREDICTION.map((p) => p.lower),
  ];
  const allMin = Math.min(...allPrices) - 180;
  const allMax = Math.max(...allPrices) + 220;

  const totalPts = PRICE_HISTORY.length + PREDICTION.length - 1;
  const xStep = innerW / (totalPts - 1);
  const toX = (i: number) => padL + i * xStep;
  const toY = (p: number) => padT + innerH - ((p - allMin) / (allMax - allMin)) * innerH;

  const predOff = PRICE_HISTORY.length - 1;

  const histPath = PRICE_HISTORY.map((p, i) =>
    `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.price).toFixed(1)}`
  ).join(" ");

  const upperPath = PREDICTION.map((p, i) =>
    `${i === 0 ? "M" : "L"}${toX(predOff + i).toFixed(1)},${toY(p.upper).toFixed(1)}`
  ).join(" ");

  const lowerPath = PREDICTION.map((p, i) =>
    `${i === 0 ? "M" : "L"}${toX(predOff + i).toFixed(1)},${toY(p.lower).toFixed(1)}`
  ).join(" ");

  const upperPtsStr = PREDICTION.map((p, i) =>
    `${toX(predOff + i).toFixed(1)},${toY(p.upper).toFixed(1)}`
  ).join(" ");
  const lowerPtsStrRev = PREDICTION.slice()
    .reverse()
    .map((p, i) =>
      `${toX(predOff + PREDICTION.length - 1 - i).toFixed(1)},${toY(p.lower).toFixed(1)}`
    )
    .join(" ");
  const bandPath = `M${upperPtsStr.split(" ")[0]} L${upperPtsStr} L${lowerPtsStrRev} Z`;

  const priceTicks = [0, 0.25, 0.5, 0.75, 1].map((t) =>
    Math.round(allMin + (allMax - allMin) * t)
  );

  const xLabels = [
    ...PRICE_HISTORY.map((p) => p.label),
    ...PREDICTION.slice(1).map((p) => p.label),
  ];

  const lastUpper = PREDICTION[PREDICTION.length - 1].upper;
  const lastLower = PREDICTION[PREDICTION.length - 1].lower;

  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
      {/* Chart header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] text-zinc-500 mb-0.5">3-Year Alpha / Beta Scenario Projection</div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-zinc-100">JPY {currentPrice.toLocaleString()}</span>
            <span className="text-xs text-zinc-500">Current</span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-[9px] text-emerald-500 uppercase tracking-wider font-bold mb-0.5">α Alpha Target</div>
            <div className="text-lg font-bold text-emerald-400">JPY {alphaTarget.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-400 font-semibold">+{alphaPct}% upside</div>
          </div>
          <div className="w-px h-10 bg-zinc-800" />
          <div className="text-right">
            <div className="text-[9px] text-red-500 uppercase tracking-wider font-bold mb-0.5">β Beta Target</div>
            <div className="text-lg font-bold text-red-400">JPY {betaTarget.toLocaleString()}</div>
            <div className="text-[11px] text-red-400 font-semibold">{betaPct}% downside</div>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Grid */}
        {priceTicks.map((price, idx) => {
          const t = idx / (priceTicks.length - 1);
          const y = padT + innerH * (1 - t);
          return (
            <g key={idx}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#27272a" strokeWidth={0.5} />
              <text x={padL - 8} y={y + 3} fontSize={9} fill="#52525b" textAnchor="end" fontFamily="monospace">
                {price >= 1000 ? `${(price / 1000).toFixed(1)}K` : price}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {xLabels.map((label, i) =>
          i % 2 === 0 ? (
            <text key={i} x={toX(i)} y={H - 8} fontSize={9} fill="#52525b" textAnchor="middle" fontFamily="monospace">
              {label}
            </text>
          ) : null
        )}

        {/* "Now" divider */}
        <line
          x1={toX(predOff)} y1={padT - 10}
          x2={toX(predOff)} y2={H - padB + 4}
          stroke="#52525b" strokeWidth={1} strokeDasharray="4 4" opacity={0.4}
        />

        {/* Scenario band fill */}
        <path d={bandPath} fill="url(#scenarioBand)" opacity={0.12} />
        <defs>
          <linearGradient id="scenarioBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Historical line */}
        <path d={histPath} fill="none" stroke="#a1a1aa" strokeWidth={2} />

        {/* Alpha upside line */}
        <path d={upperPath} fill="none" stroke="#10b981" strokeWidth={2} strokeDasharray="7 3" />

        {/* Beta downside line */}
        <path d={lowerPath} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="7 3" />

        {/* Current price dot */}
        <circle cx={toX(predOff)} cy={toY(currentPrice)} r={4} fill="#a1a1aa" stroke="#18181b" strokeWidth={2} />

        {/* Alpha end dot + label */}
        <circle cx={toX(totalPts - 1)} cy={toY(lastUpper)} r={5} fill="#10b981" stroke="#18181b" strokeWidth={2} />
        <text
          x={toX(totalPts - 1)} y={toY(lastUpper) - 10}
          fontSize={10} fill="#10b981" textAnchor="middle" fontWeight="bold" fontFamily="monospace"
        >
          {alphaTarget.toLocaleString()}
        </text>

        {/* Beta end dot + label */}
        <circle cx={toX(totalPts - 1)} cy={toY(lastLower)} r={5} fill="#ef4444" stroke="#18181b" strokeWidth={2} />
        <text
          x={toX(totalPts - 1)} y={toY(lastLower) + 18}
          fontSize={10} fill="#ef4444" textAnchor="middle" fontWeight="bold" fontFamily="monospace"
        >
          {betaTarget.toLocaleString()}
        </text>

        {/* Alpha probability label */}
        {alpha && (
          <text
            x={toX(predOff) + (toX(totalPts - 1) - toX(predOff)) * 0.45}
            y={toY(lastUpper) - 4}
            fontSize={9} fill="#10b981" textAnchor="middle" fontFamily="monospace" opacity={0.7}
          >
            {alpha.probability}% prob
          </text>
        )}

        {/* Beta probability label */}
        {beta && (
          <text
            x={toX(predOff) + (toX(totalPts - 1) - toX(predOff)) * 0.45}
            y={toY(lastLower) + 30}
            fontSize={9} fill="#ef4444" textAnchor="middle" fontFamily="monospace" opacity={0.7}
          >
            {beta.probability}% prob
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-2 text-[9px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-[2px] bg-zinc-400" /> Historical
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-[2px] bg-emerald-400" /> α Alpha (Upside)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-[2px] bg-red-400" /> β Beta (Downside)
        </span>
      </div>
    </div>
  );
}

function AlphaBetaDetail({
  alpha,
  beta,
  thesis,
  risks,
}: {
  alpha?: AlphaData;
  beta?: BetaData;
  thesis?: ThesisItem[];
  risks?: ThesisItem[];
}) {
  const currentPrice = BASE_PRICE;
  const alphaReturn = alpha?.expected_return ?? 65;
  const betaLossFrac = beta ? Math.min(beta.risk_score, 0.7) : 0.25;

  const alphaTarget = Math.round(currentPrice * (1 + alphaReturn / 100));
  const betaTarget = Math.round(currentPrice * (1 - betaLossFrac));
  const alphaPct = Math.round(((alphaTarget - currentPrice) / currentPrice) * 100);
  const betaPct = Math.round(((betaTarget - currentPrice) / currentPrice) * 100);

  const maxImpact = alpha && alpha.drivers.length > 0
    ? Math.max(...alpha.drivers.map((d) => d.impact))
    : 1;
  const maxSeverity = beta && beta.factors.length > 0
    ? Math.max(...beta.factors.map((f) => f.severity))
    : 1;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* ── Alpha Column ── */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-400">α</span>
            <div>
              <div className="text-sm font-bold text-emerald-400">Alpha · Bull Case</div>
              <div className="text-[10px] text-zinc-500">Upside Scenario</div>
            </div>
          </div>
          {alpha && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              {alpha.probability}% probability
            </span>
          )}
        </div>

        {/* Target price */}
        <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/10 p-3">
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Target Price (3Y)</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">JPY {alphaTarget.toLocaleString()}</span>
            <span className="text-sm font-bold text-emerald-400">+{alphaPct}%</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">vs. JPY {currentPrice.toLocaleString()} current</div>
        </div>

        {/* Bull agent reasoning */}
        {alpha && alpha.drivers.length > 0 && (
          <div>
            <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-2.5">
              Bull Agent Reasoning
            </div>
            <div className="space-y-3">
              {alpha.drivers.map((d, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500 text-xs mt-0.5 shrink-0">↑</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-300 leading-snug">{d.factor}</span>
                      <span className="text-xs font-bold text-emerald-400 ml-2 shrink-0">+{d.impact}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                        style={{ width: `${(d.impact / maxImpact) * 100}%`, opacity: 0.7 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Judge's investment thesis */}
        {thesis && thesis.length > 0 && (
          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
              Judge's Investment Thesis
            </div>
            <div className="space-y-1.5">
              {thesis.map((t, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 text-xs mt-0.5 shrink-0">+</span>
                  <span className="text-[11px] text-zinc-400 leading-snug">{t.claim}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Beta Column ── */}
      <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-red-400">β</span>
            <div>
              <div className="text-sm font-bold text-red-400">Beta · Bear Case</div>
              <div className="text-[10px] text-zinc-500">Downside Risk</div>
            </div>
          </div>
          {beta && (
            <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
              {beta.probability}% probability
            </span>
          )}
        </div>

        {/* Target price */}
        <div className="rounded-lg bg-red-950/30 border border-red-500/10 p-3">
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Downside Target (3Y)</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-400">JPY {betaTarget.toLocaleString()}</span>
            <span className="text-sm font-bold text-red-400">{betaPct}%</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">vs. JPY {currentPrice.toLocaleString()} current</div>
        </div>

        {/* Bear agent reasoning */}
        {beta && beta.factors.length > 0 && (
          <div>
            <div className="text-[9px] font-bold text-red-500 uppercase tracking-wider mb-2.5">
              Bear Agent Reasoning
            </div>
            <div className="space-y-3">
              {beta.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-red-500 text-xs mt-0.5 shrink-0">↓</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-300 leading-snug">{f.factor}</span>
                      <span className="text-xs font-bold text-red-400 ml-2 shrink-0">
                        -{Math.round(f.severity * 100)}%
                      </span>
                    </div>
                    <div className="h-1 bg-zinc-800/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all duration-700"
                        style={{ width: `${(f.severity / maxSeverity) * 100}%`, opacity: 0.7 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Judge's key risks */}
        {risks && risks.length > 0 && (
          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
              Judge's Key Risks
            </div>
            <div className="space-y-1.5">
              {risks.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-red-600 text-xs mt-0.5 shrink-0">!</span>
                  <span className="text-[11px] text-zinc-400 leading-snug">{r.claim}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PredictionDashboard({
  company = "Company",
  signal,
  confidence,
  summary,
  thesis,
  risks,
  debate_summary,
  alpha,
  beta,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!contentRef.current || exporting) return;
    setExporting(true);
    try {
      await exportReportPDF(contentRef.current, {
        company,
        signal,
        confidence,
        alphaReturn:      alpha?.expected_return,
        alphaProbability: alpha?.probability,
        betaRisk:         beta?.risk_score,
        betaProbability:  beta?.probability,
        summary,
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-950/80 overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-zinc-200">Alpha / Beta Analysis</span>
          {debate_summary && (
            <span className="text-[9px] text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded">
              {debate_summary.rounds} debate round{debate_summary.rounds !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`text-sm font-black ${
              signal === "BUY"
                ? "text-emerald-400"
                : signal === "SELL"
                ? "text-red-400"
                : "text-yellow-400"
            }`}
          >
            {signal}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500">{confidence}% confidence</span>
          </div>

          {/* Export PDF button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-950/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <span className="inline-block h-3 w-3 rounded-full border border-zinc-500 border-t-emerald-400 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                  <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Capturable content */}
      <div ref={contentRef} className="p-5 space-y-5">
        {/* Summary */}
        {summary && (
          <p className="text-sm text-zinc-400 leading-relaxed border-l-2 border-zinc-700 pl-3">{summary}</p>
        )}

        {/* Projection chart */}
        <ProjectionChart alpha={alpha} beta={beta} />

        {/* Alpha / Beta detail columns */}
        <AlphaBetaDetail alpha={alpha} beta={beta} thesis={thesis} risks={risks} />
      </div>
    </div>
  );
}
