"use client";

import { useState } from "react";

type ThesisItem = {
  claim: string;
  evidence_ids: string[];
};

type Judgment = {
  signal: string;
  confidence: number;
  thesis: ThesisItem[];
  risks: ThesisItem[];
  summary: string;
  debate_summary?: {
    rounds: number;
    bull_score: string;
    bear_score: string;
    verdict_basis: string;
  };
};

type Props = {
  judgment: Judgment;
  onEvidenceHover: (ids: string[]) => void;
};

export default function JudgmentPanel({ judgment, onEvidenceHover }: Props) {
  const [activeEvidence, setActiveEvidence] = useState<string[]>([]);

  const handleClaimClick = (evidenceIds: string[]) => {
    const isSame = JSON.stringify(activeEvidence) === JSON.stringify(evidenceIds);
    const next = isSame ? [] : evidenceIds;
    setActiveEvidence(next);
    onEvidenceHover(next);
  };

  return (
    <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-emerald-400">{judgment.signal}</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                style={{ width: `${judgment.confidence}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400">Confidence {judgment.confidence}%</span>
          </div>
        </div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Judge's Verdict</span>
      </div>

      {/* Debate Summary */}
      {judgment.debate_summary && (
        <div className="mb-4 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider mb-2">Debate Outcome</div>
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-green-400 font-semibold">Bull: </span>
              <span className="text-zinc-400">{judgment.debate_summary.bull_score}</span>
            </div>
            <div>
              <span className="text-red-400 font-semibold">Bear: </span>
              <span className="text-zinc-400">{judgment.debate_summary.bear_score}</span>
            </div>
          </div>
          <div className="text-[11px] text-zinc-500 mt-2">
            <span className="text-zinc-400">Basis: </span>{judgment.debate_summary.verdict_basis}
          </div>
        </div>
      )}

      {/* Summary */}
      <p className="text-sm text-zinc-300 leading-relaxed mb-5">{judgment.summary}</p>

      {/* Thesis — clickable claims with evidence links */}
      <div className="mb-4">
        <div className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-2">Investment Thesis</div>
        <div className="space-y-2">
          {judgment.thesis.map((item, i) => {
            const isActive = item.evidence_ids.every((id) => activeEvidence.includes(id)) && activeEvidence.length > 0;
            return (
              <div
                key={i}
                onClick={() => handleClaimClick(item.evidence_ids)}
                className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500/15 ring-1 ring-emerald-500/40"
                    : "hover:bg-zinc-800/50"
                }`}
              >
                <span className="text-emerald-500 mt-0.5 text-xs shrink-0">+</span>
                <div className="flex-1">
                  <p className="text-xs text-zinc-300">{item.claim}</p>
                  <div className="flex gap-1 mt-1">
                    {item.evidence_ids.map((eid) => (
                      <span
                        key={eid}
                        className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                          isActive
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {eid}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risks */}
      <div>
        <div className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-2">Key Risks</div>
        <div className="space-y-2">
          {judgment.risks.map((item, i) => {
            const isActive = item.evidence_ids.every((id) => activeEvidence.includes(id)) && activeEvidence.length > 0;
            return (
              <div
                key={i}
                onClick={() => handleClaimClick(item.evidence_ids)}
                className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "bg-red-500/10 ring-1 ring-red-500/30"
                    : "hover:bg-zinc-800/50"
                }`}
              >
                <span className="text-red-500 mt-0.5 text-xs shrink-0">!</span>
                <div className="flex-1">
                  <p className="text-xs text-zinc-300">{item.claim}</p>
                  <div className="flex gap-1 mt-1">
                    {item.evidence_ids.map((eid) => (
                      <span
                        key={eid}
                        className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                          isActive
                            ? "bg-red-500/20 text-red-400"
                            : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {eid}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
