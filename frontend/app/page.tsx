"use client";

import { useState, useRef, useCallback } from "react";
import AgentGraph from "./components/AgentGraph";
import LogPanel from "./components/LogPanel";
import JudgmentPanel from "./components/JudgmentPanel";

export type ToolTrace = {
  name: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: string;
  evidence_id?: string;
};

export type AgentEvent = {
  type: string;
  run_id?: string;
  company?: string;
  agent?: string;
  status?: string;
  message?: string;
  phase?: string;
  elapsed?: number;
  timestamp?: string;
  tool?: ToolTrace;
  judgment?: {
    signal: string;
    confidence: number;
    thesis: { claim: string; evidence_ids: string[] }[];
    risks: { claim: string; evidence_ids: string[] }[];
    summary: string;
  };
};

export type AgentState = {
  id: string;
  label: string;
  status: "idle" | "running" | "completed";
  messages: string[];
  tools: ToolTrace[];
  currentTool?: ToolTrace;
};

const AGENT_CONFIG: Record<string, string> = {
  orchestrator: "Orchestrator",
  ir: "IR / Filings",
  audio: "Audio / Transcripts",
  macro: "Macro / Policy",
  satellite: "Geospatial",
};

export default function Home() {
  const [company, setCompany] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [agents, setAgents] = useState<Record<string, AgentState>>({});
  const [logs, setLogs] = useState<AgentEvent[]>([]);
  const [judgment, setJudgment] = useState<AgentEvent["judgment"] | null>(null);
  const [highlightedEvidence, setHighlightedEvidence] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const initAgents = useCallback(() => {
    const initial: Record<string, AgentState> = {};
    for (const [id, label] of Object.entries(AGENT_CONFIG)) {
      initial[id] = { id, label, status: "idle", messages: [], tools: [] };
    }
    return initial;
  }, []);

  const startAnalysis = useCallback(async () => {
    if (!company.trim() || isRunning) return;

    setIsRunning(true);
    setJudgment(null);
    setLogs([]);
    setHighlightedEvidence([]);
    const agentStates = initAgents();
    setAgents(agentStates);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(
        `http://localhost:8000/api/analyze/${encodeURIComponent(company.trim())}`,
        { signal: abortRef.current.signal }
      );
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const dataLine = line.replace(/^data: /, "").trim();
          if (!dataLine) continue;

          try {
            const event: AgentEvent = JSON.parse(dataLine);
            setLogs((prev) => [...prev, event]);

            if (event.type === "agent_event" && event.agent) {
              setAgents((prev) => {
                const prevAgent = prev[event.agent!];
                const newTools = event.tool
                  ? [...(prevAgent?.tools || []), event.tool]
                  : prevAgent?.tools || [];
                return {
                  ...prev,
                  [event.agent!]: {
                    ...prevAgent,
                    status: event.status as AgentState["status"],
                    messages: [...(prevAgent?.messages || []), event.message || ""],
                    tools: newTools,
                    currentTool: event.tool || prevAgent?.currentTool,
                  },
                };
              });

              if (event.judgment) {
                setJudgment(event.judgment);
              }
            }
          } catch {}
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        console.error("SSE error:", e);
      }
    } finally {
      setIsRunning(false);
    }
  }, [company, isRunning, initAgents]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-200">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-black">
              JA
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              JapanAlpha<span className="text-zinc-500 font-normal ml-2 text-sm">Mission Control</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            System Online
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="border-b border-zinc-800 px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-3">
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startAnalysis()}
              placeholder="Enter company name (e.g. Toyota Motor)"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              disabled={isRunning}
            />
            <button
              onClick={startAnalysis}
              disabled={isRunning || !company.trim()}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isRunning ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        {Object.keys(agents).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
            <div className="text-6xl mb-6 opacity-30">&#x1F50D;</div>
            <p className="text-lg">Enter a company name to start agent analysis</p>
            <p className="text-sm mt-2 text-zinc-600">AI agents will collect and analyze data in real-time</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Agent Graph + Judgment */}
            <div className="lg:col-span-2">
              <AgentGraph agents={agents} highlightedEvidence={highlightedEvidence} />
              {judgment && (
                <JudgmentPanel
                  judgment={judgment}
                  onEvidenceHover={setHighlightedEvidence}
                />
              )}
            </div>
            {/* Right: Log Panel */}
            <div className="lg:col-span-1">
              <LogPanel logs={logs} highlightedEvidence={highlightedEvidence} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
