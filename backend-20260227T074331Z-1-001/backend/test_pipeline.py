# test_pipeline.py
# Backend test suite for VectoShift pipeline engine.
#
# Run with:  python -m pytest test_pipeline.py -v
#
# All LLM calls are MOCKED — no real API keys are needed.

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app, substitute_variables, topological_sort, Node, Edge, NodeData

client = TestClient(app)


# 1. Health check


def test_health_check():
    """GET / should return a 200 response."""
    response = client.get("/")
    assert response.status_code == 200


# 2. /pipelines/parse — valid DAG


def test_parse_valid_pipeline():
    """A linear Input → Text → LLM → Output pipeline is a valid DAG."""
    payload = {
        "nodes": [
            {"id": "in-1",  "type": "customInput",  "data": {}},
            {"id": "txt-1", "type": "text",          "data": {}},
            {"id": "llm-1", "type": "llm",           "data": {}},
            {"id": "out-1", "type": "customOutput",  "data": {}},
        ],
        "edges": [
            {"source": "in-1",  "target": "txt-1"},
            {"source": "txt-1", "target": "llm-1"},
            {"source": "llm-1", "target": "out-1"},
        ],
    }
    resp = client.post("/pipelines/parse", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["num_nodes"] == 4
    assert data["num_edges"] == 3
    assert data["is_dag"] is True

# 3. /pipelines/parse — empty pipeline

def test_parse_empty_pipeline():
    """An empty pipeline with 0 nodes and 0 edges is still a valid DAG."""
    resp = client.post("/pipelines/parse", json={"nodes": [], "edges": []})
    data = resp.json()
    assert data["num_nodes"] == 0
    assert data["num_edges"] == 0
    assert data["is_dag"] is True


# 4. /pipelines/parse — cycle detection


def test_parse_cycle_detection():
    """A → B → C → A is a cycle and should NOT be a valid DAG."""
    payload = {
        "nodes": [
            {"id": "a", "type": "text", "data": {}},
            {"id": "b", "type": "text", "data": {}},
            {"id": "c", "type": "text", "data": {}},
        ],
        "edges": [
            {"source": "a", "target": "b"},
            {"source": "b", "target": "c"},
            {"source": "c", "target": "a"},  # creates cycle
        ],
    }
    resp = client.post("/pipelines/parse", json=payload)
    data = resp.json()
    assert data["is_dag"] is False

# 5. substitute_variables — basic


def test_substitute_variables_basic():
    """{{name}} should be replaced with the value from the dict."""
    result = substitute_variables("Hello {{name}}!", {"name": "Alice"})
    assert result == "Hello Alice!"


# 6. substitute_variables — case insensitive


def test_substitute_variables_case_insensitive():
    """{{quiz}} should match dict key 'Quiz' (case insensitive)."""
    result = substitute_variables("Answer this {{quiz}}", {"Quiz": "capital of France?"})
    assert result == "Answer this capital of France?"


# 7. substitute_variables — unreplaced variables stay


def test_substitute_variables_unreplaced():
    """Variables not in the dict should remain as {{var}}."""
    result = substitute_variables("Hello {{name}}, age {{age}}", {"name": "Bob"})
    assert result == "Hello Bob, age {{age}}"

# 8. /pipelines/run — Input node provides value


def test_run_input_node():
    """An Input → Output pipeline should pass the inputValue through."""
    payload = {
        "nodes": [
            {"id": "in-1",  "type": "customInput",  "data": {"inputName": "q", "inputValue": "hello world"}},
            {"id": "out-1", "type": "customOutput",  "data": {"outputName": "result"}},
        ],
        "edges": [
            {"source": "in-1", "target": "out-1", "sourceHandle": "in-1-value", "targetHandle": "out-1-value"},
        ],
    }
    resp = client.post("/pipelines/run", json=payload)
    data = resp.json()
    assert data["status"] == "success"
    assert data["outputs"]["result"] == "hello world"

# 9. /pipelines/run — Text node substitution


@patch("main.async_call_llm", return_value="Paris")
def test_run_text_substitution(mock_llm):
    """Input → Text → LLM → Output should substitute {{question}} before calling LLM."""
    payload = {
        "nodes": [
            {"id": "in-1",  "type": "customInput",  "data": {"inputName": "question", "inputValue": "capital of France?"}},
            {"id": "txt-1", "type": "text",          "data": {"text": "Answer: {{question}}"}},
            {"id": "llm-1", "type": "llm",           "data": {"model": "groq-llama3-70b", "apiKey": "fake-key"}},
            {"id": "out-1", "type": "customOutput",  "data": {"outputName": "answer"}},
        ],
        "edges": [
            {"source": "in-1",  "target": "txt-1", "sourceHandle": "in-1-value",       "targetHandle": "txt-1-question"},
            {"source": "txt-1", "target": "llm-1", "sourceHandle": "txt-1-output",     "targetHandle": "llm-1-prompt"},
            {"source": "llm-1", "target": "out-1", "sourceHandle": "llm-1-response",   "targetHandle": "out-1-value"},
        ],
    }
    resp = client.post("/pipelines/run", json=payload)
    data = resp.json()
    assert data["status"] == "success"
    assert data["outputs"]["answer"] == "Paris"
    # Verify the LLM was called with the substituted text
    mock_llm.assert_called_once()
    call_args = mock_llm.call_args
    assert "Answer: capital of France?" in str(call_args)


# 10. topological_sort — correct order

def test_topological_sort_order():
    """Topological sort should return nodes so that every parent comes before its child."""
    nodes = [
        Node(id="c", type="text", data=NodeData()),
        Node(id="a", type="text", data=NodeData()),
        Node(id="b", type="text", data=NodeData()),
    ]
    edges = [
        Edge(source="a", target="b"),
        Edge(source="b", target="c"),
    ]
    order = topological_sort(nodes, edges)
    assert order is not None
    assert order.index("a") < order.index("b")
    assert order.index("b") < order.index("c")
