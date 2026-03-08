"use client";

import { AgentEvent } from "../page";

type Props = {
  events: AgentEvent[];
  highlightedEvidence: string[];
  onEvidenceHover: (ids: string[]) => void;
};

function EvidenceBadge({
  id,
  isActive,
  onClick,
}: {
  id: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-all ${
        isActive
          ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
          : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
      }`}
    >
      {id}
    </span>
  );
}

function StrengthBar({ strength, color }: { strength: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-[9px] text-zinc-500 uppercase">Strength</span>
      <div className="h-1.5 w-20 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${strength * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] text-zinc-400">{Math.round(strength * 100)}%</span>
    </div>
  );
}

export default function DebatePanel({ events, highlightedEvidence, onEvidenceHover }: Props) {
  const toggleEvidence = (ids: string[]) => {
    const isSame = JSON.stringify(highlightedEvidence) === JSON.stringify(ids);
    onEvidenceHover(isSame ? [] : ids);
  };

  // Group events by round
  const rounds: Record<number, AgentEvent[]> = {};
  let judgeOpening: AgentEvent | null = null;
  let verdict: AgentEvent | null = null;

  for (const ev of events) {
    if (ev.argument?.ruling === "verdict") {
      verdict = ev;
      continue;
    }
    const round = ev.debate_round ?? ev.argument?.round ?? 0;
    if (round === 0) {
      judgeOpening = ev;
      continue;
    }
    if (!rounds[round]) rounds[round] = [];
    rounds[round].push(ev);
  }

  return (
    <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-950/10 overflow-hidden animate-fade-in-up">
      {/* Header — Courtroom style */}
      <div className="bg-gradient-to-r from-orange-950/40 via-zinc-900 to-orange-950/40 px-5 py-3 border-b border-orange-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-orange-400">ADVERSARIAL DEBATE</span>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-green-400 font-semibold">BULL</span>
            </span>
            <span className="text-zinc-600">vs</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-red-400 font-semibold">BEAR</span>
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Judge opening */}
        {judgeOpening?.argument && (
          <div className="flex justify-center mb-2">
            <div className="bg-orange-950/30 border border-orange-500/20 rounded-lg px-4 py-2 max-w-lg text-center">
              <span className="text-[10px] text-orange-400 font-bold uppercase">Judge</span>
              <p className="text-xs text-zinc-300 mt-1">{judgeOpening.argument.text}</p>
            </div>
          </div>
        )}

        {/* Debate Rounds */}
        {Object.entries(rounds)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([roundNum, roundEvents]) => {
            const bull = roundEvents.find((e) => e.argument?.position === "bull");
            const bear = roundEvents.find((e) => e.argument?.position === "bear");
            const judge = roundEvents.find((e) => e.argument?.position === "judge");

            return (
              <div key={roundNum} className="animate-fade-in-up">
                {/* Round label */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Round {roundNum}
                  </span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>

                {/* Bull vs Bear — side by side */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                  {/* Bull argument */}
                  {bull?.argument && (
                    <div className="rounded-lg border border-green-500/30 bg-green-950/20 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-500 font-bold text-xs">BULL</span>
                        <span className="text-[10px] text-green-400/60">BUY</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">{bull.argument.text}</p>
                      {bull.argument.strength != null && (
                        <StrengthBar strength={bull.argument.strength} color="#22c55e" />
                      )}
                      {bull.argument.evidence_ids && bull.argument.evidence_ids.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {bull.argument.evidence_ids.map((eid) => (
                            <EvidenceBadge
                              key={eid}
                              id={eid}
                              isActive={highlightedEvidence.includes(eid)}
                              onClick={() => toggleEvidence(bull.argument!.evidence_ids!)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bear argument */}
                  {bear?.argument && (
                    <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-red-500 font-bold text-xs">BEAR</span>
                        <span className="text-[10px] text-red-400/60">DON'T BUY</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">{bear.argument.text}</p>
                      {bear.argument.strength != null && (
                        <StrengthBar strength={bear.argument.strength} color="#ef4444" />
                      )}
                      {bear.argument.evidence_ids && bear.argument.evidence_ids.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {bear.argument.evidence_ids.map((eid) => (
                            <EvidenceBadge
                              key={eid}
                              id={eid}
                              isActive={highlightedEvidence.includes(eid)}
                              onClick={() => toggleEvidence(bear.argument!.evidence_ids!)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Judge comment — centered */}
                {judge?.argument && (
                  <div className="flex justify-center">
                    <div className="bg-orange-950/20 border border-orange-500/15 rounded-lg px-4 py-2 max-w-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-orange-400 font-bold text-[10px] uppercase">Judge</span>
                        {judge.argument.ruling === "continue" && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-300">CONTINUE</span>
                        )}
                        {judge.argument.ruling === "deliberating" && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-200 animate-pulse">DELIBERATING</span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{judge.argument.text}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        {/* Verdict */}
        {verdict?.argument && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-orange-500/30" />
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                Verdict
              </span>
              <div className="h-px flex-1 bg-orange-500/30" />
            </div>
            <div className="flex justify-center">
              <div className="bg-gradient-to-b from-orange-950/30 to-emerald-950/20 border border-emerald-500/30 rounded-xl px-5 py-4 max-w-2xl text-center">
                <div className="text-2xl font-bold text-emerald-400 mb-1">
                  {verdict.judgment?.signal}
                </div>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="h-2 w-24 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                      style={{ width: `${verdict.judgment?.confidence ?? 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400">{verdict.judgment?.confidence}% confidence</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Bull prevails with convergent multi-source evidence. Bear's execution risk concerns incorporated as monitoring items.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
