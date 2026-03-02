// textNode.js
// The amber TEXT node — holds a text template / prompt.
//
// What it does:
//   - Lets the user type any text with {{variable}} placeholders
//   - Automatically detects all {{variable}} patterns in real-time
//   - Creates ONE input handle per detected variable (left side)
//     → so you can wire another node's value into each placeholder
//   - Has ONE output handle (right side) to send the full text forward
//
// Example:
//   Text: "Hello {{name}}, you have {{count}} items."
//   → Creates handles for: name, count
//   → Wire Input node "name" → {{name}} handle
//   → Wire Input node "count" → {{count}} handle
//
// Color: Amber (#f59e0b)
// Handles:
//   [target] one per {{variable}} — left side, dynamically created
//   [source] output               — right side, sends text out

import { useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';

const COLOR = '#f59e0b'; // Amber accent for this node type

//  Helper: extract all unique {{variable}} names from a string 
// Uses a regex to find every {{word}} pattern and returns a list of unique names.
// Example: "Hi {{name}}, you are {{name}}" → ["name"]  (deduped)
const extractVariables = (text) => {
  const matches = [...text.matchAll(/\{\{(\w+)\}\}/g)];
  const seen = new Set();
  const vars = [];
  for (const m of matches) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      vars.push(m[1]);
    }
  }
  return vars;
};

export const TextNode = ({ id, data }) => {
  // The text template content (starts with a demo to show the feature)
  const [currText, setCurrText] = useState(data?.text || 'Hello {{name}}!');

  // The list of {{variable}} names found in currText (updates as you type)
  const [variables, setVariables] = useState(extractVariables(data?.text || 'Hello {{name}}!'));

  // Reference to the textarea so we can auto-resize it
  const textareaRef = useRef(null);

  // Get the global store functions
  const updateField = useStore(s => s.updateNodeField);
  const updateEdgeHandle = useStore(s => s.updateEdgeHandle);

  // Auto-resize the textarea height whenever the text changes 
  // Without this, the textarea stays a fixed size even if you type many lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';           // reset first
      el.style.height = `${el.scrollHeight}px`; // grow to fit content
    }
  }, [currText]);

  // Handle text changes 
  // Every keystroke: update text, re-extract variables, save to store.
  // If variable names changed, also update any connected edges so wires don't break.
  const handleTextChange = (e) => {
    const val = e.target.value;
    const newVars = extractVariables(val);

    // If the variable names changed, remap edge targetHandles
    if (JSON.stringify(newVars) !== JSON.stringify(variables)) {
      updateEdgeHandle(id, variables, newVars);
    }

    setCurrText(val);
    setVariables(newVars);
    updateField(id, 'text', val);
  };

  // Position handles evenly along the left side 
  // If there's 1 variable → put it at 50% (middle).
  // If there are 3 variables → spread them at equal intervals.
  const getHandleTop = (index, total) => {
    if (total === 1) return '50%';
    const step = 80 / (total + 1);
    return `${10 + step * (index + 1)}%`;
  };

  return (
    <div className="node-card" style={{ borderTop: `3px solid ${COLOR}`, minWidth: 240 }}>

      {/*  Header bar  */}
      <div className="node-header" style={{ background: `${COLOR}22` }}>
        <span className="node-icon">📝</span>
        <span style={{ color: COLOR }}>Text</span>
        {/* Badge: PROMPT — reminds the user this node is for prompt templates */}
        <span style={{
          marginLeft: 'auto',
          fontSize: '9px',
          background: `${COLOR}33`,
          color: COLOR,
          padding: '2px 6px',
          borderRadius: '10px',
          fontWeight: 600,
        }}>PROMPT</span>
      </div>

      {/* Body */}
      <div className="node-body">

        {/* The text template input — use {{variable}} syntax to add placeholders */}
        <div className="field-group">
          <label className="field-label">Text Template</label>
          <textarea
            ref={textareaRef}
            className="field-textarea"
            value={currText}
            onChange={handleTextChange}
            placeholder="Type text with {{variables}} ..."
            rows={3}
          />
        </div>

        {/* Show amber badge pills for each detected {{variable}} */}
        {variables.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <span style={{ fontSize: 9, color: '#6b7280', alignSelf: 'center' }}>Vars:</span>
            {variables.map(v => (
              <span key={v} className="var-badge">
                &#123;&#123;{v}&#125;&#125;
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Target Handles (LEFT side)
          One handle per {{variable}}, directly on the node root for ReactFlow. */}
      {variables.map((v, i) => (
        <Handle
          key={v}
          type="target"
          position={Position.Left}
          id={`${id}-${v}`}
          style={{
            top: getHandleTop(i, variables.length),
            background: COLOR,
            border: '2px solid #0f1117',
            width: 12, height: 12,
            boxShadow: `0 0 6px ${COLOR}88`,
          }}
        />
      ))}

      {/* Output Handle (RIGHT side)
          The complete filled-in text flows out from here. */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-output`}
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
