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
    """Generate mock SSE events: 4 agents (news, ir, company, satellite) + orchestrator."""
    return [
        # Phase 1: Orchestrator starts
        {"agent": "orchestrator", "status": "running", "message": f"Starting comprehensive analysis of \"{company}\"", "phase": "init", "delay": 0.3},
        {"agent": "orchestrator", "status": "running", "message": "Dispatching 4 child agents in parallel...", "phase": "dispatch", "delay": 0.5},

        # Phase 2: Child agents start — each with tool_call trace
        {"agent": "news", "status": "running", "message": "Scanning news sources...",
         "phase": "search", "delay": 0.3,
         "tool": {"name": "web_search", "input": {"query": f"{company} latest news earnings 2025"}, "status": "calling"}},

        {"agent": "ir", "status": "running", "message": "Searching IR materials & filings...",
         "phase": "search", "delay": 0.2,
         "tool": {"name": "ir_scraper", "input": {"company": company, "sources": ["EDINET", "TDnet", "company_ir_page"], "formats": ["PDF", "video", "HTML"]}, "status": "calling"}},

        {"agent": "financial", "status": "running", "message": "Fetching company fundamentals...",
         "phase": "search", "delay": 0.4,
         "tool": {"name": "market_data_api", "input": {"ticker": "7203.T", "fields": ["market_cap", "per", "pbr", "roe", "sector"]}, "status": "calling"}},

        {"agent": "satellite", "status": "running", "message": "Acquiring satellite imagery of key facilities...",
         "phase": "search", "delay": 0.3,
         "tool": {"name": "satellite_api", "input": {"target": f"{company} main factory", "coordinates": "35.0820N, 137.1564E", "resolution": "1m"}, "status": "calling"}},

        # Phase 3: Tool results come back
        {"agent": "news", "status": "running", "message": "47 articles found. Analyzing top results...",
         "phase": "analyze", "delay": 1.0,
         "tool": {"name": "web_search", "status": "completed",
                  "output": {"total_results": 47, "top_sources": ["Nikkei Asia", "Reuters", "Bloomberg"]},
                  "evidence_id": "ev-news-1"}},

        {"agent": "ir", "status": "running", "message": "Retrieved: Annual report (PDF), mid-term plan (PDF), earnings call (video)",
         "phase": "analyze", "delay": 0.8,
         "tool": {"name": "ir_scraper", "status": "completed",
                  "output": {"documents_found": 5, "annual_report": "E02144-S100XXXX (PDF)", "mid_term_plan": "2025-2030 (PDF)", "earnings_call": "Q4 FY2025 (video)", "presentation": "FY2025 Investor Day (PDF)", "transcript": "Q4 call transcript (HTML)"},
                  "evidence_id": "ev-ir-1"}},

        {"agent": "financial", "status": "running", "message": "Sector: Automotive / Market Cap: $280B / PER: 11.2x",
         "phase": "analyze", "delay": 0.6,
         "tool": {"name": "market_data_api", "status": "completed",
                  "output": {"market_cap_usd": "280B", "per": 11.2, "pbr": 1.1, "roe": 14.2, "sector": "Automotive"},
                  "evidence_id": "ev-fin-1"}},

        {"agent": "satellite", "status": "running", "message": "Image captured. Running vehicle density analysis...",
         "phase": "analyze", "delay": 0.9,
         "tool": {"name": "satellite_api", "status": "completed",
                  "output": {"image_date": "2026-03-06", "facility": "Toyota City Main Plant", "cloud_cover": "12%"},
                  "evidence_id": "ev-sat-1"}},

        # Phase 4: Deep analysis with LLM tool calls
        {"agent": "news", "status": "running", "message": "Sentiment: Positive 62% / Negative 18% / Neutral 20%",
         "phase": "insight", "delay": 1.2,
         "tool": {"name": "llm_analyze", "input": {"task": "sentiment_analysis", "corpus_size": 47},
                  "status": "completed",
                  "output": {"positive": 0.62, "negative": 0.18, "neutral": 0.20, "key_positive": ["record earnings", "EV expansion"], "key_negative": ["FX headwinds", "China slowdown"]},
                  "evidence_id": "ev-news-2"}},

        {"agent": "ir", "status": "running", "message": "Revenue: JPY 45.1T (+12.4% YoY) / Operating Margin: 11.8% (+2.1pt)",
         "phase": "insight", "delay": 0.8,
         "tool": {"name": "financial_parser", "input": {"doc_id": "E02144-S100XXXX", "extract": ["revenue", "operating_income", "net_income"]},
                  "status": "completed",
                  "output": {"revenue": "45.1T", "revenue_yoy": "+12.4%", "operating_margin": "11.8%", "margin_change": "+2.1pt", "net_income": "4.9T"},
                  "evidence_id": "ev-ir-2"}},

        {"agent": "ir", "status": "running", "message": "EV Investment: JPY 5T by 2030 / BEV target 3.5M units",
         "phase": "insight", "delay": 0.6,
         "tool": {"name": "llm_analyze", "input": {"task": "strategic_extraction", "document": "Mid-Term Management Plan"},
                  "status": "completed",
                  "output": {"ev_investment": "JPY 5T", "bev_target": "3.5M units by 2030", "r_and_d_ratio": "4.2% of revenue", "key_markets": ["North America", "China", "Europe"]},
                  "evidence_id": "ev-ir-3"}},

        {"agent": "financial", "status": "running", "message": "Peer Comparison: ROE 14.2% vs Industry Avg 9.8% — Top performer",
         "phase": "insight", "delay": 0.7,
         "tool": {"name": "peer_comparison", "input": {"ticker": "7203.T", "peers": ["7267.T", "7201.T", "7269.T"]},
                  "status": "completed",
                  "output": {"roe_rank": 1, "margin_rank": 1, "peers": {"Honda": {"roe": 9.1}, "Nissan": {"roe": 5.3}, "Suzuki": {"roe": 11.8}}},
                  "evidence_id": "ev-fin-2"}},

        {"agent": "satellite", "status": "running", "message": "Factory utilization estimated at 94% — vehicle lot density +8% vs last quarter",
         "phase": "insight", "delay": 1.0,
         "tool": {"name": "cv_analyzer", "input": {"task": "vehicle_density_estimation", "image_id": "sat-2026-03-06-toyota"},
                  "status": "completed",
                  "output": {"utilization_rate": "94%", "lot_density_change": "+8% QoQ", "production_lines_active": "12/12", "anomalies": "none"},
                  "evidence_id": "ev-sat-2"}},

        # Phase 5: Agents complete
        {"agent": "news", "status": "completed", "message": "News analysis complete: Overall positive media coverage",
         "phase": "done", "delay": 0.5},
        {"agent": "ir", "status": "completed", "message": "IR/Financial analysis complete: Revenue uptrend, strong EV strategy",
         "phase": "done", "delay": 0.3},
        {"agent": "financial", "status": "completed", "message": "Financial analysis complete: Strong competitive position",
         "phase": "done", "delay": 0.3},
        {"agent": "satellite", "status": "completed", "message": "Satellite analysis complete: High factory utilization confirmed",
         "phase": "done", "delay": 0.4},

        # Phase 6: Orchestrator synthesizes
        {"agent": "orchestrator", "status": "running", "message": "Aggregating results from all agents...", "phase": "synthesize", "delay": 1.0},
        {"agent": "orchestrator", "status": "running", "message": "Cross-referencing evidence and building investment thesis...", "phase": "synthesize", "delay": 1.5},

        # Phase 7: Final judgment — BUY signal with evidence links
        {"agent": "orchestrator", "status": "completed", "message": "Analysis complete", "phase": "judgment", "delay": 0.5,
         "judgment": {
             "signal": "BUY",
             "confidence": 82,
             "thesis": [
                 {"claim": "Strong revenue momentum with +12.4% YoY growth driven by robust global demand",
                  "evidence_ids": ["ev-ir-2", "ev-news-2"]},
                 {"claim": "Best-in-class profitability: Operating margin 11.8%, ROE 14.2% (industry avg 9.8%)",
                  "evidence_ids": ["ev-ir-2", "ev-fin-2"]},
                 {"claim": "Aggressive EV strategy: JPY 5T investment plan with 3.5M BEV target by 2030",
                  "evidence_ids": ["ev-ir-3", "ev-ir-1"]},
                 {"claim": "Satellite data confirms 94% factory utilization, +8% lot density QoQ — production at full capacity",
                  "evidence_ids": ["ev-sat-2", "ev-sat-1"]},
                 {"claim": "Positive market sentiment: 62% positive news coverage across major outlets",
                  "evidence_ids": ["ev-news-2", "ev-news-1"]},
             ],
             "risks": [
                 {"claim": "FX exposure remains significant — monitor USD/JPY movements closely",
                  "evidence_ids": ["ev-ir-2"]},
                 {"claim": "Intensifying EV competition from BYD and Tesla in key markets (China, Europe)",
                  "evidence_ids": ["ev-ir-3", "ev-fin-2"]},
             ],
             "summary": f"{company} demonstrates strong financial performance with sustained revenue growth and industry-leading profitability. Satellite imagery independently confirms high factory utilization at 94%, corroborating reported production figures. The company's aggressive EV transition strategy, backed by JPY 5T in planned investment, positions it well for long-term growth. We issue a BUY signal with 82% confidence for long-term holding.",
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
