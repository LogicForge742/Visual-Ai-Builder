// store.js

import { create } from "zustand";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';

export const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  getNodeID: (type) => {
    const newIDs = { ...get().nodeIDs };
    if (newIDs[type] === undefined) {
      newIDs[type] = 0;
    }
    newIDs[type] += 1;
    set({ nodeIDs: newIDs });
    return `${type}-${newIDs[type]}`;
  },
  addNode: (node) => {
    set({
      nodes: [...get().nodes, node]
    });
  },
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection) => {
    set({
      edges: addEdge({ ...connection, type: 'smoothstep', animated: true, markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' } }, get().edges),
    });
  },
  updateNodeField: (nodeId, fieldName, fieldValue) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = { ...node.data, [fieldName]: fieldValue };
        }

        return node;
      }),
    });
  },
  // When a Text node's {{variables}} change, remap old edge targetHandles
  // to the new variable names so existing wires don't break.
  updateEdgeHandle: (nodeId, oldVars, newVars) => {
    if (oldVars.length === 0 || newVars.length === 0) return;
    // Build a mapping: oldHandle → newHandle
    // If there's only 1 old and 1 new variable, just remap directly.
    // If counts differ, remap by index as best we can.
    const edges = get().edges.map((edge) => {
      if (edge.target !== nodeId) return edge;
      // Check if this edge targets an old variable handle
      for (let i = 0; i < oldVars.length; i++) {
        const oldHandle = `${nodeId}-${oldVars[i]}`;
        if (edge.targetHandle === oldHandle && newVars[i]) {
          const newHandle = `${nodeId}-${newVars[i]}`;
          return { ...edge, targetHandle: newHandle };
        }
      }
      return edge;
    });
    set({ edges });
  },

  // Pipeline Persistence (localStorage) 
  savePipeline: (name) => {
    const { nodes, edges } = get();
    const pipelines = JSON.parse(localStorage.getItem('vectoshift_pipelines') || '{}');
    pipelines[name] = { nodes, edges, savedAt: new Date().toISOString() };
    localStorage.setItem('vectoshift_pipelines', JSON.stringify(pipelines));
  },
  loadPipeline: (name) => {
    const pipelines = JSON.parse(localStorage.getItem('vectoshift_pipelines') || '{}');
    const pipeline = pipelines[name];
    if (pipeline) {
      set({ nodes: pipeline.nodes, edges: pipeline.edges });
      return true;
    }
    return false;
  },
  listPipelines: () => {
    const pipelines = JSON.parse(localStorage.getItem('vectoshift_pipelines') || '{}');
    return Object.keys(pipelines);
  },
  deletePipeline: (name) => {
    const pipelines = JSON.parse(localStorage.getItem('vectoshift_pipelines') || '{}');
    delete pipelines[name];
    localStorage.setItem('vectoshift_pipelines', JSON.stringify(pipelines));
  },
}));
