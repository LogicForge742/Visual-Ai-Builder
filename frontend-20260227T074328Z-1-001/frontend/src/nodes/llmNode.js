// llmNode.js
// The purple LLM node — represents the AI model in the pipeline.
//
// What it does:
//   - Lets the user choose which AI model to use
//   - Lets the user enter their API key (masked for security)
//   - Has TWO input handles on the left (system prompt + user prompt)
//   - Has ONE output handle on the right (the AI's response)
//
// Color: Purple (#8b5cf6)
// Handles:
//   [target] system  (left, top)    — system-level instructions
//   [target] prompt  (left, bottom) — the user's actual question/prompt
//   [source] response (right)       — the AI's reply flows out from here

import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';

const COLOR = '#8b5cf6'; // Purple accent for this node type

export const LLMNode = ({ id, data }) => {
  // Which AI model is selected
  const [model, setModel] = useState(data?.model || 'gpt-4o');

  // The user's API key (stored but masked as a password field)
  const [apiKey, setApiKey] = useState(data?.apiKey || '');

  // Get the global store function to persist field values
  const updateField = useStore(s => s.updateNodeField);

  const handleModelChange = (e) => {
    setModel(e.target.value);
    updateField(id, 'model', e.target.value);
  };

  const handleKeyChange = (e) => {
    setApiKey(e.target.value);
    updateField(id, 'apiKey', e.target.value);
  };

  return (
    <div className="node-card" style={{ borderTop: `3px solid ${COLOR}`, minWidth: 240 }}>

      {/* Header bar */}
      <div className="node-header" style={{ background: `${COLOR}22` }}>
        <span className="node-icon">🤖</span>
        <span style={{ color: COLOR }}>LLM</span>
        {/* Badge indicating this is the AI model step */}
        <span style={{
          marginLeft: 'auto',
          fontSize: '9px',
          background: `${COLOR}33`,
          color: COLOR,
          padding: '2px 6px',
          borderRadius: '10px',
          fontWeight: 600,
        }}>AI MODEL</span>
      </div>

      {/* Body: form field */}
      <div className="node-body">

        {/* Field 1: pick which AI model to use */}
        <div className="field-group">
          <label className="field-label">Model</label>
          <select className="field-select" value={model} onChange={handleModelChange}>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="claude-3-opus">Claude 3 Opus</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            <option value="gemini-pro">Gemini Pro</option>
            <option value="groq-llama3-70b">⚡ Groq Llama 3 70B</option>
            <option value="groq-mixtral">⚡ Groq Mixtral 8x7B</option>
          </select>
        </div>

        {/* Field 2: the API key — type="password" hides the characters */}
        <div className="field-group">
          <label className="field-label">API Key</label>
          <input
            className="field-input"
            type="password"
            value={apiKey}
            onChange={handleKeyChange}
            placeholder="sk-••••••••••••••••"
          />
        </div>

        {/* Visual row showing which handles are on which side */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 4,
          padding: '4px 0',
          borderTop: '1px solid #2e3347',
        }}>
          {/* Left side labels — matches the two input handles below */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{
              fontSize: 9, color: '#9ca3af', fontWeight: 600,
              background: '#2e3347', padding: '2px 6px', borderRadius: 6
            }}>⬅ system</span>
            <span style={{
              fontSize: 9, color: '#9ca3af', fontWeight: 600,
              background: '#2e3347', padding: '2px 6px', borderRadius: 6
            }}>⬅ prompt</span>
          </div>

          {/* Right side label — matches the output handle below */}
          <span style={{
            fontSize: 9, color: '#9ca3af', fontWeight: 600,
            background: '#2e3347', padding: '2px 6px', borderRadius: 6,
            alignSelf: 'center',
          }}>response ➡</span>
        </div>
      </div>

      {/* ── Input Handle: system (top-left) ──
          Wire a Text/Input node here to give the LLM its system instructions. */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-system`}
        style={{
          top: '38%',
          background: COLOR,
          border: '2px solid #0f1117',
          width: 12, height: 12,
          boxShadow: `0 0 6px ${COLOR}88`,
        }}
      />

      {/* ── Input Handle: prompt (bottom-left) ──
          Wire the user's actual question/message here. */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-prompt`}
        style={{
          top: '62%',
          background: COLOR,
          border: '2px solid #0f1117',
          width: 12, height: 12,
          boxShadow: `0 0 6px ${COLOR}88`,
        }}
      />

      {/* ── Output Handle: response (right) ──
          The LLM's answer flows out from here to an Output node. */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-response`}
        style={{
          background: COLOR,
          border: '2px solid #0f1117',
          width: 12, height: 12,
          boxShadow: `0 0 6px ${COLOR}88`,
        }}
      />
    </div>
  );
};
