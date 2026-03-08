"use client";

import { AgentState } from "../page";

type Props = {
  agents: Record<string, AgentState>;
};

// ── Layout constants ──────────────────────────────────────────────
const W = 1000;

const ORCH = { x: 500, y: 52, w: 260, h: 46 };

const DATA_AGENTS = [
  { id: "ir",        label: "IR Agent",      sub: "Filings/EDINET", x: 130, color: "#06b6d4" },
  { id: "company",   label: "Company Agent", sub: "Audio/Video",    x: 360, color: "#f59e0b" },
  { id: "news",      label: "News Agent",    sub: "Policy/Macro",   x: 640, color: "#22c55e" },
  { id: "satellite", label: "Satellite",     sub: "Geospatial",     x: 870, color: "#ec4899" },
] as const;

const NODE_W = 184;
const NODE_H = 52;
const DATA_Y = 195;

const AGG_Y = 355; // second orchestrator bar (aggregating phase)

const BULL = { id: "bull",  label: "Bull Agent", x: 300, color: "#22c55e" };
const BEAR = { id: "bear",  label: "Bear Agent", x: 700, color: "#ef4444" };
const JUDGE = { id: "judge", label: "Judge",      x: 500, color: "#f97316" };
const DEBATE_Y = 490;
const JUDGE_Y  = 590;

// ── Helpers ──────────────────────────────────────────────────────

function statusColor(status: string, defaultColor: string) {
  if (status === "completed") return "#3b82f6";
  if (status === "running")   return defaultColor;
  return "#3f3f46";
}

function statusBg(status: string) {
  if (status === "completed") return "#0c1425";
  if (status === "running")   return "#ffffff08";
  return "#18181b";
}

function AnimDash({ d, color, active }: { d: string; color: string; active: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={active ? 1.5 : 1}
      strokeDasharray={active ? "6 4" : "4 6"}
      opacity={active ? 0.7 : 0.2}
      style={active ? { animation: "dashFlow 1.2s linear infinite" } : undefined}
    />
  );
}

function OrchestratorNode({ y, message, status }: { y: number; message: string; status: string }) {
  const color = statusColor(status, "#f59e0b");
  const bg    = statusBg(status);
  const isRunning = status === "running";
  return (
    <g>
      {isRunning && (
        <rect
          x={ORCH.x - ORCH.w / 2 - 4} y={y - 4}
          width={ORCH.w + 8} height={ORCH.h + 8} rx={14}
          fill="none" stroke={color} strokeWidth={1} opacity={0.25}
          style={{ animation: "pulse 2s ease-in-out infinite" }}
        />
      )}
      <rect
        x={ORCH.x - ORCH.w / 2} y={y}
        width={ORCH.w} height={ORCH.h} rx={12}
        fill={bg} stroke={color} strokeWidth={1.5}
      />
      <circle cx={ORCH.x - ORCH.w / 2 + 16} cy={y + ORCH.h / 2} r={5} fill={color} />
      <text
        x={ORCH.x - ORCH.w / 2 + 28} y={y + ORCH.h / 2 - 5}
        fontSize={13} fontWeight={700} fill={color} fontFamily="monospace"
      >
        Orchestrator
      </text>
      <text
        x={ORCH.x - ORCH.w / 2 + 28} y={y + ORCH.h / 2 + 11}
        fontSize={10} fill="#71717a" fontFamily="monospace"
      >
        {message.slice(0, 38)}{message.length > 38 ? "…" : ""}
      </text>
    </g>
  );
}

function AgentNode({ agent, x, y, color, label, sub, toolCount }: {
  agent: AgentState | undefined;
  x: number; y: number; color: string; label: string; sub: string; toolCount: number;
}) {
  const status = agent?.status || "idle";
  const lastMsg = agent?.messages.filter(Boolean).at(-1) || "";
  const c  = statusColor(status, color);
  const bg = statusBg(status);
  const isRunning = status === "running";

  return (
    <g>
      {isRunning && (
        <rect
          x={x - NODE_W / 2 - 3} y={y - 3}
          width={NODE_W + 6} height={NODE_H + 6} rx={13}
          fill="none" stroke={color} strokeWidth={1} opacity={0.25}
          style={{ animation: "pulse 2s ease-in-out infinite" }}
        />
      )}
      <rect
        x={x - NODE_W / 2} y={y}
        width={NODE_W} height={NODE_H} rx={10}
        fill={bg} stroke={c} strokeWidth={1.5}
      />
      {/* Status dot */}
      <circle cx={x - NODE_W / 2 + 13} cy={y + NODE_H / 2} r={4} fill={c} />
      {/* Label */}
      <text
        x={x - NODE_W / 2 + 24} y={y + NODE_H / 2 - 5}
        fontSize={12} fontWeight={700} fill={c} fontFamily="monospace"
      >
        {label}
      </text>
      {/* Sub or message */}
      <text
        x={x - NODE_W / 2 + 24} y={y + NODE_H / 2 + 11}
        fontSize={9} fill="#52525b" fontFamily="monospace"
      >
        {lastMsg ? lastMsg.slice(0, 22) + (lastMsg.length > 22 ? "…" : "") : sub}
      </text>
      {/* Tool count badge */}
      {toolCount > 0 && (
        <g>
          <circle cx={x + NODE_W / 2 - 12} cy={y + 12} r={11}
            fill={status === "completed" ? "#1e3a5f" : "#1c1a0a"} stroke={c} strokeWidth={1} />
          <text
            x={x + NODE_W / 2 - 12} y={y + 16}
            fontSize={10} fontWeight={700} fill={c} textAnchor="middle" fontFamily="monospace"
          >
            {toolCount}
          </text>
        </g>
      )}
    </g>
  );
}

