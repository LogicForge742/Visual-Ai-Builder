# main.py
# The FastAPI backend server for VectoShift.
#
# ENDPOINTS:
#   GET  /                   — health check
#   POST /pipelines/parse    — validate pipeline structure (DAG check)
#   POST /pipelines/run      — execute the pipeline and return LLM output

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from collections import deque
from llm_service import call_llm, async_call_llm
import re

app = FastAPI()

# CORS Middleware
# Allows the React frontend (localhost:3000) to talk to this
# backend (localhost:8000) without browser cross-origin errors.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Data Models
# These define the shape of the JSON payload sent from the frontend.

class NodeData(BaseModel):
    # Input node fields
    inputName:  Optional[str] = None
    inputType:  Optional[str] = None
    inputValue: Optional[str] = None   # ← the actual runtime value the user typed

    # LLM node fields
    model:      Optional[str] = None
    apiKey:     Optional[str] = None

    # Output node fields
    outputName: Optional[str] = None
    outputType: Optional[str] = None

    # Text node fields
    text:       Optional[str] = None

    class Config:
        extra = "allow"

class Node(BaseModel):
    id:       str           # unique node ID  e.g. "customInput-1"
    type:     str           # node type       e.g. "customInput", "llm"
    data:     NodeData = NodeData()
    class Config:
        extra = "allow"   # ReactFlow sends position, width, height, etc.

class Edge(BaseModel):
    source:       str   # ID of the node the arrow starts from
    target:       str   # ID of the node the arrow points to
    sourceHandle: Optional[str] = None  # which handle on the source (e.g. "llm-1-response")
    targetHandle: Optional[str] = None  # which handle on the target (e.g. "llm-1-prompt")
    class Config:
        extra = "allow"   # ReactFlow sends animated, style, etc.

class Pipeline(BaseModel):
    nodes: List[Node]
    edges: List[Edge]


# ── Server-side API Key Storage (in-memory) ──
# Keys are stored per-provider so users don't have to paste them every time.
# In production, use a database or secrets manager instead.
api_key_store: Dict[str, str] = {}


class ApiKeyRequest(BaseModel):
    provider: str   # e.g. "groq", "openai", "gemini"
    api_key: str


@app.post('/api-keys')
def store_api_key(req: ApiKeyRequest):
    """Store an API key for a provider on the server."""
    api_key_store[req.provider.lower()] = req.api_key
    return {"status": "stored", "provider": req.provider.lower()}


@app.get('/api-keys')
def list_api_keys():
    """List which providers have keys stored (not the actual keys)."""
    return {"providers": list(api_key_store.keys())}


@app.delete('/api-keys/{provider}')
def delete_api_key(provider: str):
    """Remove a stored API key."""
    api_key_store.pop(provider.lower(), None)
    return {"status": "deleted", "provider": provider.lower()}


# Helper: Build adjacency map
def build_graph(nodes: List[Node], edges: List[Edge]):
    """
    Returns two dicts:
      successors:   { node_id -> [node_ids that come AFTER] }
      predecessors: { node_id -> [node_ids that come BEFORE] }
    And a lookup: { node_id -> Node }
    """
    node_map = {n.id: n for n in nodes}
    successors   = {n.id: [] for n in nodes}
    predecessors = {n.id: [] for n in nodes}

    for edge in edges:
        if edge.source in successors and edge.target in predecessors:
            successors[edge.source].append(edge.target)
            predecessors[edge.target].append(edge.source)

    return node_map, successors, predecessors


# Helper: Topological Sort (Kahn's algorithm) 
def topological_sort(nodes: List[Node], edges: List[Edge]):
    """
    Returns nodes in execution order (sources first, sinks last).
    Returns None if the graph has a cycle.
    """
    _, successors, predecessors = build_graph(nodes, edges)

    # Count incoming edges for each node
    in_degree = {n.id: len(predecessors[n.id]) for n in nodes}

    # Start with nodes that have no predecessors (entry points)
    queue = deque([nid for nid, deg in in_degree.items() if deg == 0])
    order = []

    while queue:
        nid = queue.popleft()
        order.append(nid)
        for successor in successors[nid]:
            in_degree[successor] -= 1
            if in_degree[successor] == 0:
                queue.append(successor)

    if len(order) != len(nodes):
        return None   # cycle detected

    return order


# Helper: DAG Check 
def is_dag(nodes: List[Node], edges: List[Edge]) -> bool:
    """Returns True if the graph is a Directed Acyclic Graph (no cycles)."""
    return topological_sort(nodes, edges) is not None


# Helper: Substitute {{variables}} in a text template 
def substitute_variables(template: str, values: Dict[str, str]) -> str:
    """
    Replaces all {{var_name}} placeholders in `template` with the values
    from the `values` dict.  CASE-INSENSITIVE matching.
    Example: substitute_variables("Hello {{name}}!", {"Name": "Alice"}) -> "Hello Alice!"
    """
    # Normalize all keys to lowercase for case-insensitive lookup
    lower_values = {k.lower(): v for k, v in values.items()}

    def replacer(match):
        var_name = match.group(1).lower()
        return lower_values.get(var_name, f"{{{{{match.group(1)}}}}}")  # leave unreplaced if not found

    return re.sub(r'\{\{(\w+)\}\}', replacer, template)


# Routes 

