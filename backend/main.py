from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import asyncio
import json
import time
import uuid
from datetime import datetime

app = FastAPI(title="JapanAlpha Mission Control API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory log store
analysis_logs: dict[str, list[dict]] = {}


def get_mock_events(company: str) -> list[dict]:
    """Generate mock SSE events for Akatsuki (3932.T) style analysis with 4 data-source agents."""
    return [
        # ── Phase 1: Orchestrator kicks off ──
        {"agent": "orchestrator", "status": "running", "message": f"Starting multi-source analysis of \"{company}\"", "phase": "init", "delay": 0.3},
        {"agent": "orchestrator", "status": "running", "message": "Dispatching 4 data-source agents in parallel...", "phase": "dispatch", "delay": 0.5},

        # ── Phase 2: Agents begin data collection ──

        # Agent 1 — IR / Public Filings (EDINET, TDnet)
        {"agent": "ir", "status": "running", "message": "Querying EDINET and TDnet for disclosure filings...",
         "phase": "search", "delay": 0.3,
         "tool": {"name": "edinet_api", "input": {"company": company, "ticker": "3932.T", "doc_types": ["annual_securities_report", "quarterly_report"], "period": "FY2026-Q2"}, "status": "calling"}},

        # Agent 2 — Audio / Transcripts (YouTube earnings call)
        {"agent": "audio", "status": "running", "message": "Fetching earnings call video from YouTube IR page...",
         "phase": "search", "delay": 0.2,
         "tool": {"name": "youtube_fetch", "input": {"url": "https://www.youtube.com/watch?v=eaeBSWsd8mU", "type": "Q2 FY2026 Earnings Presentation", "source": "aktsk.jp/ir/"}, "status": "calling"}},

        # Agent 3 — Macro / Policy
        {"agent": "macro", "status": "running", "message": "Scanning BOJ, FSA, Digital Agency, METI policy announcements...",
         "phase": "search", "delay": 0.4,
         "tool": {"name": "policy_scanner", "input": {"sources": ["BOJ", "FSA", "Digital Agency", "METI", "JFTC"], "sectors": ["Entertainment", "Mobile Gaming", "AI/DX"], "lookback_days": 90}, "status": "calling"}},

        # Agent 4 — Geospatial / Satellite
        {"agent": "satellite", "status": "running", "message": "Tasking satellite for imagery of headquarters and event venues...",
         "phase": "search", "delay": 0.3,
         "tool": {"name": "satellite_tasking", "input": {"target": "Akatsuki HQ Meguro, Tokyo", "coordinates": "35.6340N, 139.7082E", "resolution": "0.5m", "bands": ["RGB", "NIR"]}, "status": "calling"}},

        # ── Phase 3: Raw data retrieved ──

        {"agent": "ir", "status": "running", "message": "Retrieved 5 EDINET filings + 4 TDnet disclosures for Akatsuki Inc.",
         "phase": "analyze", "delay": 0.9,
         "tool": {"name": "edinet_api", "status": "completed",
                  "output": {"edinet_docs": 5, "tdnet_docs": 4, "quarterly_q2": "E33829-S100XXXX", "segment_change": "3 new segments announced", "dividend_notice": "DOE 4%, JPY 55/share interim"},
                  "evidence_id": "ev-ir-1"}},

        {"agent": "audio", "status": "running", "message": "Video downloaded (28:14). Running Whisper transcription...",
         "phase": "analyze", "delay": 1.0,
         "tool": {"name": "youtube_fetch", "status": "completed",
                  "output": {"video_id": "eaeBSWsd8mU", "duration": "28:14", "language": "Japanese", "speaker": "VP Ishikura", "format": "Q2 FY2026 Earnings"},
                  "evidence_id": "ev-aud-1"}},

        {"agent": "macro", "status": "running", "message": "87 policy documents retrieved. Filtering for sector relevance...",
         "phase": "analyze", "delay": 0.7,
         "tool": {"name": "policy_scanner", "status": "completed",
                  "output": {"total_scanned": 87, "sector_relevant": 14, "digital_agency_ai": "AI utilization promotion policy", "meti_content": "Content industry export JPY 500B target", "jftc_mobile": "Mobile platform fair competition guidelines"},
                  "evidence_id": "ev-mac-1"}},

        {"agent": "satellite", "status": "running", "message": "Imagery acquired. Running footfall and activity analysis...",
         "phase": "analyze", "delay": 0.9,
         "tool": {"name": "satellite_tasking", "status": "completed",
                  "output": {"image_date": "2026-03-05", "facility": "Akatsuki HQ Meguro", "cloud_cover": "5%", "ground_resolution": "0.5m"},
                  "evidence_id": "ev-sat-1"}},

        # ── Phase 4: Deep analysis with LLM + specialized tools ──

        {"agent": "ir", "status": "running", "message": "Q2 Results: Revenue JPY 7.6B / Operating Profit JPY 3.4B / Net Income JPY 3.0B",
         "phase": "insight", "delay": 0.8,
         "tool": {"name": "filing_parser", "input": {"doc_id": "E33829-S100XXXX", "extract": ["revenue", "operating_income", "net_income", "segment_breakdown"]},
                  "status": "completed",
                  "output": {"revenue": "JPY 7.6B", "operating_income": "JPY 3.4B", "net_income": "JPY 3.0B", "game_comic_revenue": "JPY 5.2B", "entame_lifestyle": "JPY 1.8B", "investment_exits": "JPY 1.8B (H1 cumulative)"},
                  "evidence_id": "ev-ir-2"}},

        {"agent": "ir", "status": "running", "message": "New segment structure: Game/Comic, Entertainment/Lifestyle, AI-DX Solutions",
         "phase": "insight", "delay": 0.6,
         "tool": {"name": "llm_extract", "input": {"task": "segment_restructure_analysis", "source": "Q2 FY2026 Quarterly Report"},
                  "status": "completed",
                  "output": {"new_segments": ["Game/Comic", "Entertainment/Lifestyle", "AI-DX Solutions"], "m_and_a": "2 acquisitions (Papabubble, 1 other)", "vision_change": "Mission/Vision updated for next growth stage", "ipo_exits": "19 cumulative exits, 4 IPOs in 2 years"},
                  "evidence_id": "ev-ir-3"}},

        {"agent": "audio", "status": "running", "message": "Transcription complete (42,850 tokens). Analyzing management tone...",
         "phase": "insight", "delay": 1.2,
         "tool": {"name": "whisper_transcribe", "input": {"video_id": "eaeBSWsd8mU", "language": "ja", "diarization": True},
                  "status": "completed",
                  "output": {"duration_min": 28, "speakers_identified": 1, "speaker": "VP Ishikura", "transcript_tokens": 42850, "key_topics": ["segment change", "M&A strategy", "Kaiju No.8 game launch"]},
                  "evidence_id": "ev-aud-2"}},

        {"agent": "audio", "status": "running", "message": "Management tone: Confident. Key: 'Revenue and profit growth expected for FY2026'",
         "phase": "insight", "delay": 0.8,
         "tool": {"name": "llm_sentiment", "input": {"task": "management_tone_analysis", "transcript_id": "eaeBSWsd8mU", "focus": ["forward_guidance", "m_and_a_conviction", "risk_awareness"]},
                  "status": "completed",
                  "output": {"overall_tone": "Confident", "confidence_score": 0.81, "guidance": "Revenue and profit growth YoY expected", "kaiju8_launch": "JPY 2B+ revenue in first month, 40% overseas", "m_and_a_stance": "Active — pursuing real+digital IP synergies", "shareholder_return": "DOE raised to 4%, stronger returns planned"},
                  "evidence_id": "ev-aud-3"}},

        {"agent": "macro", "status": "running", "message": "METI content export target JPY 500B — direct tailwind for IP businesses",
         "phase": "insight", "delay": 0.7,
         "tool": {"name": "llm_policy_impact", "input": {"task": "sector_impact_analysis", "policies": ["METI content export", "Digital Agency AI promotion", "JFTC mobile platform rules"], "target_sector": "Entertainment/Gaming"},
                  "status": "completed",
                  "output": {"meti_content_impact": "Positive (JPY 500B export target benefits IP holders)", "digital_agency_ai": "Positive (AI-DX segment directly aligned)", "jftc_mobile": "Positive (fairer mobile platform fees)", "net_policy_score": "+0.65"},
                  "evidence_id": "ev-mac-2"}},

        {"agent": "macro", "status": "running", "message": "BOJ rate hold at 0.5% — Low cost of capital supports M&A strategy",
         "phase": "insight", "delay": 0.5,
         "tool": {"name": "macro_cross_ref", "input": {"policy": "BOJ rate decision March 2026", "company_impact": "M&A financing and VC exit environment"},
                  "status": "completed",
                  "output": {"boj_rate": "0.5% (hold)", "m_and_a_impact": "Favorable — low borrowing costs support acquisition strategy", "vc_exit_env": "Active — IPO market healthy, 4 portfolio IPOs in 2 years", "yen_impact": "Neutral for domestic entertainment"},
                  "evidence_id": "ev-mac-3"}},

        {"agent": "satellite", "status": "running", "message": "Office occupancy analysis: High activity detected at HQ and subsidiary offices",
         "phase": "insight", "delay": 1.0,
         "tool": {"name": "cv_analyzer", "input": {"task": "office_activity_estimation", "image_id": "sat-2026-03-05-akatsuki", "models": ["building_occupancy", "parking_density", "foot_traffic"]},
                  "status": "completed",
                  "output": {"hq_occupancy": "High", "parking_utilization": "82%", "nearby_foot_traffic": "+18% vs 6 months ago", "expansion_indicator": "New signage detected on adjacent building"},
                  "evidence_id": "ev-sat-2"}},

        {"agent": "satellite", "status": "running", "message": "Event venue analysis: Kaiju No.8 pop-up store traffic — high consumer engagement",
         "phase": "insight", "delay": 0.7,
         "tool": {"name": "poi_analysis", "input": {"target": "Kaiju No.8 promotional events Tokyo", "coordinates": "35.6595N, 139.7005E"},
                  "status": "completed",
                  "output": {"event_detected": True, "venue_foot_traffic": "High (est. 3,200 visitors/day)", "social_media_mentions": "+340% vs baseline", "nearby_retail_spillover": "+12% foot traffic"},
                  "evidence_id": "ev-sat-3"}},

        # ── Phase 5: Agents complete ──
        {"agent": "ir", "status": "completed", "message": "Filing analysis complete: Solid Q2 with new growth segments and active M&A pipeline",
         "phase": "done", "delay": 0.4},
        {"agent": "audio", "status": "completed", "message": "Transcript analysis complete: Management confident, growth guidance maintained",
         "phase": "done", "delay": 0.3},
        {"agent": "macro", "status": "completed", "message": "Policy analysis complete: Favorable environment for content IP and AI-DX",
         "phase": "done", "delay": 0.3},
        {"agent": "satellite", "status": "completed", "message": "Geospatial analysis complete: Strong physical signals — office expansion and event traffic",
         "phase": "done", "delay": 0.4},

        # ── Phase 6: Orchestrator synthesizes ──
        {"agent": "orchestrator", "status": "running", "message": "Aggregating results from all agents...", "phase": "synthesize", "delay": 1.0},
        {"agent": "orchestrator", "status": "running", "message": "Cross-referencing evidence across 4 data sources...", "phase": "synthesize", "delay": 1.5},

        # ── Phase 7: Final BUY signal with evidence chain ──
        {"agent": "orchestrator", "status": "completed", "message": "Analysis complete", "phase": "judgment", "delay": 0.5,
         "judgment": {
             "signal": "BUY",
             "confidence": 79,
             "thesis": [
                 {"claim": "Kaiju No.8 The Game achieved JPY 2B+ revenue in first month with 40% overseas ratio — validates IP monetization capability",
                  "evidence_ids": ["ev-aud-3", "ev-ir-2"]},
                 {"claim": "Strategic pivot to 3-segment model (Game/Comic, Entertainment/Lifestyle, AI-DX) creates diversified growth engine beyond mobile gaming",
                  "evidence_ids": ["ev-ir-3", "ev-aud-2"]},
                 {"claim": "Active M&A strategy (Papabubble acquisition) combining real-world retail with digital IP — management conviction confirmed in earnings call tone analysis (0.81 confidence)",
                  "evidence_ids": ["ev-aud-3", "ev-ir-3"]},
                 {"claim": "19 cumulative VC exits including 4 IPOs in 2 years — investment/incubation portfolio generating consistent liquidity events (JPY 1.8B in H1)",
                  "evidence_ids": ["ev-ir-2", "ev-mac-3"]},
                 {"claim": "METI content export policy (JPY 500B target) directly benefits Akatsuki's IP-driven business model",
                  "evidence_ids": ["ev-mac-2", "ev-mac-1"]},
                 {"claim": "Satellite imagery confirms office expansion (new adjacent building signage) and Kaiju No.8 pop-up driving 3,200 visitors/day — physical signals corroborate digital momentum",
                  "evidence_ids": ["ev-sat-2", "ev-sat-3"]},
             ],
             "risks": [
                 {"claim": "Mobile gaming market remains challenging — existing titles showed YoY revenue decline in Q1; recovery in Q2 was partial",
                  "evidence_ids": ["ev-ir-2", "ev-aud-3"]},
                 {"claim": "M&A integration risk — 2 new acquisitions entering consolidation in H2; contribution to group earnings remains unproven",
                  "evidence_ids": ["ev-ir-3", "ev-aud-3"]},
             ],
             "summary": f"{company} presents a compelling transformation story supported by convergent evidence across 4 independent data sources. EDINET filings show solid Q2 fundamentals (JPY 7.6B revenue, JPY 3.0B net income) with a strategic pivot to a 3-segment model. Whisper-transcribed earnings call from YouTube reveals management confidence with explicit growth guidance and aggressive M&A posture. Macro policy tailwinds from METI's content export initiative and favorable BOJ rate environment support the strategy. Most distinctively, satellite imagery independently confirms physical expansion signals — new building signage at HQ and high foot traffic at Kaiju No.8 promotional events (est. 3,200 visitors/day) — providing alternative data that corroborates the company's growth narrative. We issue a BUY signal with 79% confidence for long-term holding.",
         }},
    ]


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/api/analyze/{company}")
async def analyze_company(company: str):
    """SSE endpoint that streams agent analysis events in real-time."""
    run_id = str(uuid.uuid4())[:8]
    analysis_logs[run_id] = []

    async def event_stream():
        events = get_mock_events(company)
        start_time = time.time()

        # Send initial metadata
        meta = {"type": "meta", "run_id": run_id, "company": company, "timestamp": datetime.now().isoformat()}
        yield f"data: {json.dumps(meta, ensure_ascii=False)}\n\n"

        for event in events:
            delay = event.pop("delay", 0.5)
            await asyncio.sleep(delay)

            log_entry = {
                "type": "agent_event",
                "run_id": run_id,
                "timestamp": datetime.now().isoformat(),
                "elapsed": round(time.time() - start_time, 2),
                **event,
            }
            analysis_logs[run_id].append(log_entry)
            yield f"data: {json.dumps(log_entry, ensure_ascii=False)}\n\n"

        # Send done signal
        done = {"type": "done", "run_id": run_id, "elapsed": round(time.time() - start_time, 2)}
        yield f"data: {json.dumps(done, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/logs/{run_id}")
async def get_logs(run_id: str):
    """Retrieve stored logs for a specific analysis run."""
    if run_id not in analysis_logs:
        return {"error": "Run not found"}
    return {"run_id": run_id, "logs": analysis_logs[run_id]}


@app.get("/api/logs")
async def list_logs():
    """List all analysis runs."""
    return {"runs": [{"run_id": k, "event_count": len(v)} for k, v in analysis_logs.items()]}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
