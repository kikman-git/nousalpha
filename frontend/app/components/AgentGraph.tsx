"use client";

import { AgentState, ToolTrace } from "../page";

type Props = {
  agents: Record<string, AgentState>;
  highlightedEvidence: string[];
};

const CENTER_X = 400;
const CHILD_POSITIONS = [
  { id: "news", x: 100, color: "#22c55e", label: "News Agent" },
  { id: "ir", x: 290, color: "#06b6d4", label: "IR Agent" },
  { id: "financial", x: 490, color: "#8b5cf6", label: "Financial Agent" },
  { id: "satellite", x: 680, color: "#ec4899", label: "Satellite Agent" },
];

function flattenObj(obj: Record<string, unknown>): string[] {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const val = Array.isArray(v) ? v.join(", ") : typeof v === "object" && v !== null ? JSON.stringify(v) : String(v);
    lines.push(`${k}: ${val}`);
  }
  return lines;
}

function OrchestratorNode({ y, message, status }: { y: number; message: string; status: string }) {
  const w = 280;
  const h = 44;
  const isActive = status === "running";
  const isDone = status === "completed";
  const color = isDone ? "#3b82f6" : isActive ? "#f59e0b" : "#3f3f46";

  return (
    <g>
      {isActive && (
        <rect x={CENTER_X - w / 2 - 3} y={y - 3} width={w + 6} height={h + 6} rx={14}
          fill="none" stroke="#f59e0b" strokeWidth={1} opacity={0.3} className="animate-pulse-glow" />
      )}
      <rect x={CENTER_X - w / 2} y={y} width={w} height={h} rx={12}
        fill={isDone ? "#0c1425" : isActive ? "#1a1508" : "#18181b"}
        stroke={color} strokeWidth={1.5} />
      <circle cx={CENTER_X - w / 2 + 16} cy={y + h / 2} r={5}
        fill={color} className={isActive ? "animate-pulse-glow" : ""} />
      <text x={CENTER_X - w / 2 + 28} y={y + h / 2 - 4}
        fontSize={11} fontWeight={700} fill={color}
        fontFamily="var(--font-geist-mono), monospace">
        Orchestrator
      </text>
      <text x={CENTER_X - w / 2 + 28} y={y + h / 2 + 10}
        fontSize={8} fill="#71717a"
        fontFamily="var(--font-geist-mono), monospace">
        {message}
      </text>
    </g>
  );
}

function AgentNode({ x, y, label, color, status }: {
  x: number; y: number; label: string; color: string; status: string;
}) {
  const w = 150;
  const h = 36;
  const isActive = status === "running";
  const isDone = status === "completed";
  const nodeColor = isDone ? "#3b82f6" : isActive ? color : "#3f3f46";

  return (
    <g>
      {isActive && (
        <rect x={x - w / 2 - 2} y={y - 2} width={w + 4} height={h + 4} rx={12}
          fill="none" stroke={color} strokeWidth={1} opacity={0.3} className="animate-pulse-glow" />
      )}
      <rect x={x - w / 2} y={y} width={w} height={h} rx={10}
        fill={isDone ? "#0c1425" : isActive ? color + "10" : "#18181b"}
        stroke={nodeColor} strokeWidth={1.5} />
      <circle cx={x - w / 2 + 14} cy={y + h / 2} r={3.5}
        fill={nodeColor} className={isActive ? "animate-pulse-glow" : ""} />
      <text x={x - w / 2 + 24} y={y + h / 2 + 4}
        fontSize={10} fontWeight={600} fill={nodeColor}
        fontFamily="var(--font-geist-mono), monospace">
        {label}
      </text>
    </g>
  );
}

