// types.ts
// Shared TypeScript type definitions for VectoShift.
//
// These types mirror the backend Pydantic models and the Zustand store shape.
// Existing .js files can gradually import these for type safety.

// Node Data 
// Covers ALL node types in a single interface (union-style).
export interface NodeData {
    // Input node
    inputName?: string;
    inputType?: string;
    inputValue?: string;

    // Text node
    text?: string;

    // LLM node
    model?: string;
    apiKey?: string;

    // Output node
    outputName?: string;
    outputType?: string;

    // Allow arbitrary extra fields
    [key: string]: unknown;
}

// Pipeline Node
export interface PipelineNode {
    id: string;
    type: "customInput" | "text" | "llm" | "customOutput";
    data: NodeData;
    position?: { x: number; y: number };
}

// Pipeline Edge
export interface PipelineEdge {
    id?: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    animated?: boolean;
}

// API Payloads
export interface PipelinePayload {
    nodes: PipelineNode[];
    edges: PipelineEdge[];
}

export interface ParseResult {
    num_nodes: number;
    num_edges: number;
    is_dag: boolean;
}

export interface RunResult {
    status: "success" | "error";
    outputs?: Record<string, string>;
    values?: Record<string, string>;
    error?: string;
}

// Zustand Store 
export interface StoreState {
    nodes: PipelineNode[];
    edges: PipelineEdge[];
    getNodeID: (type: string) => string;
    addNode: (node: PipelineNode) => void;
    onNodesChange: (changes: unknown[]) => void;
    onEdgesChange: (changes: unknown[]) => void;
    onConnect: (connection: unknown) => void;
    updateNodeField: (nodeId: string, fieldName: string, fieldValue: unknown) => void;
    updateEdgeHandle: (nodeId: string, oldVars: string[], newVars: string[]) => void;
    savePipeline: (name: string) => void;
    loadPipeline: (name: string) => boolean;
    listPipelines: () => string[];
}

//  Saved Pipeline 
export interface SavedPipeline {
    name: string;
    nodes: PipelineNode[];
    edges: PipelineEdge[];
    savedAt: string;
}
