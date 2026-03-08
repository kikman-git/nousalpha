# Fundamental Analysis MCP Server

An MCP (Model Context Protocol) server that gives your AI agent real-world fundamental stock analysis capabilities. Powered by **yfinance**, **Alpha Vantage**, and **Finnhub**.

## Tools

| Tool | Description | Key Required |
|------|-------------|:---:|
| `get_stock_overview` | Price, sector, market cap, 52w range, beta, summary | — |
| `get_income_statement` | Revenue, gross profit, EBITDA, EPS (annual/quarterly) | — |
| `get_balance_sheet` | Assets, liabilities, equity, debt, cash | — |
| `get_cash_flow` | Operating/investing/financing cash flows, FCF | — |
| `get_earnings` | EPS history & quarterly surprises | Alpha Vantage |
| `get_company_overview` | P/E, P/B, PEG, ROE, growth rates, analyst target | Alpha Vantage |
| `get_real_time_quote` | Live price, open, high, low, % change | Finnhub |
| `get_company_news` | Recent headlines with summaries | Finnhub |
| `get_basic_financials` | ROE, ROA, margins, D/E, current ratio | Finnhub |
| `analyze_valuation` | Graham Number, DCF, P/E fair value, upside % | — |
| `analyze_financial_health` | Altman Z-Score, Piotroski F-Score, liquidity & leverage | — |
| `get_full_fundamental_report` | One-shot combined report of all the above | Optional |

### Origin MVP Tools (Multi-Agent Swarm)
| Tool | Description | Key Required |
|------|-------------|:---:|
| `get_regulatory_filing_section` | Strips out "Risk Factors" from SEC 10-K / EDINET | — |
| `compare_yoy_text_diff` | Structural diff of regulatory texts to find new threats | — |
| `normalize_accounting_data` | Normalizes metrics (e.g. J-GAAP goodwill to US-GAAP) | — |
| `search_macro_transcripts` | Fed/BoJ press conference transcript snippets | — |
| `log_decision_trace` | Agent logs their reasoning & multi-modal evidence link | — |
| `get_decision_traces` | Fetch the full reasoning chain to build the React UI | — |

## Setup

### 1. Prerequisites

- Python 3.10+
- `pip` or `uv`

### 2. Install

```powershell
cd c:\Azamat\yctokyohackathon\nousalpha\mcp

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install the package
pip install -e .
```

### 3. Configure API Keys (optional but recommended)

Copy `.env.example` to `.env` and fill in your free API keys:

```powershell
copy .env.example .env
```

Get free keys here:
- **Alpha Vantage**: https://www.alphavantage.co/support/#api-key (500 req/day)
- **Finnhub**: https://finnhub.io/register (60 req/min)

The server works without keys, but `get_earnings`, `get_company_overview`, `get_real_time_quote`, `get_company_news`, and `get_basic_financials` will be unavailable.

### 4. Test the Server

```powershell
# Quick smoke test
python -c "from server import mcp; print('✓ Server loaded OK')"

# Interactive exploration with MCP Inspector
npx @modelcontextprotocol/inspector python server.py
```

## Claude Desktop Integration

Add this to your `claude_desktop_config.json` (usually at `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "fundamental-analysis": {
      "command": "C:\\Azamat\\yctokyohackathon\\nousalpha\\mcp\\.venv\\Scripts\\python.exe",
      "args": ["C:\\Azamat\\yctokyohackathon\\nousalpha\\mcp\\server.py"],
      "env": {
        "ALPHA_VANTAGE_API_KEY": "your_key_here",
        "FINNHUB_API_KEY": "your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop after saving. You should see "fundamental-analysis" in the tools list.

## Example Prompts

```
Give me a full fundamental analysis of Apple (AAPL)
Is Microsoft (MSFT) overvalued based on DCF?
What's the Altman Z-Score for Tesla (TSLA)?
Show me NVIDIA's income statement for the last 4 quarters
What's the Graham Number for Berkshire Hathaway (BRK-B)?
Find recent news about Amazon (AMZN) and assess sentiment
```

## Analysis Methods

### Graham Number
Intrinsic value estimate for value investors:
```
Graham Number = √(22.5 × EPS × Book Value per Share)
```
A stock trading below its Graham Number may be undervalued.

### Altman Z-Score
Bankruptcy risk predictor (public companies):
- **< 1.8** → Distress zone (high risk)
- **1.8–3.0** → Grey zone (caution)
- **> 3.0** → Safe zone

### Piotroski F-Score (0–9)
Fundamental quality score based on 9 financial signals:
- **7–9** → Strong fundamentals
- **4–6** → Mixed signals
- **0–3** → Weak fundamentals

### DCF (Discounted Cash Flow)
10-year FCF projection with terminal value, discounted at your required rate of return.
```
Intrinsic Value = Σ[FCF×(1+g)^t / (1+r)^t] + Terminal Value / (1+r)^10
```

## Explainability by Design (Decision Traces)
Origin requires a high degree of transparency. The MCP server includes an embedded SQLite database (`japanalpha_traces.db`) to log every deductive step made by your LangGraph/AutoGen swarm. 

When your `Bull Agent` debates your `Bear Agent`, they should call `log_decision_trace` with:
- `claim`: e.g., "Goodwill amortized under J-GAAP masks true operating cash flow."
- `evidence_snippet`: Exact sentence pulled from `get_regulatory_filing_section`.
- `source_link`: The URL to the native document.

The frontend can then query `get_decision_traces` to build the **Multi-Modal UI Linking** feature for portfolio managers.
