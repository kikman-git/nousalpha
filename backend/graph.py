import operator
from typing import Annotated, TypedDict
import os
import sys
import json
from datetime import datetime

# Allow importing the MCP tools directly for the backend MVP
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "mcp")))
try:
    from server import (
        get_stock_overview,
        analyze_valuation,
        analyze_financial_health,
        get_crustdata_company_enrich,
        crustdata_people_search,
        crustdata_competitive_intelligence,
        log_decision_trace
    )
except ImportError:
    # MVP Mock fallbacks if mcp dependencies aren't loaded in the backend env yet
    def get_stock_overview(t): return {"name": t, "sector": "Tech"}
    def analyze_valuation(t): return {"pe_ratio": 25.4, "fair_value": "Overvalued"}
    def analyze_financial_health(t): return {"debt_to_equity": 0.5, "cash_flow": "Strong"}
    def get_crustdata_company_enrich(d): return {"error": "Mocked Crustdata Enrichment"}
    def crustdata_people_search(d, t): return {"error": "Mocked People Search"}
    def crustdata_competitive_intelligence(d): return {"error": "Mocked Competitive Config"}
    def log_decision_trace(*args): pass

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, START, END
from dotenv import load_dotenv

load_dotenv()

# Check if we have an API key, otherwise use a local mock LLM wrapper
shisa_api_key = os.getenv("SHISA_API_KEY")
api_key_exists = bool(shisa_api_key and shisa_api_key != "your_shisa_api_key_here")

class MockLLM:
    def invoke(self, messages):
        class Resp:
            content = "This is a mock LLM response because SHISA_API_KEY is not set in backend/.env. Please add it to see real AI analysis."
        return Resp()

if api_key_exists:
    llm = ChatOpenAI(
        model="shisa-ai/shisa-v2.1-llama3.3-70b", 
        temperature=0.7,
        base_url="https://api.shisa.ai/openai/v1",
        api_key=shisa_api_key
    )
else:
    llm = MockLLM()

class AgentState(TypedDict):
    company: str
    ticker: str
    raw_data: dict
    bull_thesis: str
    bear_thesis: str
    final_judgment: dict
    messages: Annotated[list[dict], operator.add] # We'll store SSE-ready dictionaries here

def data_fetcher_node(state: AgentState) -> dict:
    """Fetches fundamental data from the MCP Server tools."""
    ticker = state.get("ticker", "AAPL")
    
    msg = {"agent": "financial", "status": "running", "message": f"Fetching fundamental data for {ticker} via MCP server...", "phase": "search"}
    
    # Tool calls
    overview = get_stock_overview(ticker)
    valuation = analyze_valuation(ticker)
    health = analyze_financial_health(ticker)
    
    # Crustdata B2B Tool calls
    company = state.get("company", ticker)
    domain_guess = f"{ticker.lower().split('.')[0]}.com" if "." in ticker else f"{ticker.lower()}.com"
    crustdata_enrich = get_crustdata_company_enrich(domain_guess)
    crustdata_people = crustdata_people_search(domain_guess, ["CEO", "CTO", "VP Engineering"])
    crustdata_competitors = crustdata_competitive_intelligence(domain_guess)
    
    raw_data = {
        "overview": overview,
        "valuation": valuation,
        "health": health,
        "crustdata_firmographics": crustdata_enrich,
        "crustdata_leadership": crustdata_people,
        "crustdata_b2b_competitors": crustdata_competitors
    }
    
    done_msg = {"agent": "financial", "status": "completed", "message": f"Data retrieved. Sector: {overview.get('sector', 'Unknown')}. Crustdata B2B intelligence loaded.", "phase": "analyze"}
    
    return {"raw_data": raw_data, "messages": [msg, done_msg]}

