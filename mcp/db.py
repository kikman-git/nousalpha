"""
Origin MVP - Trace Database
Stores Agentic Decision Traces for the "Explainability by Design" UI.
"""

import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "japanalpha_traces.db")

def init_db():
    """Initialize the SQLite database for agent decision traces."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS decision_traces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            agent_role TEXT NOT NULL,
            ticker TEXT NOT NULL,
            claim TEXT NOT NULL,
            confidence REAL,
            evidence_snippet TEXT,
            source_link TEXT,
            metadata TEXT
        )
    ''')
    conn.commit()
    conn.close()

def log_trace(agent_role: str, ticker: str, claim: str, confidence: float, evidence_snippet: str = "", source_link: str = "", metadata: dict = None) -> int:
    """Log an agent reasoning step. Returns the trace ID."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO decision_traces (timestamp, agent_role, ticker, claim, confidence, evidence_snippet, source_link, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        datetime.utcnow().isoformat() + "Z",
        agent_role,
        ticker.upper(),
        claim,
        confidence,
        evidence_snippet,
        source_link,
        json.dumps(metadata) if metadata else "{}"
    ))
    trace_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return trace_id

def get_traces(ticker: str, limit: int = 50) -> list[dict]:
    """Retrieve decision traces for a ticker to build the Explainability UI."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM decision_traces 
        WHERE ticker = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
    ''', (ticker.upper(), limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for row in rows:
        d = dict(row)
        d["metadata"] = json.loads(d["metadata"]) if d["metadata"] else {}
        results.append(d)
    return results

# Initialize on import
init_db()