function ToolCard({ tool, x, y, color, highlighted }: {
  tool: ToolTrace; x: number; y: number; color: string; highlighted: boolean;
}) {
  const isDone = tool.status === "completed";
  const inputLines = tool.input ? flattenObj(tool.input) : [];
  const outputLines = tool.output ? flattenObj(tool.output) : [];
  const w = 150;
  const lineH = 11;
  const headerH = 18;
  const gap = outputLines.length > 0 && inputLines.length > 0 ? 5 : 0;
  const h = headerH + (inputLines.length + outputLines.length) * lineH + gap + 8;

  return (
    <g>
      {highlighted && (
        <rect x={x - w / 2 - 3} y={y - 3} width={w + 6} height={h + 6} rx={10}
          fill="none" stroke="#22c55e" strokeWidth={2} opacity={0.8} className="animate-pulse-glow" />
      )}
      <rect x={x - w / 2} y={y} width={w} height={h} rx={8}
        fill={highlighted ? "#052e1620" : "#0a0a12"}
        stroke={highlighted ? "#22c55e40" : color + "15"} strokeWidth={1} />
      {/* Left accent */}
      <rect x={x - w / 2} y={y + 4} width={2.5} height={h - 8} rx={1}
        fill={isDone ? color : "#eab308"} opacity={highlighted ? 1 : 0.4} />
      {/* Tool name header */}
      <text x={x - w / 2 + 10} y={y + 13} fontSize={8.5} fontWeight={700}
        fill={isDone ? color : "#eab308"}
        fontFamily="var(--font-geist-mono), monospace">
        {tool.name}
      </text>
      {/* Evidence badge */}
      {tool.evidence_id && (
        <>
          <rect x={x + w / 2 - 50} y={y + 3} width={46} height={14} rx={4}
            fill={highlighted ? "#22c55e15" : "#ffffff05"} />
          <text x={x + w / 2 - 27} y={y + 13} fontSize={7}
            fill={highlighted ? "#4ade80" : "#3f3f46"} textAnchor="middle"
            fontFamily="var(--font-geist-mono), monospace">
            {tool.evidence_id}
          </text>
        </>
      )}
      {/* Input */}
      {inputLines.map((line, i) => (
        <text key={`in-${i}`} x={x - w / 2 + 10} y={y + headerH + 6 + i * lineH}
          fontSize={7.5} fill="#a1a1aa"
          fontFamily="var(--font-geist-mono), monospace">
          {line}
        </text>
      ))}
      {/* Divider */}
      {gap > 0 && (
        <line x1={x - w / 2 + 10} y1={y + headerH + inputLines.length * lineH + 3}
          x2={x + w / 2 - 10} y2={y + headerH + inputLines.length * lineH + 3}
          stroke="#ffffff08" strokeWidth={0.5} />
      )}
      {/* Output */}
      {outputLines.map((line, i) => (
        <text key={`out-${i}`} x={x - w / 2 + 10}
          y={y + headerH + inputLines.length * lineH + gap + 6 + i * lineH}
          fontSize={7.5} fill={highlighted ? "#86efac" : "#52525b"}
          fontFamily="var(--font-geist-mono), monospace">
          {line}
        </text>
      ))}
    </g>
  );
}

function getToolCardHeight(tool: ToolTrace): number {
  const inLen = tool.input ? Object.keys(tool.input).length : 0;
  const outLen = tool.output ? Object.keys(tool.output).length : 0;
  const gap = outLen > 0 && inLen > 0 ? 5 : 0;
  return 18 + (inLen + outLen) * 11 + gap + 8;
}