def bull_agent_node(state: AgentState) -> dict:
    ticker = state["ticker"]
    raw_data = state["raw_data"]
    
    msg = {"agent": "news", "status": "running", "message": "Constructing bullish thesis...", "phase": "insight"}
    
    prompt = f"""You are a Bullish Financial Analyst. Review the following data for {ticker} and write a highly optimistic 2-paragraph investment thesis. Focus on strengths and undervaluation.
    DATA: {json.dumps(raw_data)[:2000]}"""
    
    response = llm.invoke([SystemMessage(content="You are a bullish financial analyst."), HumanMessage(content=prompt)])
    
    # Log the decision trace to SQLite via MCP
    log_decision_trace("Bull Agent", ticker, "Generated bullish thesis based on fundamental metrics.", 0.85, str(raw_data)[:200])
    
    done_msg = {"agent": "news", "status": "completed", "message": "Bull thesis complete. Logged to Decision Trace.", "phase": "done"}
    return {"bull_thesis": response.content, "messages": [msg, done_msg]}

def bear_agent_node(state: AgentState) -> dict:
    ticker = state["ticker"]
    raw_data = state["raw_data"]
    
    msg = {"agent": "satellite", "status": "running", "message": "Constructing bearish thesis...", "phase": "insight"}
    
    prompt = f"""You are a Bearish Financial Analyst (Short Seller). Review the following data for {ticker} and write a highly critical 2-paragraph investment thesis. Focus on weaknesses and risks.
    DATA: {json.dumps(raw_data)[:2000]}"""
    
    response = llm.invoke([SystemMessage(content="You are a bearish financial analyst."), HumanMessage(content=prompt)])
    
    # Log the decision trace
    log_decision_trace("Bear Agent", ticker, "Generated bearish thesis pointing out fundamental risks.", 0.85, str(raw_data)[:200])
    
    done_msg = {"agent": "satellite", "status": "completed", "message": "Bear thesis complete. Logged to Decision Trace.", "phase": "done"}
    return {"bear_thesis": response.content, "messages": [msg, done_msg]}

def orchestrator_node(state: AgentState) -> dict:
    ticker = state["ticker"]
    bull = state["bull_thesis"]
    bear = state["bear_thesis"]
    
    msg = {"agent": "orchestrator", "status": "running", "message": "Synthesizing Bull vs Bear arguments...", "phase": "synthesize"}
    
    prompt = f"""You are the Lead Portfolio Manager. Make a final judgment on {ticker} based on these conflicting reports:
    
    BULL THESIS: {bull}
    
    BEAR THESIS: {bear}
    
    Return ONLY valid JSON with these keys:
    - "signal": "BUY", "SELL", or "HOLD"
    - "confidence": integer 0-100
    - "summary": 3-sentence final verdict
    """
    try:
        response = llm.invoke([SystemMessage(content="You output ONLY JSON."), HumanMessage(content=prompt)])
        clean_json = response.content.replace("```json", "").replace("```", "").strip()
        judgment = json.loads(clean_json)
    except Exception as e:
        judgment = {"signal": "HOLD", "confidence": 50, "summary": "Failed to parse judgment.", "error": str(e)}
        
    thesis_list = [
        {"claim": "Bull Argument Summary", "evidence_ids": []},
        {"claim": "Bear Argument Summary", "evidence_ids": []}
    ]
    judgment["thesis"] = thesis_list
    judgment["risks"] = []
        
    done_msg = {
        "agent": "orchestrator", 
        "status": "completed", 
        "message": f"Analysis complete. Signal: {judgment.get('signal')}", 
        "phase": "judgment",
        "judgment": judgment
    }
    
    return {"final_judgment": judgment, "messages": [msg, done_msg]}

# Build the Graph
workflow = StateGraph(AgentState)

workflow.add_node("data_fetcher", data_fetcher_node)
workflow.add_node("bull_agent", bull_agent_node)
workflow.add_node("bear_agent", bear_agent_node)
workflow.add_node("orchestrator", orchestrator_node)

workflow.add_edge(START, "data_fetcher")
workflow.add_edge("data_fetcher", "bull_agent")
workflow.add_edge("data_fetcher", "bear_agent")
workflow.add_edge("bull_agent", "orchestrator")
workflow.add_edge("bear_agent", "orchestrator")
workflow.add_edge("orchestrator", END)

app = workflow.compile()
