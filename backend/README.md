# Origin Backend

The backend for the Origin Mission Control platform.

## Setup

1.  **Install Python 3.12+**
2.  **Create a Virtual Environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate
    ```
3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Set Environment Variables:**
    Create a `.env` file in the root of the backend directory.
    ```env
    OPENAI_API_KEY=your_key_here
    ANTHROPIC_API_KEY=your_key_here
    REDIS_URL=redis://localhost:6379
    ```
5.  **Run the Server:**
    ```bash
    uvicorn main:app --reload
    ```
    or
    ```bash
    python main.py
    ```

## Agents

The agent logic resides in `backend/agents`.
- **LangGraph** handles orchestration.
- **CrewAI** handles sequential task chaining.
- **AutoGen** handles adversarial debates.

## Ingestion

Data pipelines reside in `backend/ingestion`.
- **EDINET** parser.
- **SEC 10-K** parser.
- **Alternative Data Streams**.