export default function AgentGraph({ agents, highlightedEvidence }: Props) {
  // Build vertical flow
  let y = 10;
  const elements: React.ReactNode[] = [];
  const orchestrator = agents.orchestrator;
  const orchStatus = orchestrator?.status || "idle";

  // --- Phase 1: Orchestrator "Starting" ---
  if (orchestrator?.messages.some((m) => m.includes("Starting"))) {
    elements.push(
      <OrchestratorNode key="orch-start" y={y} message="Starting comprehensive analysis"
        status={orchStatus === "completed" ? "completed" : "running"} />
    );
    y += 60;

    // Dispatch arrows down to agents
    elements.push(
      <g key="dispatch-arrows">
        {CHILD_POSITIONS.map((child) => (
          <line key={`dispatch-${child.id}`}
            x1={CENTER_X} y1={y - 16}
            x2={child.x} y2={y + 4}
            stroke="#f59e0b25" strokeWidth={1.5} strokeDasharray="4 3"
            markerEnd="url(#arrowDown)" />
        ))}
      </g>
    );
    y += 16;
  }

  // --- Phase 2: Agent nodes ---
  const agentY = y;
  CHILD_POSITIONS.forEach((child) => {
    const agent = agents[child.id];
    elements.push(
      <AgentNode key={`agent-${child.id}`}
        x={child.x} y={agentY} label={child.label}
        color={child.color} status={agent?.status || "idle"} />
    );
  });
  y = agentY + 48;

  // --- Phase 3: Tool cards per agent column ---
  // Calculate max height across all columns
  const columnHeights: Record<string, number> = {};
  CHILD_POSITIONS.forEach((child) => {
    const agent = agents[child.id];
    const tools = agent?.tools || [];
    // Deduplicate by evidence_id
    const seen = new Map<string, ToolTrace>();
    for (const t of tools) {
      const key = t.evidence_id || t.name + t.status;
      seen.set(key, t);
    }
    const uniqueTools = Array.from(seen.values());

    let toolY = y;
    uniqueTools.forEach((tool, i) => {
      const isHighlighted = tool.evidence_id ? highlightedEvidence.includes(tool.evidence_id) : false;

      // Connector line from agent or previous tool
      elements.push(
        <line key={`conn-${child.id}-${i}`}
          x1={child.x} y1={toolY - 8}
          x2={child.x} y2={toolY + 2}
          stroke={child.color + "30"} strokeWidth={1} />
      );

      elements.push(
        <ToolCard key={`tool-${child.id}-${i}`}
          tool={tool} x={child.x} y={toolY}
          color={child.color} highlighted={isHighlighted} />
      );

      toolY += getToolCardHeight(tool) + 12;
    });
    columnHeights[child.id] = toolY;
  });

  y = Math.max(y + 40, ...Object.values(columnHeights)) + 8;

  // --- Phase 4: Return arrows back to orchestrator ---
  if (orchestrator?.messages.some((m) => m.includes("Aggregating"))) {
    elements.push(
      <g key="return-arrows">
        {CHILD_POSITIONS.map((child) => (
          <line key={`return-${child.id}`}
            x1={child.x} y1={y - 8}
            x2={CENTER_X} y2={y + 20}
            stroke="#3b82f640" strokeWidth={1.5} strokeDasharray="4 3"
            markerEnd="url(#arrowUp)" />
        ))}
      </g>
    );
    y += 28;

    // --- Phase 5: Orchestrator "Aggregating" ---
    elements.push(
      <OrchestratorNode key="orch-agg" y={y} message="Aggregating results from all agents"
        status="running" />
    );
    y += 56;
  }

  // --- Phase 6: Orchestrator "Cross-referencing" ---
  if (orchestrator?.messages.some((m) => m.includes("Cross-referencing"))) {
    elements.push(
      <line key="orch-conn-2" x1={CENTER_X} y1={y - 8} x2={CENTER_X} y2={y + 4}
        stroke="#f59e0b20" strokeWidth={1} />
    );
    elements.push(
      <OrchestratorNode key="orch-synth" y={y} message="Cross-referencing evidence"
        status="running" />
    );
    y += 56;
  }

  // --- Phase 7: Orchestrator "Complete" ---
  if (orchestrator?.messages.some((m) => m.includes("Analysis complete"))) {
    elements.push(
      <line key="orch-conn-3" x1={CENTER_X} y1={y - 8} x2={CENTER_X} y2={y + 4}
        stroke="#3b82f620" strokeWidth={1} />
    );
    elements.push(
      <OrchestratorNode key="orch-done" y={y} message="Analysis complete — Signal generated"
        status="completed" />
    );
    y += 56;
  }

  const svgHeight = Math.max(300, y + 10);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 overflow-x-auto">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Agent Flow</span>
        <div className="flex-1 h-px bg-zinc-800" />
        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Active
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> Done
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 800 ${svgHeight}`} className="w-full h-auto" style={{ minWidth: 700 }}>
        <defs>
          <marker id="arrowDown" markerWidth="6" markerHeight="5" refX="3" refY="5" orient="auto">
            <path d="M0,0 L3,5 L6,0" fill="#f59e0b40" />
          </marker>
          <marker id="arrowUp" markerWidth="6" markerHeight="5" refX="3" refY="0" orient="auto">
            <path d="M0,5 L3,0 L6,5" fill="#3b82f660" />
          </marker>
        </defs>
        {elements}
      </svg>
    </div>
  );
}
