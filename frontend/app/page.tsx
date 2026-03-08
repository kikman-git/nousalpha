"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useCallback, useEffect } from "react";
import AgentGraph from "./components/AgentGraph";
import DebatePanel from "./components/DebatePanel";
import LogPanel from "./components/LogPanel";
import DataSourcesPanel from "./components/DataSourcesPanel";
import PredictionDashboard from "./components/PredictionDashboard";

const Verdict3D = dynamic(() => import("./components/Verdict3D"), { ssr: false });

export type ToolTrace = {
  name: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: string;
  evidence_id?: string;
};

export type DebateArgument = {
  position: "bull" | "bear" | "judge";
  round: number;
  text: string;
  evidence_ids?: string[];
  strength?: number;
  ruling?: "continue" | "deliberating" | "verdict";
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
  debate_round?: number;
  argument?: DebateArgument;
  judgment?: {
    signal: string;
    confidence: number;
    thesis: { claim: string; evidence_ids: string[] }[];
    risks: { claim: string; evidence_ids: string[] }[];
    summary: string;
    debate_summary?: {
      rounds: number;
      bull_score: string;
      bear_score: string;
      verdict_basis: string;
    };
    alpha?: {
      expected_return: number;
      probability: number;
      drivers: { factor: string; impact: number; evidence_ids: string[] }[];
    };
    beta?: {
      risk_score: number;
      probability: number;
      factors: { factor: string; severity: number; evidence_ids: string[] }[];
    };
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
  ir: "IR Agent",
  company: "Company Agent",
  news: "News Agent",
  satellite: "Satellite Agent",
  bull: "Bull Agent",
  bear: "Bear Agent",
  judge: "Judge",
};

export default function Home() {
  const [company, setCompany] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [agents, setAgents] = useState<Record<string, AgentState>>({});
  const [logs, setLogs] = useState<AgentEvent[]>([]);
  const [judgment, setJudgment] = useState<AgentEvent["judgment"] | null>(null);
  const [highlightedEvidence, setHighlightedEvidence] = useState<string[]>([]);
  const [debateEvents, setDebateEvents] = useState<AgentEvent[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  // Detect if user scrolled up — pause auto-scroll
  useEffect(() => {
    const onScroll = () => {
      const scrollBottom = window.innerHeight + window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      userScrolledUp.current = docHeight - scrollBottom > 300;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll to latest content
  useEffect(() => {
    if (!isRunning && !judgment) return;
    if (userScrolledUp.current) return;
    const timer = setTimeout(() => {
      scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
    return () => clearTimeout(timer);
  }, [logs.length, debateEvents.length, judgment, isRunning]);

  const initAgents = useCallback(() => {
    const initial: Record<string, AgentState> = {};
    for (const [id, label] of Object.entries(AGENT_CONFIG)) {
      initial[id] = { id, label, status: "idle", messages: [], tools: [] };
    }
    return initial;
  }, []);

  const allTools = Object.values(agents).flatMap((a) => a.tools);

  const startAnalysis = useCallback(async () => {
    if (!company.trim() || isRunning) return;

    setIsRunning(true);
    setJudgment(null);
    setLogs([]);
    setDebateEvents([]);
    setHighlightedEvidence([]);
    userScrolledUp.current = false;
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

              if (event.argument) {
                setDebateEvents((prev) => [...prev, event]);
              }
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
    <div className="min-h-screen bg-[#050510] text-zinc-200">
      {/* Header */}
      <header className="border-b border-zinc-800/50 px-6 py-4 bg-[#050510]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-sm font-black text-black shadow-lg shadow-emerald-500/20">
              JA
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              JapanAlpha<span className="text-zinc-600 font-normal ml-2 text-sm">AI Hedge Fund</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            System Online
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="border-b border-zinc-800/50 px-6 py-5">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex gap-3">
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startAnalysis()}
              placeholder="Enter company name (e.g. Toyota Motor)"
              className="flex-1 rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-5 py-3.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all backdrop-blur-sm"
              disabled={isRunning}
            />
            <button
              onClick={startAnalysis}
              disabled={isRunning || !company.trim()}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-3.5 text-sm font-bold text-white transition-all hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
              {isRunning ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        {Object.keys(agents).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
            <div className="text-7xl mb-6 opacity-20">&#x1F50D;</div>
            <p className="text-lg font-medium text-zinc-400">Enter a company name to start agent analysis</p>
            <p className="text-sm mt-2 text-zinc-600">8 AI agents will collect and debate in real-time</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Agent Flow + Debate + Verdict + Dashboard — 3 cols */}
            <div className="lg:col-span-3 space-y-4">
              <AgentGraph agents={agents} highlightedEvidence={highlightedEvidence} />

              {debateEvents.length > 0 && (
                <DebatePanel
                  events={debateEvents}
                  highlightedEvidence={highlightedEvidence}
                  onEvidenceHover={setHighlightedEvidence}
                />
              )}

              {judgment && (
                <>
                  <Verdict3D signal={judgment.signal} confidence={judgment.confidence} />
                  <PredictionDashboard
                    signal={judgment.signal}
                    confidence={judgment.confidence}
                    alpha={judgment.alpha}
                    beta={judgment.beta}
                  />
                </>
              )}
            </div>

            {/* Right sidebar: Sources + Log — 1 col */}
            <div className="lg:col-span-1 space-y-4">
              <DataSourcesPanel tools={allTools} />
              <LogPanel logs={logs} highlightedEvidence={highlightedEvidence} />
            </div>
          </div>
        )}
        <div ref={scrollAnchorRef} />
      </div>
    </div>
  );
}
