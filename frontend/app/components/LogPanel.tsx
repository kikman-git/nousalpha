"use client";

import { AgentEvent } from "../page";

type Props = {
  logs: AgentEvent[];
};

const AGENT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  orchestrator: { text: "text-amber-400",  bg: "bg-amber-950/20",  border: "border-amber-500/30" },
  ir:           { text: "text-cyan-400",   bg: "bg-cyan-950/20",   border: "border-cyan-500/30"  },
  company:      { text: "text-yellow-400", bg: "bg-yellow-950/20", border: "border-yellow-500/30"},
  news:         { text: "text-emerald-400",bg: "bg-emerald-950/20",border: "border-emerald-500/30"},
  satellite:    { text: "text-pink-400",   bg: "bg-pink-950/20",   border: "border-pink-500/30"  },
  bull:         { text: "text-green-400",  bg: "bg-green-950/25",  border: "border-green-500/40" },
  bear:         { text: "text-red-400",    bg: "bg-red-950/25",    border: "border-red-500/40"   },
  judge:        { text: "text-orange-400", bg: "bg-orange-950/20", border: "border-orange-500/40"},
};

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  init:       { label: "INITIALIZATION",     color: "#f59e0b" },
  dispatch:   { label: "AGENT DISPATCH",     color: "#f59e0b" },
  search:     { label: "DATA COLLECTION",    color: "#06b6d4" },
  analyze:    { label: "ANALYSIS",           color: "#22c55e" },
  insight:    { label: "INSIGHTS",           color: "#22c55e" },
  done:       { label: "AGENTS COMPLETE",    color: "#3b82f6" },
  synthesize: { label: "SYNTHESIS",          color: "#8b5cf6" },
  debate:     { label: "ADVERSARIAL DEBATE", color: "#f97316" },
  verdict:    { label: "VERDICT",            color: "#10b981" },
};

export default function LogPanel({ logs }: Props) {
  // Newest events first — keeps the view fixed so the flow graph stays visible
  const agentEvents = logs.filter((l) => l.type === "agent_event").slice().reverse();

  // Track which phases we've already shown a divider for
  let lastPhase = "";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 flex flex-col" style={{ minHeight: 600 }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 shrink-0">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Agent Trace</span>
        <div className="flex-1" />
        <span className="text-[10px] text-zinc-600">{agentEvents.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {agentEvents.length === 0 && (
          <div className="text-zinc-600 text-xs py-10 text-center">
            Waiting for agent events…
          </div>
        )}

        {agentEvents.map((log, i) => {
          const agent = log.agent || "";
          const colors = AGENT_COLORS[agent] || { text: "text-zinc-400", bg: "bg-zinc-900/20", border: "border-zinc-700/30" };
          const phase = log.phase || "";
          const isArgument = !!log.argument;
          const isJudge = agent === "judge";
          const isBull = agent === "bull";
          const isBear = agent === "bear";

          // Phase divider
          const showDivider = phase && phase !== lastPhase && PHASE_LABELS[phase];
          if (showDivider) lastPhase = phase;
          const phaseInfo = PHASE_LABELS[phase];

          return (
            <div key={i}>
              {/* Phase divider */}
              {showDivider && phaseInfo && (
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px" style={{ backgroundColor: phaseInfo.color + "30" }} />
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                    style={{ color: phaseInfo.color, backgroundColor: phaseInfo.color + "12" }}
                  >
                    {phaseInfo.label}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: phaseInfo.color + "30" }} />
                </div>
              )}

              {/* ── Debate argument block ── */}
              {isArgument && (isBull || isBear) ? (
                <div className={`rounded-xl border px-3 py-2.5 ${colors.bg} ${colors.border}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-black ${colors.text}`}>
                        {isBull ? "🐂" : "🐻"} {agent.toUpperCase()}
                      </span>
                      <span className="text-[9px] text-zinc-600">Round {log.argument?.round}</span>
                    </div>
                    {log.argument?.strength != null && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${log.argument.strength * 100}%`,
                              backgroundColor: isBull ? "#22c55e" : "#ef4444",
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-zinc-500">
                          {Math.round((log.argument.strength || 0) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed font-medium">
                    {log.argument?.text || log.message}
                  </p>
                  {log.elapsed != null && (
                    <div className="text-[9px] text-zinc-600 mt-1.5">{log.elapsed.toFixed(1)}s</div>
                  )}
                </div>

              ) : isArgument && isJudge ? (
                /* ── Judge ruling block ── */
                <div className={`rounded-xl border px-3 py-2.5 ${colors.bg} ${colors.border}`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`text-xs font-black ${colors.text}`}>⚖️ JUDGE</span>
                    {log.argument?.ruling && log.argument.ruling !== "continue" && (
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded uppercase"
                        style={{
                          backgroundColor: log.argument.ruling === "verdict" ? "#10b98120" : "#f9731620",
                          color: log.argument.ruling === "verdict" ? "#10b981" : "#f97316",
                        }}
                      >
                        {log.argument.ruling}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed italic">
                    {log.argument?.text || log.message}
                  </p>
                </div>

              ) : (
                /* ── Standard event row ── */
                <div className="flex gap-2.5">
                  {/* Timestamp */}
                  <span className="text-[10px] text-zinc-600 font-mono shrink-0 w-10 text-right pt-0.5">
                    {log.elapsed?.toFixed(1)}s
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Agent label + message */}
                    <div className="flex items-start gap-1.5 flex-wrap">
                      <span className={`text-[11px] font-bold shrink-0 ${colors.text}`}>
                        [{agent}]
                      </span>
                      <span className="text-sm text-zinc-200 leading-snug flex-1">
                        {log.message}
                      </span>
                    </div>

                    {/* Tool trace */}
                    {log.tool && (
                      <div className="mt-1.5 ml-1 pl-2.5 border-l border-zinc-800">
                        <div className="flex items-center gap-1.5">
                          <span className={log.tool.status === "completed" ? "text-blue-400 text-[10px]" : "text-yellow-500 text-[10px]"}>
                            {log.tool.status === "completed" ? "✓" : "▶"}
                          </span>
                          <span className="text-[10px] text-zinc-500">tool:</span>
                          <span className="text-[10px] text-amber-300 font-mono">{log.tool.name}</span>
                          {log.tool.evidence_id && (
                            <span className="text-[9px] text-zinc-600 font-mono">[{log.tool.evidence_id}]</span>
                          )}
                        </div>
                        {log.tool.output && (
                          <div className="text-[10px] text-zinc-600 mt-0.5 truncate font-mono">
                            {JSON.stringify(log.tool.output).slice(0, 72)}…
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