function DebateNode({ agent, x, y, color, label }: {
  agent: AgentState | undefined;
  x: number; y: number; color: string; label: string;
}) {
  const status = agent?.status || "idle";
  const lastMsg = agent?.messages.filter(Boolean).at(-1) || "";
  const c  = statusColor(status, color);
  const bg = statusBg(status);
  const isRunning = status === "running";

  return (
    <g>
      {isRunning && (
        <rect
          x={x - NODE_W / 2 - 3} y={y - 3}
          width={NODE_W + 6} height={NODE_H + 6} rx={13}
          fill="none" stroke={color} strokeWidth={1} opacity={0.3}
          style={{ animation: "pulse 1.5s ease-in-out infinite" }}
        />
      )}
      <rect
        x={x - NODE_W / 2} y={y}
        width={NODE_W} height={NODE_H} rx={10}
        fill={bg} stroke={c} strokeWidth={1.5}
      />
      <circle cx={x - NODE_W / 2 + 13} cy={y + NODE_H / 2} r={4} fill={c} />
      <text
        x={x - NODE_W / 2 + 24} y={y + NODE_H / 2 - 5}
        fontSize={12} fontWeight={700} fill={c} fontFamily="monospace"
      >
        {label}
      </text>
      {lastMsg && (
        <text
          x={x - NODE_W / 2 + 24} y={y + NODE_H / 2 + 11}
          fontSize={9} fill="#52525b" fontFamily="monospace"
        >
          {lastMsg.slice(0, 22)}{lastMsg.length > 22 ? "…" : ""}
        </text>
      )}
    </g>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function AgentFlowGraph({ agents }: Props) {
  const orchStatus  = agents.orchestrator?.status || "idle";
  const orchMsgs    = agents.orchestrator?.messages || [];

  const isDispatching  = orchMsgs.some((m) => m.includes("Dispatch") || m.includes("Identified"));
  const isAggregating  = orchMsgs.some((m) => m.includes("Aggregating") || m.includes("Cross-referencing") || m.includes("Evidence package"));
  const isDebating     = (agents.bull?.status !== "idle") || (agents.bear?.status !== "idle");
  const isJudging      = agents.judge?.status !== "idle";

  // SVG height depends on visible phases
  let svgH = DATA_Y + NODE_H + 30;
  if (isAggregating) svgH = AGG_Y + ORCH.h + 30;
  if (isDebating)    svgH = DEBATE_Y + NODE_H + 30;
  if (isJudging)     svgH = JUDGE_Y + NODE_H + 30;
  svgH = Math.max(svgH, 310);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 overflow-x-auto">
      <style>{`
        @keyframes dashFlow {
          to { stroke-dashoffset: -20; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.25; }
          50%       { opacity: 0.55; }
        }
      `}</style>

      {/* Legend */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Agent Flow</span>
        <div className="flex-1 h-px bg-zinc-800" />
        <div className="flex gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> Running
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> Done
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-zinc-600" /> Waiting
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${svgH}`} className="w-full h-auto">
        {/* ── Phase label: Data Collection ── */}
        <text x={16} y={DATA_Y - 16} fontSize={9} fill="#3f3f46" fontFamily="monospace" fontWeight={600}>
          DATA COLLECTION
        </text>
        <line x1={16} y1={DATA_Y - 8} x2={984} y2={DATA_Y - 8} stroke="#27272a" strokeWidth={0.5} />

        {/* ── Orchestrator (init) ── */}
        <OrchestratorNode
          y={ORCH.y}
          message={orchMsgs.at(-1) || "Waiting…"}
          status={orchStatus}
        />

        {/* ── Dispatch arrows: Orch → each agent ── */}
        {isDispatching && DATA_AGENTS.map((da) => {
          const agStatus = agents[da.id]?.status || "idle";
          const active = agStatus === "running";
          return (
            <AnimDash
              key={`d-${da.id}`}
              d={`M${ORCH.x},${ORCH.y + ORCH.h} L${da.x},${DATA_Y}`}
              color={da.color}
              active={active || agStatus === "completed"}
            />
          );
        })}

        {/* ── Data agent nodes ── */}
        {DATA_AGENTS.map((da) => {
          const ag = agents[da.id];
          const tools = ag?.tools.filter((t) => t.status === "completed").length || 0;
          return (
            <AgentNode
              key={da.id}
              agent={ag}
              x={da.x}
              y={DATA_Y}
              color={da.color}
              label={da.label}
              sub={da.sub}
              toolCount={tools}
            />
          );
        })}

        {/* ── Return arrows: agent → orch (when aggregating) ── */}
        {isAggregating && DATA_AGENTS.map((da) => {
          const agStatus = agents[da.id]?.status || "idle";
          return (
            <AnimDash
              key={`r-${da.id}`}
              d={`M${da.x},${DATA_Y + NODE_H} L${ORCH.x},${AGG_Y}`}
              color={da.color}
              active={agStatus === "completed"}
            />
          );
        })}

        {/* ── Aggregating orchestrator ── */}
        {isAggregating && (
          <>
            <text x={16} y={AGG_Y - 16} fontSize={9} fill="#3f3f46" fontFamily="monospace" fontWeight={600}>
              SYNTHESIS
            </text>
            <line x1={16} y1={AGG_Y - 8} x2={984} y2={AGG_Y - 8} stroke="#27272a" strokeWidth={0.5} />
            <OrchestratorNode
              y={AGG_Y}
              message={orchMsgs.filter(m => m.includes("Aggregat") || m.includes("Cross") || m.includes("Evidence")).at(-1) || "Synthesizing…"}
              status={isDebating ? "completed" : "running"}
            />
          </>
        )}

        {/* ── Debate arrows: Orch → Bull/Bear ── */}
        {isDebating && (
          <>
            <AnimDash
              d={`M${ORCH.x},${AGG_Y + ORCH.h} L${BULL.x},${DEBATE_Y}`}
              color={BULL.color}
              active={agents.bull?.status === "running"}
            />
            <AnimDash
              d={`M${ORCH.x},${AGG_Y + ORCH.h} L${BEAR.x},${DEBATE_Y}`}
              color={BEAR.color}
              active={agents.bear?.status === "running"}
            />
          </>
        )}

        {/* ── Debate phase label ── */}
        {isDebating && (
          <>
            <text x={16} y={DEBATE_Y - 16} fontSize={9} fill="#3f3f46" fontFamily="monospace" fontWeight={600}>
              ADVERSARIAL DEBATE
            </text>
            <line x1={16} y1={DEBATE_Y - 8} x2={984} y2={DEBATE_Y - 8} stroke="#27272a" strokeWidth={0.5} />
          </>
        )}

        {/* ── Bull node ── */}
        {isDebating && (
          <DebateNode
            agent={agents[BULL.id]}
            x={BULL.x} y={DEBATE_Y}
            color={BULL.color} label={BULL.label}
          />
        )}

        {/* ── Bear node ── */}
        {isDebating && (
          <DebateNode
            agent={agents[BEAR.id]}
            x={BEAR.x} y={DEBATE_Y}
            color={BEAR.color} label={BEAR.label}
          />
        )}

        {/* ── VS label between bull/bear ── */}
        {isDebating && !isJudging && (
          <text x={ORCH.x} y={DEBATE_Y + NODE_H / 2 + 5} fontSize={11} fontWeight={700}
            fill="#52525b" textAnchor="middle" fontFamily="monospace">
            VS
          </text>
        )}

        {/* ── Judge arrows: Bull/Bear → Judge ── */}
        {isJudging && (
          <>
            <AnimDash
              d={`M${BULL.x},${DEBATE_Y + NODE_H} L${JUDGE.x},${JUDGE_Y}`}
              color={JUDGE.color}
              active={agents.judge?.status === "running"}
            />
            <AnimDash
              d={`M${BEAR.x},${DEBATE_Y + NODE_H} L${JUDGE.x},${JUDGE_Y}`}
              color={JUDGE.color}
              active={agents.judge?.status === "running"}
            />
          </>
        )}

        {/* ── Judge phase label ── */}
        {isJudging && (
          <>
            <text x={16} y={JUDGE_Y - 16} fontSize={9} fill="#3f3f46" fontFamily="monospace" fontWeight={600}>
              VERDICT
            </text>
            <line x1={16} y1={JUDGE_Y - 8} x2={984} y2={JUDGE_Y - 8} stroke="#27272a" strokeWidth={0.5} />
          </>
        )}

        {/* ── Judge node ── */}
        {isJudging && (
          <DebateNode
            agent={agents[JUDGE.id]}
            x={JUDGE.x} y={JUDGE_Y}
            color={JUDGE.color} label={JUDGE.label}
          />
        )}
      </svg>
    </div>
  );
}
