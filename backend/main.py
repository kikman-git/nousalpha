from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import asyncio
import json
import time
import uuid
from datetime import datetime

app = FastAPI(title="Origin Mission Control API")

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
        # ── Phase 1: Orchestrator receives URL, identifies company ──
        {"agent": "orchestrator", "status": "running", "message": f"Received: {company} — Resolving corporate identity...", "phase": "init", "delay": 0.3,
         "tool": {"name": "google_search", "input": {"query": f"{company} IR investor relations"}, "status": "calling"}},

        {"agent": "orchestrator", "status": "running", "message": "Identified: Akatsuki Inc. (3932.T) — aktsk.jp/ir/", "phase": "init", "delay": 0.7,
         "tool": {"name": "google_search", "status": "completed",
                  "output": {"company": "Akatsuki Inc.", "ticker": "3932.T", "ir_url": "https://aktsk.jp/ir/", "sector": "Entertainment/Gaming", "hq": "Meguro, Tokyo"},
                  "evidence_id": "ev-orch-1"}},

        {"agent": "orchestrator", "status": "running", "message": "Dispatching company URL to 4 agents in parallel...", "phase": "dispatch", "delay": 0.4},

        # ── Phase 2: Each agent receives the URL and searches independently ──

        # Agent 1 — IR / Filings: crawls IR page → finds EDINET/TDnet links
        {"agent": "ir", "status": "running", "message": "Crawling https://aktsk.jp/ir/ for filing links...",
         "phase": "search", "delay": 0.3,
         "tool": {"name": "web_crawl", "input": {"url": "https://aktsk.jp/ir/", "extract": ["pdf_links", "edinet_links", "tdnet_links"]}, "status": "calling"}},

        # Agent 2 — Audio: crawls IR page → finds YouTube earnings call link
        {"agent": "company", "status": "running", "message": "Crawling https://aktsk.jp/ir/ for video/audio links...",
         "phase": "search", "delay": 0.2,
         "tool": {"name": "web_crawl", "input": {"url": "https://aktsk.jp/ir/", "extract": ["youtube_links", "audio_links", "webinar_links"]}, "status": "calling"}},

        # Agent 3 — Macro: Google searches for sector-relevant policy
        {"agent": "news", "status": "running", "message": "Searching government policy for Entertainment/Gaming sector...",
         "phase": "search", "delay": 0.4,
         "tool": {"name": "google_search", "input": {"queries": ["BOJ monetary policy 2026", "METI content industry policy", "Digital Agency AI promotion", "JFTC mobile platform regulation"], "sector": "Entertainment/Gaming"}, "status": "calling"}},

        # Agent 4 — Geospatial: resolves HQ address → tasks satellite
        {"agent": "satellite", "status": "running", "message": "Resolving HQ address from https://aktsk.jp and tasking satellite...",
         "phase": "search", "delay": 0.3,
         "tool": {"name": "geocode_and_task", "input": {"company_url": "https://aktsk.jp", "resolve": "headquarters coordinates", "resolution": "0.5m"}, "status": "calling"}},

        # ── Phase 3: Crawl results + data retrieval ──

        {"agent": "ir", "status": "running", "message": "Found 15 IR documents on aktsk.jp/ir/. Fetching EDINET filings...",
         "phase": "analyze", "delay": 0.7,
         "tool": {"name": "web_crawl", "status": "completed",
                  "output": {"pdfs_found": 15, "quarterly_reports": 4, "supplementary_data": 4, "qa_summary": 1, "latest": "Q3 FY2026 (2026/02/09)"},
                  "evidence_id": "ev-ir-0"}},

        {"agent": "ir", "status": "running", "message": "Downloaded 5 EDINET filings + 4 TDnet disclosures",
         "phase": "analyze", "delay": 0.6,
         "tool": {"name": "edinet_api", "input": {"edinet_code": "E33829", "period": "FY2026"},
                  "status": "completed",
                  "output": {"edinet_docs": 5, "tdnet_docs": 4, "quarterly_q2": "E33829-S100XXXX", "segment_change": "3 new segments announced", "dividend_notice": "DOE 4%, JPY 55/share interim"},
                  "evidence_id": "ev-ir-1"}},

        {"agent": "company", "status": "running", "message": "Found YouTube link: Q2 FY2026 Earnings Presentation. Downloading...",
         "phase": "analyze", "delay": 0.5,
         "tool": {"name": "web_crawl", "status": "completed",
                  "output": {"youtube_url": "https://www.youtube.com/watch?v=eaeBSWsd8mU", "label": "Q2 FY2026 Earnings Presentation (video)", "qa_pdf": "Q2 FY2026 QA Summary (PDF)"},
                  "evidence_id": "ev-co-0"}},

        {"agent": "company", "status": "running", "message": "Video downloaded (28:14). Running Whisper transcription...",
         "phase": "analyze", "delay": 0.8,
         "tool": {"name": "youtube_dl", "status": "completed",
                  "output": {"video_id": "eaeBSWsd8mU", "duration": "28:14", "language": "Japanese", "speaker": "VP Ishikura", "format": "Q2 FY2026 Earnings"},
                  "evidence_id": "ev-co-1"}},

        {"agent": "news", "status": "running", "message": "87 policy pages retrieved. Filtering for Entertainment/Gaming relevance...",
         "phase": "analyze", "delay": 0.7,
         "tool": {"name": "google_search", "status": "completed",
                  "output": {"total_results": 87, "sector_relevant": 14, "top_sources": ["BOJ", "METI", "Digital Agency", "JFTC"], "key_policies": 4},
                  "evidence_id": "ev-nw-1"}},

        {"agent": "satellite", "status": "running", "message": "HQ resolved: 35.6340N, 139.7082E (Meguro). Imagery acquired.",
         "phase": "analyze", "delay": 0.9,
         "tool": {"name": "geocode_and_task", "status": "completed",
                  "output": {"coordinates": "35.6340N, 139.7082E", "facility": "Akatsuki HQ Meguro", "image_date": "2026-03-05", "cloud_cover": "5%", "ground_resolution": "0.5m"},
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

        {"agent": "company", "status": "running", "message": "Transcription complete (42,850 tokens). Analyzing management tone...",
         "phase": "insight", "delay": 1.2,
         "tool": {"name": "whisper_transcribe", "input": {"video_id": "eaeBSWsd8mU", "language": "ja", "diarization": True},
                  "status": "completed",
                  "output": {"duration_min": 28, "speakers_identified": 1, "speaker": "VP Ishikura", "transcript_tokens": 42850, "key_topics": ["segment change", "M&A strategy", "Kaiju No.8 game launch"]},
                  "evidence_id": "ev-co-2"}},

        {"agent": "company", "status": "running", "message": "Management tone: Confident. Key: 'Revenue and profit growth expected for FY2026'",
         "phase": "insight", "delay": 0.8,
         "tool": {"name": "llm_sentiment", "input": {"task": "management_tone_analysis", "transcript_id": "eaeBSWsd8mU", "focus": ["forward_guidance", "m_and_a_conviction", "risk_awareness"]},
                  "status": "completed",
                  "output": {"overall_tone": "Confident", "confidence_score": 0.81, "guidance": "Revenue and profit growth YoY expected", "kaiju8_launch": "JPY 2B+ revenue in first month, 40% overseas", "m_and_a_stance": "Active — pursuing real+digital IP synergies", "shareholder_return": "DOE raised to 4%, stronger returns planned"},
                  "evidence_id": "ev-co-3"}},

        {"agent": "news", "status": "running", "message": "METI content export target JPY 500B — direct tailwind for IP businesses",
         "phase": "insight", "delay": 0.7,
         "tool": {"name": "llm_policy_impact", "input": {"task": "sector_impact_analysis", "policies": ["METI content export", "Digital Agency AI promotion", "JFTC mobile platform rules"], "target_sector": "Entertainment/Gaming"},
                  "status": "completed",
                  "output": {"meti_content_impact": "Positive (JPY 500B export target benefits IP holders)", "digital_agency_ai": "Positive (AI-DX segment directly aligned)", "jftc_mobile": "Positive (fairer mobile platform fees)", "net_policy_score": "+0.65"},
                  "evidence_id": "ev-nw-2"}},

        {"agent": "news", "status": "running", "message": "BOJ rate hold at 0.5% — Low cost of capital supports M&A strategy",
         "phase": "insight", "delay": 0.5,
         "tool": {"name": "macro_cross_ref", "input": {"policy": "BOJ rate decision March 2026", "company_impact": "M&A financing and VC exit environment"},
                  "status": "completed",
                  "output": {"boj_rate": "0.5% (hold)", "m_and_a_impact": "Favorable — low borrowing costs support acquisition strategy", "vc_exit_env": "Active — IPO market healthy, 4 portfolio IPOs in 2 years", "yen_impact": "Neutral for domestic entertainment"},
                  "evidence_id": "ev-nw-3"}},

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
        {"agent": "company", "status": "completed", "message": "Transcript analysis complete: Management confident, growth guidance maintained",
         "phase": "done", "delay": 0.3},
        {"agent": "news", "status": "completed", "message": "Policy analysis complete: Favorable environment for content IP and AI-DX",
         "phase": "done", "delay": 0.3},
        {"agent": "satellite", "status": "completed", "message": "Geospatial analysis complete: Strong physical signals — office expansion and event traffic",
         "phase": "done", "delay": 0.4},

        # ── Phase 6: Orchestrator synthesizes and hands off to debate ──
        {"agent": "orchestrator", "status": "running", "message": "Aggregating results from all agents...", "phase": "synthesize", "delay": 1.0},
        {"agent": "orchestrator", "status": "running", "message": "Cross-referencing evidence across 4 data sources...", "phase": "synthesize", "delay": 1.0},
        {"agent": "orchestrator", "status": "completed", "message": "Evidence package compiled. Initiating adversarial debate...", "phase": "synthesize", "delay": 0.5},

        # ══════════════════════════════════════════════════════════
        # ── Phase 7: ADVERSARIAL DEBATE — Bull vs Bear + Judge ──
        # ══════════════════════════════════════════════════════════

        {"agent": "judge", "status": "running", "message": "Debate session opened. Bull and Bear agents, present your cases.", "phase": "debate", "debate_round": 0, "delay": 0.8,
         "argument": {"position": "judge", "round": 0, "text": "I will evaluate the investment case for Akatsuki Inc. (3932.T). Bull, you may begin.", "ruling": "continue"}},

        # ── Round 1 ──
        {"agent": "bull", "status": "running", "message": "Kaiju No.8 proves the IP monetization engine works — JPY 2B+ in month one, 40% overseas", "phase": "debate", "debate_round": 1, "delay": 1.0,
         "argument": {"position": "bull", "round": 1, "text": "Kaiju No.8: JPY 2B+ in month one, 40% overseas. This IP engine is PROVEN.", "evidence_ids": ["ev-co-3", "ev-ir-2"], "strength": 0.85}},

        {"agent": "bear", "status": "running", "message": "One hit game does not make a sustainable business", "phase": "debate", "debate_round": 1, "delay": 1.0,
         "argument": {"position": "bear", "round": 1, "text": "One hit title? Classic single-game dependency. Legacy titles declining YoY. Papabubble acquisition = distraction.", "evidence_ids": ["ev-ir-2", "ev-ir-3"], "strength": 0.72}},

        {"agent": "judge", "status": "running", "message": "Both points noted.", "phase": "debate", "debate_round": 1, "delay": 0.6,
         "argument": {"position": "judge", "round": 1, "text": "Bull's IP thesis is data-backed. Bear raises valid concentration risk.", "ruling": "continue"}},

        # ── Round 2 ──
        {"agent": "bull", "status": "running", "message": "The 3-segment pivot IS the answer to concentration risk — plus satellite confirms physical expansion", "phase": "debate", "debate_round": 2, "delay": 1.0,
         "argument": {"position": "bull", "round": 2, "text": "3 new segments = diversified. Satellite confirms HQ expansion + 3,200/day at pop-ups. You can't fake satellite data.", "evidence_ids": ["ev-ir-3", "ev-sat-2", "ev-sat-3"], "strength": 0.88}},

        {"agent": "bear", "status": "running", "message": "Three simultaneous strategic shifts = execution risk", "phase": "debate", "debate_round": 2, "delay": 1.0,
         "argument": {"position": "bear", "round": 2, "text": "AI-DX unproven. Papabubble = candy?! 2 M&A integrations in H2. Management spreading too thin.", "evidence_ids": ["ev-ir-3", "ev-co-3"], "strength": 0.68}},

        {"agent": "judge", "status": "running", "message": "Satellite evidence is compelling.", "phase": "debate", "debate_round": 2, "delay": 0.6,
         "argument": {"position": "judge", "round": 2, "text": "Satellite data can't be manipulated. But execution risk is real. Final round.", "ruling": "continue"}},

        # ── Round 3 (Final) ──
        {"agent": "bull", "status": "running", "message": "19 VC exits, DOE raised to 4%, METI tailwind, convergent evidence across ALL 4 data sources", "phase": "debate", "debate_round": 3, "delay": 1.0,
         "argument": {"position": "bull", "round": 3, "text": "4 data sources converge. 19 VC exits, 4 IPOs. DOE 4%. METI JPY 500B tailwind. Conviction: 0.81.", "evidence_ids": ["ev-ir-2", "ev-nw-2", "ev-co-3", "ev-nw-3"], "strength": 0.90}},

        {"agent": "bear", "status": "running", "message": "Valuation already prices in growth", "phase": "debate", "debate_round": 3, "delay": 1.0,
         "argument": {"position": "bear", "round": 3, "text": "Market already priced in. If Kaiju No.8 decays at typical mobile rates, narrative collapses. HOLD at best.", "evidence_ids": ["ev-co-3", "ev-nw-3", "ev-ir-2"], "strength": 0.60}},

        {"agent": "judge", "status": "running", "message": "Deliberating...", "phase": "debate", "debate_round": 3, "delay": 1.5,
         "argument": {"position": "judge", "round": 3, "text": "Reviewing all evidence...", "ruling": "deliberating"}},

        # ── Phase 8: Judge's Verdict ──
        {"agent": "judge", "status": "completed", "message": "VERDICT: BUY — Bull's multi-source convergent evidence outweighs Bear's execution risk concerns", "phase": "verdict", "debate_round": 3, "delay": 1.0,
         "argument": {"position": "judge", "round": 3, "ruling": "verdict"},
         "judgment": {
             "signal": "BUY",
             "confidence": 74,
             "thesis": [
                 {"claim": "Kaiju No.8 validates IP monetization at scale (JPY 2B+, 40% overseas) — Bull's core thesis is well-evidenced",
                  "evidence_ids": ["ev-co-3", "ev-ir-2"]},
                 {"claim": "3-segment restructuring provides strategic diversification, though execution remains to be proven",
                  "evidence_ids": ["ev-ir-3", "ev-co-2"]},
                 {"claim": "Satellite data independently confirms physical expansion signals — this alternative data cannot be manipulated through traditional channels",
                  "evidence_ids": ["ev-sat-2", "ev-sat-3"]},
                 {"claim": "19 VC exits (4 IPOs in 2 years) demonstrate strong capital allocation track record",
                  "evidence_ids": ["ev-ir-2", "ev-nw-3"]},
                 {"claim": "METI content export policy (JPY 500B) provides macro tailwind for IP-driven business model",
                  "evidence_ids": ["ev-nw-2", "ev-nw-1"]},
             ],
             "risks": [
                 {"claim": "Bear correctly identifies single-title concentration risk — monitor Kaiju No.8 revenue retention closely",
                  "evidence_ids": ["ev-ir-2", "ev-co-3"]},
                 {"claim": "M&A integration of 2 acquisitions in H2 represents execution risk — Bear's point on management bandwidth is valid",
                  "evidence_ids": ["ev-ir-3", "ev-co-3"]},
                 {"claim": "BOJ rate environment uncertainty — Bear's macro concern noted for monitoring",
                  "evidence_ids": ["ev-nw-3"]},
             ],
             "summary": f"After adversarial debate, I rule in favor of BULL with a BUY signal at 74% confidence. The confidence is tempered from the initial 79% due to Bear's valid points on execution risk and single-title dependency. However, the convergent evidence across 4 independent data sources — EDINET filings, Whisper-transcribed earnings calls, government policy analysis, and satellite imagery — provides a level of conviction that single-source analysis cannot achieve. The satellite data independently confirming physical expansion is particularly compelling as it represents alternative data that cannot be manipulated. Bear's concerns about M&A integration and Kaiju No.8 revenue sustainability are incorporated as key monitoring items.",
             "debate_summary": {
                 "rounds": 3,
                 "bull_score": "Strong (convergent multi-source evidence, satellite confirmation)",
                 "bear_score": "Moderate (valid execution risk, but weakened by lack of counter-evidence to satellite data)",
                 "verdict_basis": "Multi-source evidence convergence outweighs execution risk concerns",
             },
             "alpha": {
                 "expected_return": 82,
                 "probability": 68,
                 "drivers": [
                     {"factor": "Kaiju No.8 global IP monetization (JPY 2B+ month 1, 40% overseas)", "impact": 35, "evidence_ids": ["ev-co-3", "ev-ir-2"]},
                     {"factor": "3-segment diversification: Game/Comic + Ent/Lifestyle + AI-DX", "impact": 20, "evidence_ids": ["ev-ir-3"]},
                     {"factor": "19 VC exits (4 IPOs) — proven capital allocation", "impact": 15, "evidence_ids": ["ev-ir-2", "ev-nw-3"]},
                     {"factor": "METI JPY 500B content export policy tailwind", "impact": 12, "evidence_ids": ["ev-nw-2", "ev-nw-1"]},
                 ],
             },
             "beta": {
                 "risk_score": 0.38,
                 "probability": 32,
                 "factors": [
                     {"factor": "Single-title concentration: Kaiju No.8 revenue decay risk", "severity": 0.75, "evidence_ids": ["ev-ir-2", "ev-co-3"]},
                     {"factor": "Dual M&A integration in H2 — management bandwidth", "severity": 0.60, "evidence_ids": ["ev-ir-3", "ev-co-3"]},
                     {"factor": "BOJ rate uncertainty — may impact M&A financing", "severity": 0.35, "evidence_ids": ["ev-nw-3"]},
                     {"factor": "Valuation already reflects growth expectations", "severity": 0.45, "evidence_ids": ["ev-co-3", "ev-ir-2"]},
                 ],
             },
         }},
    ]


@app.get("/health")
async def health_check():
    return {"status": "ok"}


# Try to import LangGraph — fall back to mock if unavailable
try:
    from graph import app as langgraph_app
    from langchain_core.messages import HumanMessage
    USE_LANGGRAPH = True
except ImportError:
    USE_LANGGRAPH = False


@app.get("/api/analyze/{company}")
async def analyze_company(company: str):
    """SSE endpoint that streams agent analysis events. Uses LangGraph if available, otherwise mock data."""
    run_id = str(uuid.uuid4())[:8]
    analysis_logs[run_id] = []

    async def mock_stream():
        start_time = time.time()
        meta = {"type": "meta", "run_id": run_id, "company": company, "timestamp": datetime.now().isoformat()}
        yield f"data: {json.dumps(meta, ensure_ascii=False)}\n\n"

        for event in get_mock_events(company):
            delay = event.pop("delay", 0.3)
            await asyncio.sleep(delay)
            elapsed = round(time.time() - start_time, 2)
            log_entry = {"type": "agent_event", "run_id": run_id, "timestamp": datetime.now().isoformat(), "elapsed": elapsed, **event}
            analysis_logs[run_id].append(log_entry)
            yield f"data: {json.dumps(log_entry, ensure_ascii=False)}\n\n"

        done = {"type": "done", "run_id": run_id, "elapsed": round(time.time() - start_time, 2)}
        yield f"data: {json.dumps(done, ensure_ascii=False)}\n\n"

    async def langgraph_stream():
        start_time = time.time()
        meta = {"type": "meta", "run_id": run_id, "company": company, "timestamp": datetime.now().isoformat()}
        yield f"data: {json.dumps(meta, ensure_ascii=False)}\n\n"

        init_msg = {"type": "agent_event", "run_id": run_id, "timestamp": datetime.now().isoformat(), "elapsed": 0.0, "agent": "orchestrator", "status": "running", "message": f"Starting live LangGraph analysis of {company}", "phase": "init"}
        analysis_logs[run_id].append(init_msg)
        yield f"data: {json.dumps(init_msg, ensure_ascii=False)}\n\n"

        try:
            async for output in langgraph_app.astream({"company": company, "ticker": company, "raw_data": {}, "messages": []}):
                for node_name, state_updates in output.items():
                    if "messages" in state_updates:
                        for msg in state_updates["messages"]:
                            elapsed = round(time.time() - start_time, 2)
                            log_entry = {"type": "agent_event", "run_id": run_id, "timestamp": datetime.now().isoformat(), "elapsed": elapsed, **msg}
                            analysis_logs[run_id].append(log_entry)
                            yield f"data: {json.dumps(log_entry, ensure_ascii=False)}\n\n"
                            await asyncio.sleep(0.1)
        except Exception as e:
            err_msg = {"type": "agent_event", "run_id": run_id, "timestamp": datetime.now().isoformat(), "elapsed": round(time.time() - start_time, 2), "agent": "orchestrator", "status": "error", "message": f"Graph Execution Error: {str(e)}", "phase": "judgment"}
            yield f"data: {json.dumps(err_msg, ensure_ascii=False)}\n\n"

        done = {"type": "done", "run_id": run_id, "elapsed": round(time.time() - start_time, 2)}
        yield f"data: {json.dumps(done, ensure_ascii=False)}\n\n"

    stream = langgraph_stream() if USE_LANGGRAPH else mock_stream()
    return StreamingResponse(stream, media_type="text/event-stream")


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
