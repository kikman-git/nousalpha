"use client";

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

type Props = {
  signal: string;
  confidence: number;
  alpha?: AlphaData;
  beta?: BetaData;
};

// Mock stock price data for Akatsuki TYO:3932
const PRICE_HISTORY = [
  { label: "Sep", price: 1780 },
  { label: "Oct", price: 1850 },
  { label: "Nov", price: 1920 },
  { label: "Dec", price: 2050 },
  { label: "Jan", price: 2180 },
  { label: "Feb", price: 2350 },
  { label: "Mar", price: 2420 },
];

const PREDICTION = [
  { label: "Mar", price: 2420, upper: 2420, lower: 2420 },
  { label: "Jun'26", price: 2680, upper: 2900, lower: 2450 },
  { label: "Sep'26", price: 2950, upper: 3300, lower: 2550 },
  { label: "Dec'26", price: 3200, upper: 3700, lower: 2600 },
  { label: "Mar'27", price: 3500, upper: 4200, lower: 2700 },
  { label: "Sep'27", price: 3750, upper: 4600, lower: 2800 },
  { label: "Mar'28", price: 4000, upper: 5100, lower: 2850 },
  { label: "Mar'29", price: 4400, upper: 5800, lower: 2900 },
];

const METRICS = [
  { label: "Stock Price", value: "JPY 2,420", change: "+18.84%", positive: true },
  { label: "Revenue (Q2)", value: "JPY 7.6B", change: "+32.1%", positive: true },
  { label: "Net Income", value: "JPY 3.0B", change: "+28.7%", positive: true },
  { label: "DOE", value: "4.0%", change: "+0.5pt", positive: true },
];

const SEGMENT_DATA = [
  { label: "Game / Comic", current: 5.2, prev: 4.1, color: "#22c55e" },
  { label: "Ent / Lifestyle", current: 1.8, prev: 1.2, color: "#06b6d4" },
  { label: "AI-DX Solutions", current: 0.6, prev: 0.0, color: "#a855f7" },
];

