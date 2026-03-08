"use client";

import { useEffect, useRef } from "react";
import { AgentEvent } from "../page";

type Props = {
  logs: AgentEvent[];
  highlightedEvidence: string[];
};

const AGENT_COLORS: Record<string, string> = {
  orchestrator: "text-amber-400",
  news: "text-emerald-400",
  ir: "text-cyan-400",
  financial: "text-violet-400",
  satellite: "text-pink-400",
};

export default function LogPanel({ logs, highlightedEvidence }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const agentEvents = logs.filter((l) => l.type === "agent_event");

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 flex flex-col h-[600px]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Agent Trace Log</span>
        <div className="flex-1" />
        <span className="text-[10px] text-zinc-600">{agentEvents.length} events</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {agentEvents.map((log, i) => {
          const evidenceId = log.tool?.evidence_id;
          const isHighlighted = evidenceId && highlightedEvidence.includes(evidenceId);

          return (
            <div key={i} className="animate-fade-in-up">
              {/* Main log line */}
              <div
                className={`flex gap-2 py-1.5 text-[11px] font-mono border-b border-zinc-800/50 transition-all duration-300 ${
                  isHighlighted ? "bg-emerald-500/10 border-emerald-500/30 rounded px-1 ring-1 ring-emerald-500/30" : ""
                }`}
                data-evidence-id={evidenceId}
              >
                <span className="text-zinc-600 shrink-0 w-12 text-right">
                  {log.elapsed?.toFixed(1)}s
                </span>
                <span className={`shrink-0 w-20 font-semibold ${AGENT_COLORS[log.agent || ""] || "text-zinc-400"}`}>
                  [{log.agent}]
                </span>
                <span className="text-zinc-300 flex-1">{log.message}</span>
              </div>

              {/* Tool trace detail */}
              {log.tool && (
                <div
                  className={`ml-[136px] py-1 text-[10px] font-mono transition-all duration-300 ${
                    isHighlighted ? "bg-emerald-500/5 rounded px-1" : ""
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`${log.tool.status === "completed" ? "text-blue-400" : "text-yellow-500"}`}>
                      {log.tool.status === "completed" ? "\u2713" : "\u25B6"}
                    </span>
                    <span className="text-zinc-500">tool:</span>
                    <span className="text-amber-300">{log.tool.name}</span>
                    {evidenceId && (
                      <span className={`text-zinc-600 transition-colors ${isHighlighted ? "text-emerald-400 font-semibold" : ""}`}>
                        [{evidenceId}]
                      </span>
                    )}
                  </div>
                  {log.tool.input && (
                    <div className="text-zinc-600 mt-0.5 truncate">
                      in: {JSON.stringify(log.tool.input)}
                    </div>
                  )}
                  {log.tool.output && (
                    <div className="text-zinc-500 mt-0.5 truncate">
                      out: {JSON.stringify(log.tool.output)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {agentEvents.length === 0 && (
          <div className="text-zinc-600 text-xs py-8 text-center">
            Waiting for agent events...
          </div>
        )}
      </div>
    </div>
  );
}
