// submit.js
// The "Submit Pipeline" button at the very bottom of the page.
//
// WHAT IT DOES (now fully wired up):
//   Step 1 — Reads all nodes + edges from the Zustand store
//   Step 2 — POSTs them as JSON to the backend /pipelines/parse
//   Step 3 — Manages loading / success / error states
//   Step 4 — Displays a result card below the button

import { useState, useEffect } from 'react';
import { useStore } from './store';

//  Step 1: selector — pick only what we need from the store 
const selector = (state) => ({
    nodes: state.nodes,
    edges: state.edges,
    savePipeline: state.savePipeline,
    loadPipeline: state.loadPipeline,
    listPipelines: state.listPipelines,
    deletePipeline: state.deletePipeline,
});

export const SubmitButton = () => {
    // Read the live nodes, edges, and persistence functions from the canvas
    const { nodes, edges, savePipeline, loadPipeline, listPipelines, deletePipeline } = useStore(selector);

    // Step 3: State management 
    const [loading, setLoading] = useState(false);  // true while waiting for backend
    const [result, setResult] = useState(null);   // backend response object
    const [error, setError] = useState(null);   // any error message

    // Pipeline persistence state
    const [pipelineName, setPipelineName] = useState('');
    const [savedList, setSavedList] = useState([]);
    const [saveMsg, setSaveMsg] = useState('');

    // Load list of saved pipelines on mount
    useEffect(() => {
        setSavedList(listPipelines());
    }, [listPipelines]);

    //  Step 2: handleSubmit — called when the button is clicked 
    const handleSubmit = async () => {
        // Don't submit if the canvas is empty
        if (nodes.length === 0) {
            setError('Canvas is empty — drag at least one node onto the canvas first.');
            setResult(null);
            return;
        }

        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const payload = { nodes, edges };

            // ── Call 1: /pipelines/parse ── validate structure (DAG check)
            const parseRes = await fetch('http://localhost:8000/pipelines/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!parseRes.ok) throw new Error(`Validation error: ${parseRes.status}`);
            const parseData = await parseRes.json();

            if (!parseData.is_dag) {
                // Cycle detected — do not run
                setResult({ ...parseData, outputs: null });
                return;
            }

            // ── Call 2: /pipelines/run ── actually execute the pipeline
            const runRes = await fetch('http://localhost:8000/pipelines/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!runRes.ok) throw new Error(`Execution error: ${runRes.status}`);
            const runData = await runRes.json();

            // Merge parse + run results into one result object
            setResult({ ...parseData, ...runData });

        } catch (err) {
            setError(err.message || 'Could not reach the backend server.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 16px',
            background: 'linear-gradient(180deg, #0f1117 0%, #12151f 100%)',
            borderTop: '1px solid #2e3347',
            position: 'relative',
            gap: 8,
            flexWrap: 'wrap',
        }}>

            {/* ── Save / Load Pipeline Bar ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center',
            }}>
                <input
                    id="pipeline-name-input"
                    value={pipelineName}
                    onChange={(e) => setPipelineName(e.target.value)}
                    placeholder="Pipeline name..."
                    style={{
                        background: '#1a1d2e', border: '1px solid #2e3347', borderRadius: 6,
                        color: '#e2e8f0', padding: '5px 10px', fontSize: 11, fontFamily: 'Inter, sans-serif',
                        width: 140,
                    }}
                />
                <button
                    id="save-pipeline-btn"
                    onClick={() => {
                        if (!pipelineName.trim()) return;
                        savePipeline(pipelineName.trim());
                        setSavedList(listPipelines());
                        setSaveMsg(`✓ Saved "${pipelineName.trim()}"`);
                        setTimeout(() => setSaveMsg(''), 2000);
                    }}
                    style={{
                        background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44',
                        borderRadius: 6, padding: '5px 12px', fontSize: 10, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    }}
                >💾 Save</button>

                {savedList.length > 0 && (
                    <>
                        <select
                            id="load-pipeline-select"
                            value=""
                            onChange={(e) => {
                                if (e.target.value) {
                                    loadPipeline(e.target.value);
                                    setPipelineName(e.target.value);
                                    setSaveMsg(`✓ Loaded "${e.target.value}"`);
                                    setTimeout(() => setSaveMsg(''), 2000);
                                }
                            }}
                            style={{
                                background: '#1a1d2e', border: '1px solid #2e3347', borderRadius: 6,
                                color: '#e2e8f0', padding: '5px 8px', fontSize: 10, fontFamily: 'Inter, sans-serif',
                            }}
                        >
                            <option value="">📂 Load pipeline...</option>
                            {savedList.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>

                        <button
                            id="delete-pipeline-btn"
                            onClick={() => {
                                if (!pipelineName.trim()) return;
                                deletePipeline(pipelineName.trim());
                                setSavedList(listPipelines());
                                setPipelineName('');
                                setSaveMsg('✓ Deleted');
                                setTimeout(() => setSaveMsg(''), 2000);
                            }}
                            style={{
                                background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444',
                                borderRadius: 6, padding: '5px 8px', fontSize: 10, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                            }}
                        >🗑</button>
                    </>
                )}

                {saveMsg && (
                    <span style={{ fontSize: 10, color: '#22c55e', fontFamily: 'Inter, sans-serif' }}>
                        {saveMsg}
                    </span>
                )}
            </div>

            {/* ── The Submit Button ── */}
            <button
                onClick={handleSubmit}          // wire up the click handler
                disabled={loading}              // prevent double-clicking while loading
                style={{
                    background: loading
                        ? '#2e3347'                 // grey out while loading
                        : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',  // purple gradient normally
                    color: loading ? '#6b7280' : '#fff',
                    border: 'none',
                    borderRadius: '50px',         // pill shape
                    padding: '10px 40px',
                    fontSize: '13px',
                    fontWeight: '600',
                    fontFamily: 'Inter, sans-serif',
                    letterSpacing: '0.3px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}
                // Hover effects (only when not loading)
                onMouseEnter={e => {
                    if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.6)';
                    }
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)';
                }}
            >
                {/* Show spinner emoji while loading, lightning bolt when ready */}
                {loading ? '⏳ Submitting...' : '⚡ Submit Pipeline'}
            </button>

            {/* ── Step 4a: Error Card ──
          Floats ABOVE the footer so it never gets cut off */}
            {error && (
                <div style={{
                    position: 'fixed',
                    bottom: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(15,17,23,0.95)',
                    border: '1px solid rgba(239,68,68,0.5)',
                    borderRadius: '12px',
                    padding: '12px 40px 12px 20px',  // extra right padding for ✕ button
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    whiteSpace: 'nowrap',
                }}>
                    ⚠️ {error}
                    {/* ✕ Dismiss button */}
                    <button
                        onClick={() => setError(null)}
                        style={{
                            position: 'absolute',
                            top: '8px',
                            right: '10px',
                            background: 'transparent',
                            border: 'none',
                            color: '#6b7280',
                            fontSize: '13px',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            borderRadius: '4px',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f1f5f9'}
                        onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
                        title="Dismiss"
                    >✕</button>
                </div>
            )}

            {/* ── Step 4b: Success / Failure Result Card ──
          Floats ABOVE the footer — fixed position so it never gets cut off */}
            {result && (
                <div style={{
                    position: 'fixed',
                    bottom: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(15,17,23,0.97)',
                    border: `1px solid ${result.is_dag ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
                    borderRadius: '14px',
                    padding: '14px 24px',
                    fontFamily: 'Inter, sans-serif',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    minWidth: '340px',
                    maxWidth: '520px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    zIndex: 1000,
                }}>
                    {/* ✕ Dismiss button — top-right corner */}
                    <button
                        onClick={() => setResult(null)}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '12px',
                            background: 'transparent',
                            border: 'none',
                            color: '#6b7280',
                            fontSize: '14px',
                            cursor: 'pointer',
                            lineHeight: 1,
                            padding: '2px 4px',
                            borderRadius: '4px',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f1f5f9'}
                        onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
                        title="Dismiss"
                    >✕</button>

                    {/* Title row: ✅ Valid / ❌ Invalid */}
                    <div style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: result.is_dag ? '#4ade80' : '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}>
                        {result.is_dag ? '✅ Valid Pipeline' : '❌ Invalid Pipeline — Contains a Cycle'}
                    </div>

                    {/* Stats row: node count | edge count | DAG status */}
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        fontSize: '11px',
                        color: '#9ca3af',
                        borderBottom: result.outputs && Object.keys(result.outputs).length > 0
                            ? '1px solid #2e3347' : 'none',
                        paddingBottom: result.outputs && Object.keys(result.outputs).length > 0
                            ? '10px' : '0',
                    }}>
                        <span>🔵 Nodes: <strong style={{ color: '#f1f5f9' }}>{result.num_nodes}</strong></span>
                        <span>🔗 Edges: <strong style={{ color: '#f1f5f9' }}>{result.num_edges}</strong></span>
                        <span>DAG: <strong style={{ color: result.is_dag ? '#4ade80' : '#f87171' }}>
                            {result.is_dag ? '✓ Yes' : '✗ No'}
                        </strong></span>
                    </div>

                    {/* LLM Output section — shown only if the pipeline ran and returned output */}
                    {result.outputs && Object.keys(result.outputs).length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Object.entries(result.outputs).map(([name, text]) => (
                                <div key={name}>
                                    {/* Output node name label */}
                                    <div style={{
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        color: '#22c55e',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '4px',
                                    }}>
                                        ⬆ {name}
                                    </div>
                                    {/* The actual LLM response text */}
                                    <div style={{
                                        background: '#12151f',
                                        border: '1px solid #2e3347',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        color: '#f1f5f9',
                                        lineHeight: '1.6',
                                        maxHeight: '120px',
                                        overflowY: 'auto',
                                        whiteSpace: 'pre-wrap',
                                    }}>
                                        {text || '(empty)'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};
