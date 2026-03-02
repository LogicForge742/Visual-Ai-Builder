# VectoShift — Visual AI Pipeline Builder

A full-stack visual pipeline builder that lets you create, wire, and execute AI-powered workflows by dragging nodes onto a canvas.

##  Quick Start

### Development Mode

**Backend:**
```bash
cd backend-20260227T074331Z-1-001/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend-20260227T074328Z-1-001/frontend
npm install
npm start
```

### Docker (One Command)
```bash
docker-compose up --build
```
Frontend: http://localhost:3000 | Backend: http://localhost:8000

---

## Architecture

```
Frontend (React + ReactFlow + Zustand)   →   Backend (FastAPI + litellm)
       :3000                                        :8000
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| UI Framework | React 18 | Component rendering |
| Canvas | ReactFlow | Node/edge drag-and-drop |
| State | Zustand | Global store for nodes, edges, persistence |
| Server | FastAPI | REST API, pipeline execution |
| AI | litellm | Unified interface to 7+ LLM models |
| Types | TypeScript | Type definitions for data structures |

---

##  Node Types

| Node | Purpose | Handles |
|------|---------|---------|
| **Input** | Provides named variables with user values | → source (right) |
| **Text** | Template with `{{variable}}` substitution | ← per-variable (left), → output (right) |
| **LLM** | Calls an AI model with system + prompt | ← system, ← prompt (left), → response (right) |
| **Output** | Collects and displays the final result | ← value (left) |

---

## ⚡ Pipeline Execution

1. **DAG Validation** — Kahn's algorithm verifies no cycles
2. **Topological Sort** — determines safe execution order
3. **Node-by-Node Execution:**
   - `customInput` → reads the user's typed value
   - `text` → substitutes `{{variables}}` (case-insensitive)
   - `llm` → calls the AI model asynchronously via `litellm`
   - `customOutput` → collects the response

---

## Supported AI Models

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4o, GPT-3.5 Turbo |
| Anthropic | Claude 3 Opus, Claude 3 Sonnet |
| Google | Gemini 2.0 Flash |
| Groq | Llama 3.3 70B, Llama 3.1 8B |

---

## Testing

```bash
cd backend-20260227T074331Z-1-001/backend
python3 -m pytest test_pipeline.py -v
```

**10 tests** covering:
- Health check, DAG validation, cycle detection
- Variable substitution (basic, case-insensitive, unreplaced)
- Pipeline execution (input passthrough, text substitution with mocked LLM)
- Topological sort ordering

---

## Features

- **Pipeline Persistence** — Save/load pipelines to localStorage
- **Server-side API Key Storage** — `POST /api-keys` stores keys by provider
- **Async LLM Execution** — Non-blocking `acompletion()` calls
- **Dynamic Handle Remapping** — Edges auto-update when variables rename
- **Docker Compose** — One-command deployment

---

## Project Structure

```
VectoShift/
├── docker-compose.yml
├── backend/
│   ├── main.py              # FastAPI server + execution engine
│   ├── llm_service.py       # LLM abstraction (sync + async)
│   ├── test_pipeline.py     # 10 pytest tests
│   ├── requirements.txt     # Pinned dependencies
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── App.js            # Root component
    │   ├── ui.js             # ReactFlow canvas
    │   ├── store.js          # Zustand state + persistence
    │   ├── submit.js         # Submit button + save/load UI
    │   ├── toolbar.js        # Draggable node palette
    │   ├── draggableNode.js  # Drag source component
    │   ├── types.ts          # TypeScript definitions
    │   ├── index.css         # Global dark theme
    │   └── nodes/
    │       ├── inputNode.js
    │       ├── textNode.js
    │       ├── llmNode.js
    │       └── outputNode.js
    ├── tsconfig.json
    ├── Dockerfile
    └── package.json
```