@app.get('/')
def read_root():
    """Simple health check — confirms the server is running."""
    return {'Ping': 'Pong'}


@app.post('/pipelines/parse')
def parse_pipeline(pipeline: Pipeline):
    """
    Validates the pipeline structure.
    Returns node/edge counts and whether the pipeline is a valid DAG.
    """
    num_nodes  = len(pipeline.nodes)
    num_edges  = len(pipeline.edges)
    dag_result = is_dag(pipeline.nodes, pipeline.edges)

    return {
        'num_nodes': num_nodes,
        'num_edges': num_edges,
        'is_dag':    dag_result,
    }


@app.post('/pipelines/run')
async def run_pipeline(pipeline: Pipeline):
    """
    Executes the pipeline:
    1. Validates it's a DAG
    2. Traverses nodes in topological order
    3. Executes each node based on its type:
       - customInput : provides named text values
       - text        : substitutes {{variables}} from connected inputs
       - llm         : calls the AI model with system + prompt
       - customOutput: collects the final output
    4. Returns all output node results
    """

    # Step 1: Validate the graph is a DAG
    exec_order = topological_sort(pipeline.nodes, pipeline.edges)
    if exec_order is None:
        return {"error": "Pipeline contains a cycle. Cannot execute."}

    # Build lookup structures
    node_map, successors, predecessors = build_graph(pipeline.nodes, pipeline.edges)

    # `values` stores the computed output of each node, keyed by node ID.
    # For LLM nodes we may track per-handle outputs.
    values: Dict[str, Any] = {}

    # Also build edge lookup: { (source_id, target_id) -> edge }
    # so we can find which sourceHandle was used when wiring
    edge_map: Dict[tuple, Edge] = {}
    for edge in pipeline.edges:
        edge_map[(edge.source, edge.target)] = edge

    # Build a reverse edge lookup by targetHandle:
    # { target_node_id -> { handle_name -> source_node_id } }
    handle_inputs: Dict[str, Dict[str, str]] = {n.id: {} for n in pipeline.nodes}
    for edge in pipeline.edges:
        if edge.targetHandle:
            # Strip the node ID prefix from the handle ID
            # e.g. "llm-1-prompt" -> "prompt"
            handle_name = edge.targetHandle.replace(f"{edge.target}-", "")
            handle_inputs[edge.target][handle_name] = edge.source
        else:
            # No specific handle — just map by source
            handle_inputs[edge.target]["__default__"] = edge.source

    # Step 2: Execute nodes in topological order
    outputs = {}  # final outputs from customOutput nodes

    for node_id in exec_order:
        node = node_map[node_id]

        if node.type == "customInput":
            # Use the actual runtime value the user typed in the Value field.
            # Fall back to the variable name if no value was entered.
            input_name  = node.data.inputName  or node_id
            input_value = node.data.inputValue or f"[Input: {input_name}]"
            values[node_id] = input_value

        elif node.type == "text":
            # Text node: substitute {{variables}} with values from connected nodes
            template = node.data.text or ""
            var_values = {}
            for source_id in predecessors[node_id]:
                source_value = values.get(source_id, "")
                edge = edge_map.get((source_id, node_id))

                # Strategy: map the source value under EVERY possible variable name
                # so it matches regardless of whether the user rewired or renamed.

                # 1. From the edge's targetHandle (e.g. "text-1-question" → "question")
                if edge and edge.targetHandle:
                    handle_var = edge.targetHandle.replace(f"{node_id}-", "")
                    var_values[handle_var] = source_value

                # 2. From the source node's inputName (e.g. Input node named "question")
                src_node = node_map.get(source_id)
                if src_node and src_node.data.inputName:
                    var_values[src_node.data.inputName] = source_value

                # 3. Fallback: use the source ID itself
                if not var_values:
                    var_values[source_id] = source_value

            values[node_id] = substitute_variables(template, var_values)

        elif node.type == "llm":
            # LLM node: call the AI model with system + prompt inputs
            model_id = node.data.model  or "gpt-4o"
            api_key  = node.data.apiKey or ""

            # Fallback to server-stored key if none provided in the pipeline
            if not api_key or api_key.strip() == "":
                # Detect provider from model_id
                provider = model_id.split("-")[0].lower()  # e.g. "groq" from "groq-llama3-70b"
                api_key = api_key_store.get(provider, "")

            # Look up what's connected to the "system" and "prompt" handles
            system_source = handle_inputs[node_id].get("system")
            prompt_source = handle_inputs[node_id].get("prompt")

            system_text = values.get(system_source, "") if system_source else ""
            prompt_text = values.get(prompt_source, "") if prompt_source else ""

            # Call the LLM asynchronously
            response = await async_call_llm(
                model_id=model_id,
                api_key=api_key,
                system_prompt=system_text,
                user_prompt=prompt_text,
            )
            values[node_id] = response

        elif node.type == "customOutput":
            # Output node: collect whatever is wired into it
            output_name = node.data.outputName or node_id
            if predecessors[node_id]:
                source_id = predecessors[node_id][0]  # take the first connected input
                outputs[output_name] = values.get(source_id, "")
            else:
                outputs[output_name] = ""

    # Step 3: Return everything
    return {
        "status":  "success",
        "outputs": outputs,      # { output_name: final_text }
        "values":  values,       # full map of every node's output (useful for debugging)
    }