function LineChart() {
  const W = 700;
  const H = 220;
  const padL = 55;
  const padR = 30;
  const padT = 25;
  const padB = 35;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const allMin = Math.min(
    ...PRICE_HISTORY.map((p) => p.price),
    ...PREDICTION.map((p) => p.lower)
  ) - 200;
  const allMax = Math.max(
    ...PRICE_HISTORY.map((p) => p.price),
    ...PREDICTION.map((p) => p.upper)
  ) + 300;

  const totalPts = PRICE_HISTORY.length + PREDICTION.length - 1;
  const xStep = innerW / (totalPts - 1);
  const toX = (i: number) => padL + i * xStep;
  const toY = (p: number) => padT + innerH - ((p - allMin) / (allMax - allMin)) * innerH;

  const histPath = PRICE_HISTORY.map((p, i) =>
    `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.price).toFixed(1)}`
  ).join(" ");

  const predOff = PRICE_HISTORY.length - 1;
  const predPath = PREDICTION.map((p, i) =>
    `${i === 0 ? "M" : "L"}${toX(predOff + i).toFixed(1)},${toY(p.price).toFixed(1)}`
  ).join(" ");

  const upperPts = PREDICTION.map((p, i) =>
    `${toX(predOff + i).toFixed(1)},${toY(p.upper).toFixed(1)}`
  ).join(" ");
  const lowerPts = PREDICTION.slice().reverse().map((p, i) =>
    `${toX(predOff + PREDICTION.length - 1 - i).toFixed(1)},${toY(p.lower).toFixed(1)}`
  ).join(" ");
  const bandPath = `M${upperPts.split(" ")[0]} L${upperPts} L${lowerPts} Z`;

  const target = PREDICTION[PREDICTION.length - 1];
  const current = PRICE_HISTORY[PRICE_HISTORY.length - 1];
  const upside = Math.round(((target.price - current.price) / current.price) * 100);

  const labels = [
    ...PRICE_HISTORY.map((p) => p.label),
    ...PREDICTION.slice(1).map((p) => p.label),
  ];

  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-[10px] text-zinc-500">Akatsuki Inc. (TYO: 3932)</div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-zinc-100">JPY {current.price.toLocaleString()}</span>
            <span className="text-sm text-emerald-400 font-semibold">+18.84%</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-zinc-500 uppercase">3Y Target</div>
          <div className="text-lg font-bold text-emerald-400">JPY {target.price.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-400">+{upside}% upside</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padT + innerH * (1 - t);
          const price = Math.round(allMin + (allMax - allMin) * t);
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#27272a" strokeWidth={0.5} />
              <text x={padL - 8} y={y + 3} fontSize={9} fill="#52525b" textAnchor="end" fontFamily="monospace">
                {price >= 1000 ? `${(price / 1000).toFixed(1)}K` : price}
              </text>
            </g>
          );
        })}
        {labels.map((label, i) => (
          i % 2 === 0 ? (
            <text key={i} x={toX(i)} y={H - 8} fontSize={9} fill="#52525b" textAnchor="middle" fontFamily="monospace">
              {label}
            </text>
          ) : null
        ))}
        <path d={bandPath} fill="#10b981" opacity={0.06} />
        {PREDICTION.map((p, i) => i > 0 ? (
          <g key={`band-${i}`}>
            <line x1={toX(predOff + i - 1)} y1={toY(PREDICTION[i - 1].upper)} x2={toX(predOff + i)} y2={toY(p.upper)} stroke="#10b981" strokeWidth={0.7} opacity={0.25} strokeDasharray="3 3" />
            <line x1={toX(predOff + i - 1)} y1={toY(PREDICTION[i - 1].lower)} x2={toX(predOff + i)} y2={toY(p.lower)} stroke="#ef4444" strokeWidth={0.7} opacity={0.25} strokeDasharray="3 3" />
          </g>
        ) : null)}
        <path d={histPath} fill="none" stroke="#a1a1aa" strokeWidth={2} />
        <path d={predPath} fill="none" stroke="#10b981" strokeWidth={2} strokeDasharray="6 3" />
        <circle cx={toX(predOff)} cy={toY(current.price)} r={4} fill="#a1a1aa" stroke="#18181b" strokeWidth={2} />
        <circle cx={toX(totalPts - 1)} cy={toY(target.price)} r={5} fill="#10b981" stroke="#18181b" strokeWidth={2} />
        <text x={toX(totalPts - 1)} y={toY(target.price) - 12} fontSize={11} fill="#10b981" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
          {target.price.toLocaleString()}
        </text>
        {/* Alpha label at upper band end */}
        <text x={toX(totalPts - 1)} y={toY(target.upper) - 8} fontSize={9} fill="#10b981" textAnchor="middle" fontFamily="monospace" opacity={0.6}>
          {target.upper.toLocaleString()}
        </text>
        {/* Beta label at lower band end */}
        <text x={toX(totalPts - 1)} y={toY(target.lower) + 14} fontSize={9} fill="#ef4444" textAnchor="middle" fontFamily="monospace" opacity={0.6}>
          {target.lower.toLocaleString()}
        </text>
      </svg>
      <div className="flex justify-center gap-6 mt-1 text-[9px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-[2px] bg-zinc-400" /> Historical
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-[2px] bg-emerald-400" /> Prediction
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-[2px] bg-emerald-400 opacity-40" style={{ borderTop: "1px dashed" }} /> Alpha (upside)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-[2px] bg-red-400 opacity-40" style={{ borderTop: "1px dashed" }} /> Beta (downside)
        </span>
      </div>
    </div>
  );
}

