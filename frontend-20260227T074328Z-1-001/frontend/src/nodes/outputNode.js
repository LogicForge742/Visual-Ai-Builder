// outputNode.js
// The green OUTPUT node — where the pipeline's result exits.
//
// What it does:
//   - Lets the user name this output (e.g. "answer", "result")
//   - Lets the user declare the output's type (Text or Image)
//   - Has ONE input handle (left side) to receive the final value
//
// Color: Green (#22c55e)
// Handle: target (left) — data flows INTO this node from the left

import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';

const COLOR = '#22c55e'; // Green accent for this node type

export const OutputNode = ({ id, data }) => {
  // The variable name for this output (e.g. "result")
  const [currName, setCurrName] = useState(
    data?.outputName || id.replace('customOutput-', 'output_')
  );

  // Whether the pipeline output is Text or Image
  const [outputType, setOutputType] = useState(data?.outputType || 'Text');

  // Get the global store function to persist field values
  const updateField = useStore(s => s.updateNodeField);

  const handleNameChange = (e) => {
    setCurrName(e.target.value);
    updateField(id, 'outputName', e.target.value);
  };

  const handleTypeChange = (e) => {
    setOutputType(e.target.value);
    updateField(id, 'outputType', e.target.value);
  };

  return (
    <div className="node-card" style={{ borderTop: `3px solid ${COLOR}`, minWidth: 220 }}>

      {/* ── Header bar ── */}
      <div className="node-header" style={{ background: `${COLOR}22` }}>
        <span className="node-icon">⬆️</span>
        <span style={{ color: COLOR }}>Output</span>
        {/* Badge: SINK means data ends here (it's the final destination) */}
        <span style={{
          marginLeft: 'auto',
          fontSize: '9px',
          background: `${COLOR}33`,
          color: COLOR,
          padding: '2px 6px',
          borderRadius: '10px',
          fontWeight: 600,
        }}>SINK</span>
      </div>

      {/* Body: form fields */}
      <div className="node-body">

        {/* Field 1: the name this output will be referred to as */}
        <div className="field-group">
          <label className="field-label">Variable Name</label>
          <input
            className="field-input"
            type="text"
            value={currName}
            onChange={handleNameChange}
            placeholder="e.g. result"
          />
        </div>

        {/* Field 2: is the output text, or an image? */}
        <div className="field-group">
          <label className="field-label">Output Type</label>
          <select className="field-select" value={outputType} onChange={handleTypeChange}>
            <option value="Text">📄 Text</option>
            <option value="Image">🖼️ Image</option>
          </select>
        </div>
      </div>

      {/*  Input Handle 
          Positioned on the LEFT side.
          The LLM's response handle should be wired into this. */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-value`}
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
