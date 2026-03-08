"use client";

import { AgentState, ToolTrace } from "../page";

type Props = {
  agents: Record<string, AgentState>;
  highlightedEvidence: string[];
};

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  orchestrator: { x: 400, y: 50 },
  news: { x: 120, y: 200 },
  ir: { x: 310, y: 200 },
  financial: { x: 500, y: 200 },
  satellite: { x: 690, y: 200 },
};

const STATUS_COLORS: Record<string, { fill: string; stroke: string; text: string; glow: string }> = {
  idle: { fill: "#18181b", stroke: "#3f3f46", text: "#71717a", glow: "none" },
  running: { fill: "#052e16", stroke: "#22c55e", text: "#4ade80", glow: "#22c55e" },
  completed: { fill: "#0c1425", stroke: "#3b82f6", text: "#60a5fa", glow: "#3b82f6" },
};

const TOOL_COLORS: Record<string, string> = {
  calling: "#eab308",
  completed: "#22c55e",
};

function ToolNode({ tool, x, y, highlighted }: { tool: ToolTrace; x: number; y: number; highlighted: boolean }) {
  const isDone = tool.status === "completed";
  const w = 140;
  const h = 28;

  return (
    <g>
      {/* Highlight glow */}
      {highlighted && (
        <rect
          x={x - w / 2 - 2}
          y={y - h / 2 - 2}
          width={w + 4}
          height={h + 4}
          rx={8}
          fill="none"
          stroke="#22c55e"
          strokeWidth={1.5}
          opacity={0.6}
          className="animate-pulse-glow"
        />
      )}
      {/* Background */}
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={6}
        fill={highlighted ? "#052e1680" : "#1a1a2e"}
        stroke={isDone ? "#22c55e40" : "#eab30840"}
        strokeWidth={1}
      />
      {/* Icon */}
      <text
        x={x - w / 2 + 8}
        y={y + 4}
        fontSize={10}
        fill={TOOL_COLORS[tool.status] || "#71717a"}
      >
        {isDone ? "\u2713" : "\u25B6"}
      </text>
      {/* Tool name */}
      <text
        x={x - w / 2 + 22}
        y={y + 4}
        fontSize={9}
        fontWeight={500}
        fill={highlighted ? "#4ade80" : "#d4d4d8"}
        fontFamily="var(--font-geist-mono), monospace"
      >
        {tool.name}
      </text>
      {/* Evidence ID badge */}
      {tool.evidence_id && (
        <text
          x={x + w / 2 - 8}
          y={y + 4}
          fontSize={7}
          fill={highlighted ? "#4ade80" : "#52525b"}
          textAnchor="end"
          fontFamily="var(--font-geist-mono), monospace"
        >
          {tool.evidence_id}
        </text>
      )}
    </g>
  );
}

function AgentNode({ agent, x, y }: { agent: AgentState; x: number; y: number }) {
  const colors = STATUS_COLORS[agent.status];
  const isOrchestrator = agent.id === "orchestrator";
  const w = isOrchestrator ? 220 : 160;
  const h = 44;

  return (
    <g>
      {/* Glow effect */}
      {agent.status === "running" && (
        <rect
          x={x - w / 2 - 3}
          y={y - h / 2 - 3}
          width={w + 6}
          height={h + 6}
          rx={14}
          fill="none"
          stroke={colors.glow}
          strokeWidth={1}
          opacity={0.3}
          className="animate-pulse-glow"
        />
      )}
      {/* Node background */}
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={12}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={1.5}
      />
      {/* Status indicator */}
      <circle
        cx={x - w / 2 + 14}
        cy={y}
        r={4}
        fill={colors.text}
        className={agent.status === "running" ? "animate-pulse-glow" : ""}
      />
      {/* Agent label */}
      <text
        x={x - w / 2 + 24}
        y={y + 4}
        fill={colors.text}
        fontSize={12}
        fontWeight={600}
        fontFamily="var(--font-geist-mono), monospace"
      >
        {agent.label}
      </text>
    </g>
  );
}

function EdgeLine({ from, to, status }: { from: { x: number; y: number }; to: { x: number; y: number }; status: string }) {
  const isActive = status === "running";
  const isDone = status === "completed";

  return (
    <line
      x1={from.x}
      y1={from.y + 22}
      x2={to.x}
      y2={to.y - 22}
      stroke={isDone ? "#3b82f6" : isActive ? "#22c55e" : "#27272a"}
      strokeWidth={isActive || isDone ? 2 : 1}
      className={isActive ? "animate-flow-line" : ""}
      opacity={isActive || isDone ? 0.8 : 0.3}
    />
  );
}

function ToolEdge({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  return (
    <line
      x1={from.x}
      y1={from.y + 22}
      x2={to.x}
      y2={to.y - 14}
      stroke="#27272a"
      strokeWidth={1}
      strokeDasharray="3 3"
      opacity={0.5}
    />
  );
}

export default function AgentGraph({ agents, highlightedEvidence }: Props) {
  const agentEntries = Object.entries(agents).filter(([id]) => id !== "orchestrator");

  // Collect unique tools per agent (deduplicate by evidence_id, keep latest)
  const getUniqueTools = (agent: AgentState): ToolTrace[] => {
    const seen = new Map<string, ToolTrace>();
    for (const t of agent.tools || []) {
      const key = t.evidence_id || t.name + t.status;
      seen.set(key, t);
    }
    return Array.from(seen.values()).slice(-3); // max 3 tools shown
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Agent Topology</span>
        <div className="flex-1 h-px bg-zinc-800" />
        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-zinc-600" /> Idle</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Running</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> Done</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded border border-zinc-600" /> Tool</span>
        </div>
      </div>
      <svg viewBox="0 0 800 460" className="w-full h-auto">
        {/* Edges from orchestrator to children */}
        {agentEntries.map(([id, agent]) => (
          <EdgeLine
            key={`edge-${id}`}
            from={NODE_POSITIONS.orchestrator}
            to={NODE_POSITIONS[id]}
            status={agent.status}
          />
        ))}

        {/* Agent Nodes */}
        {Object.entries(agents).map(([id, agent]) => {
          const pos = NODE_POSITIONS[id];
          if (!pos) return null;
          return <AgentNode key={id} agent={agent} x={pos.x} y={pos.y} />;
        })}

        {/* Tool nodes under each agent */}
        {agentEntries.map(([id, agent]) => {
          const pos = NODE_POSITIONS[id];
          if (!pos) return null;
          const tools = getUniqueTools(agent);

          return tools.map((tool, i) => {
            const toolY = pos.y + 60 + i * 38;
            const toolPos = { x: pos.x, y: toolY };
            const isHighlighted = tool.evidence_id
              ? highlightedEvidence.includes(tool.evidence_id)
              : false;

            return (
              <g key={`tool-${id}-${i}`}>
                <ToolEdge
                  from={i === 0 ? pos : { x: pos.x, y: pos.y + 60 + (i - 1) * 38 }}
                  to={toolPos}
                />
                <ToolNode tool={tool} x={toolPos.x} y={toolPos.y} highlighted={isHighlighted} />
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
}