function AlphaBetaPanel({ alpha, beta }: { alpha?: AlphaData; beta?: BetaData }) {
  if (!alpha && !beta) return null;

  const maxImpact = alpha ? Math.max(...alpha.drivers.map((d) => d.impact)) : 1;
  const maxSeverity = beta ? Math.max(...beta.factors.map((f) => f.severity)) : 1;

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Alpha — Potential Return */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-emerald-400">{"\u03B1"}</span>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Alpha (Return)</span>
          </div>
          {alpha && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              {alpha.probability}% prob.
            </span>
          )}
        </div>
        {alpha && (
          <>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-black text-emerald-400">+{alpha.expected_return}%</span>
              <span className="text-[10px] text-zinc-500">expected return (3Y)</span>
            </div>
            <div className="space-y-2.5">
              {alpha.drivers.map((d, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-zinc-300 leading-tight flex-1">{d.factor}</span>
                    <span className="text-[10px] font-bold text-emerald-400 ml-2 shrink-0">+{d.impact}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                      style={{ width: `${(d.impact / maxImpact) * 100}%`, opacity: 0.7 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Beta — Risk */}
      <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-red-400">{"\u03B2"}</span>
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Beta (Risk)</span>
          </div>
          {beta && (
            <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
              {beta.probability}% prob.
            </span>
          )}
        </div>
        {beta && (
          <>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-black text-red-400">{beta.risk_score.toFixed(2)}</span>
              <span className="text-[10px] text-zinc-500">risk score</span>
            </div>
            <div className="space-y-2.5">
              {beta.factors.map((f, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-zinc-300 leading-tight flex-1">{f.factor}</span>
                    <span className="text-[10px] font-bold text-red-400 ml-2 shrink-0">{Math.round(f.severity * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all duration-1000"
                      style={{ width: `${(f.severity / maxSeverity) * 100}%`, opacity: 0.7 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PredictionDashboard({ signal, confidence, alpha, beta }: Props) {
  const maxSeg = Math.max(...SEGMENT_DATA.map((s) => s.current));

  return (
    <div className="mt-4 rounded-xl border border-zinc-700/50 bg-zinc-950/80 overflow-hidden animate-fade-in-up">
      <div className="px-5 py-3 border-b border-zinc-800/50 flex items-center justify-between">
        <span className="text-sm font-bold text-zinc-200">Investment Analysis Dashboard</span>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-black ${signal === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
            {signal}
          </span>
          <span className="text-[10px] text-zinc-500">{confidence}% confidence</span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Line Chart */}
        <LineChart />

        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-3">
          {METRICS.map((m) => (
            <div key={m.label} className="rounded-xl bg-zinc-900/50 border border-zinc-800/50 px-4 py-3">
              <div className="text-[9px] text-zinc-500 uppercase tracking-wider">{m.label}</div>
              <div className="text-lg font-bold text-zinc-100 mt-1">{m.value}</div>
              <div className={`text-xs mt-0.5 font-medium ${m.positive ? "text-emerald-400" : "text-red-400"}`}>
                {m.positive ? "\u2191" : "\u2193"} {m.change}
              </div>
            </div>
          ))}
        </div>

        {/* Alpha / Beta */}
        <AlphaBetaPanel alpha={alpha} beta={beta} />

        {/* Segment Revenue */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Segment Revenue (JPY B)</div>
          <div className="grid grid-cols-3 gap-4">
            {SEGMENT_DATA.map((seg) => (
              <div key={seg.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-zinc-300">{seg.label}</span>
                  <span className="text-[11px] text-zinc-400 font-mono">{seg.current}B</span>
                </div>
                <div className="flex gap-1 items-center">
                  <div className="flex-1 h-6 bg-zinc-800/50 rounded overflow-hidden relative">
                    {seg.prev > 0 && (
                      <div
                        className="absolute h-full rounded opacity-30"
                        style={{ width: `${(seg.prev / maxSeg) * 100}%`, backgroundColor: seg.color }}
                      />
                    )}
                    <div
                      className="h-full rounded transition-all duration-1000 relative"
                      style={{ width: `${(seg.current / maxSeg) * 100}%`, backgroundColor: seg.color, opacity: 0.8 }}
                    />
                  </div>
                  {seg.prev > 0 ? (
                    <span className="text-[9px] text-emerald-400 w-10 text-right font-mono">
                      +{Math.round(((seg.current - seg.prev) / seg.prev) * 100)}%
                    </span>
                  ) : (
                    <span className="text-[9px] text-purple-400 w-10 text-right">NEW</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
