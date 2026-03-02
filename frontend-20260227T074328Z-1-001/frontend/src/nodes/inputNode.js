// inputNode.js
// The blue INPUT node — where data enters the pipeline.
//
// What it does:
//   - Lets the user name this input (e.g. "user_question")
//   - Lets the user choose whether the input is Text or a File
//   - Has ONE output handle (right side) to pass the value forward
//
// Color: Blue (#3b82f6)
// Handle: source (right) — data flows OUT from this node

import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';

const COLOR = '#3b82f6'; // Blue accent for this node type

export const InputNode = ({ id, data }) => {
  // Local state for the variable name
  const [currName, setCurrName] = useState(
    data?.inputName || id.replace('customInput-', 'input_')
  );

  // Local state for the input type (Text or File)
  const [inputType, setInputType] = useState(data?.inputType || 'Text');

  // Local state for the RUNTIME VALUE — what the user actually wants to pass into the pipeline
  const [inputValue, setInputValue] = useState(data?.inputValue || '');

  // Get the global store function to persist field values
  const updateField = useStore(s => s.updateNodeField);

  const handleNameChange = (e) => {
    setCurrName(e.target.value);
    updateField(id, 'inputName', e.target.value);
  };

  const handleTypeChange = (e) => {
    setInputType(e.target.value);
    updateField(id, 'inputType', e.target.value);
  };

  // When the user types in the Value field, persist it to the store
  // so the backend will receive it when Submit is clicked.
  const handleValueChange = (e) => {
    setInputValue(e.target.value);
    updateField(id, 'inputValue', e.target.value);
  };

  return (
    <div className="node-card" style={{ borderTop: `3px solid ${COLOR}`, minWidth: 220 }}>

      {/* ── Header bar ── */}
      <div className="node-header" style={{ background: `${COLOR}22` }}>
        <span className="node-icon">⬇️</span>
        <span style={{ color: COLOR }}>Input</span>
        {/* Badge on the right — tells the user this is a source node */}
        <span style={{
          marginLeft: 'auto',
          fontSize: '9px',
          background: `${COLOR}33`,
          color: COLOR,
          padding: '2px 6px',
          borderRadius: '10px',
          fontWeight: 600,
        }}>SOURCE</span>
      </div>

      {/* Body: form fields ──*/}
      <div className="node-body">

        {/* Field 1: the variable name the pipeline will use */}
        <div className="field-group">
          <label className="field-label">Variable Name</label>
          <input
            className="field-input"
            type="text"
            value={currName}
            onChange={handleNameChange}
            placeholder="e.g. user_input"
          />
        </div>

        {/* Field 2: whether the user will type text or upload a file */}
        <div className="field-group">
          <label className="field-label">Input Type</label>
          <select className="field-select" value={inputType} onChange={handleTypeChange}>
            <option value="Text">📄 Text</option>
            <option value="File">📁 File</option>
          </select>
        </div>

        {/* Field 3: the actual RUNTIME VALUE the user wants to pass into the pipeline.
            This is the key new field — without it, the backend only got a placeholder. */}
        <div className="field-group">
          <label className="field-label" style={{ color: COLOR }}>Value</label>
          <textarea
            className="field-textarea"
            rows={3}
            value={inputValue}
            onChange={handleValueChange}
            placeholder={`Type the value for {{${currName}}}…`}
            style={{ minHeight: '60px', resize: 'vertical' }}
          />
        </div>

      </div>{/* end node-body */}

      {/* Output Handle — right side. Data flows OUT from this node. */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-value`}
        style={{
          background: COLOR,
          border: `2px solid #0f1117`,
          width: 12, height: 12,
          boxShadow: `0 0 6px ${COLOR}88`,
        }}
      />
    </div>
  );
};

