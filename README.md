# Origin — *νοῦς + α*

> **Intellect that Generates Alpha**
> AI Agent Orchestration for Institutional Equity Research · Starting with Japan · Scaling Globally
>
> 📄 **[View Our Pitch Deck (PDF)](./pitch_deck.pdf)** | 🎬 **[Watch Our Demo (YouTube)](https://youtu.be/pV6Tua9APh8)**

### **Watch Our Demo Video**

[![Origin Demo Video](https://img.youtube.com/vi/9c2j8wctNhs/0.jpg)](https://youtu.be/pV6Tua9APh8)

**[Watch on YouTube](https://youtu.be/pV6Tua9APh8)**

---

## The Problem

Fundamental equity research is broken for Japan-focused institutional investors.

| Pain Point | Detail |
|---|---|
| **Language Barrier** | 70%+ of Japanese corporate filings, earnings transcripts, and IR materials are only available in Japanese — inaccessible to most global fund managers |
| **Manual & Slow** | Analysts spend 15–20 hours per company on fundamental research; coverage is limited to 20–40 names per analyst, leaving thousands of opportunities unseen |
| **Fragmented Data** | Critical data is scattered across EDINET, TDNet, company IR sites, and local news — no single platform synthesizes it for actionable insights |

> 3,900+ listed companies in Japan · Only ~15% covered by English-language research · $6.2T market cap

---

## Our Solution

*Think of it as a team of 100 AI analysts working 24/7.*

Each specialized agent handles one piece of the research puzzle — reading Japanese filings, building financial models, running valuations, synthesizing news — then orchestrates them into institutional-grade research reports.

- **Japanese NLP** that understands financial context and nuance
- **Multi-agent orchestration**: each agent = one research task
- **Automated financial modeling**, valuation, and risk scoring
- Designed for Japan first, **architected for global scale**

---

## Competitive Moat: Origin vs. General LLM Research

While general tools like **ChatGPT Deep Research** provide broad synthesis, Origin (NousAlpha) is built specifically for the high-stakes environment of institutional fundamental research.

| Feature | ChatGPT Deep Research | **Origin (NousAlpha)** |
|---|---|---|
| **Data Access** | Public web-crawled data | **Proprietary & Alternative Data**: Real-time satellite imagery (geospatial AI), direct EDINET/TDNet pipelines, and private IR transcripts. |
| **Orchestration** | Single-model sequential search | **Specialized Swarm**: Fine-tuned orchestrator managing vertical experts (Macro, Quant, Disclosure, Geospatial) trained on institutional research styles. |
| **Analysis Depth** | Summary of found text | **Fundamental Stress-Testing**: Built-in adversarial "Bull vs. Bear" loops that perform YoY forensic accounting and "diff" analysis on risk factors. |
| **Verification** | Citations to URLs | **Decision Traces**: Multi-modal evidence chains linking every claim back to exact J-GAAP footnotes or audio timestamps. |

---

## Agent Pipeline

```
Data Ingestion → Japanese NLP → Financial Modeling → Valuation Engine → Report Generation
(EDINET, TDNet,   (Filings,        (3-statement         (DCF, comps,       (Institutional-grade
 IR sites, news)   transcripts,     models, scenario     sum-of-parts)       research output)
                   mgmt commentary) analysis)
```

**Platform capabilities:** Real-time monitoring · Multi-company screening · Custom agent workflows · API integration

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Backend | FastAPI, Python 3.12 |
| Agent Orchestration | LangGraph (sequential chaining & agent handoffs) |
| Adversarial Framework | AutoGen / AG2 (Bull vs. Bear debate loop) |
| Real-time Monitoring | Redis (100+ concurrent data streams) |
| LLM | Shisa.ai `shisa-v2.1-llama3.3-70b` (OpenAI-compatible API) |
| Storage | SQLite (decision traces), PostgreSQL (metadata), Vector DB (RAG) |

---

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full swarm topology diagram.

Key components:
1. **Swarm Topology** — Specialized vertical agents (IR, Company, News, Satellite) each own their research domain
2. **Central Senior Analyst** — Synthesizes sub-agent reports into an institutional-grade investment memo
3. **Adversarial Debate Loop** — Bull Agent forms thesis → Bear Agent stress-tests with forensic accounting analysis
4. **Decision Traces** — Every claim in the final report is clickable, linking back to the exact source (filing, transcript, audio)
5. **Omni-Channel Ingestion** — Normalizes J-GAAP, IFRS, and US-GAAP data; monitors real-time macro feeds

---

## Running Locally

### Backend

```bash
cd backend
pip install fastapi uvicorn python-dotenv
# Optional: add SHISA_API_KEY to backend/.env for real LLM calls
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### MCP Server (optional)

```bash
cd mcp
pip install -e .
python server.py
```

---

## Market Opportunity

| | Size | Description |
|---|---|---|
| **TAM** | $48B | Global financial data & analytics market (Bloomberg, Refinitiv, FactSet, S&P) |
| **SAM** | $8.5B | AI-powered equity research tools for institutional investors globally |
| **SOM** | $850M | Japan-focused AI equity research for hedge & mutual funds (Year 5 addressable) |

---

## Business Model

SaaS subscription with usage-based pricing:

| Tier | Price | Includes |
|---|---|---|
| **Explorer** | $5K/mo | 50 reports/mo, standard financial models, Japan large-cap |
| **Professional** | $15K/mo | 200 reports/mo, custom agent workflows, API access, full Japan coverage |
| **Enterprise** | Custom | Unlimited reports, dedicated infrastructure, on-prem option, global markets |

> Target: $1M ARR within 18 months · 90%+ gross margins · Net Revenue Retention > 130%

---

## Competitive Advantage

Origin is the **only platform** combining purpose-built Japanese financial NLP with multi-agent AI orchestration — delivering institutional-grade Japan equity research at **10x the speed** and **1/5th the cost** of traditional methods.

| | Bloomberg/Refinitiv | Traditional Research | AI Startups (US) | **Origin** |
|---|---|---|---|---|
| Japan depth | Partial | Deep but slow | Minimal | **Deep + fast** |
| Japanese NLP | Basic | Human-only | None | **Purpose-built** |
| AI agents | No | No | Single model | **Multi-agent** |
| Speed to insight | Hours | Days–weeks | Minutes | **Minutes** |
| Coverage | Wide | 20–40 names | Wide | **3,900+ companies** |
| Price | $25K+/yr | $50K+/analyst | $10–30K/yr | **$5–15K/mo** |

---

## Roadmap

| Timeline | Milestone |
|---|---|
| Q2 2026 | Launch MVP — Japan large-cap coverage (top 100) |
| Q3 2026 | First 10 paying pilot customers |
| Q4 2026 | Expand to full Japan coverage (3,900+ companies) |
| Q1 2027 | API launch, custom agent workflows |
| H2 2027 | Expand to Korea & ASEAN markets |

**Current traction:**
- Core AI agent architecture designed and prototyped
- Japanese financial NLP model in development
- Advisory conversations with 5+ Japan-focused funds
- Participating in YC W26 batch

---

## The Ask

**Raising $1.5M Pre-Seed**

| Allocation | % | Purpose |
|---|---|---|
| Engineering & AI | 50% | Core agent platform, Japanese NLP models |
| Team | 25% | Key hires: ML engineer, quant researcher |
| GTM & Sales | 15% | Pilot program, conferences, fund outreach |
| Infrastructure | 10% | Cloud, data feeds, compliance |

---

## Contact

phat@habitto.com
