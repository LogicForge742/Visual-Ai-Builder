// toolbar.js
// The top navigation bar of the app.
//
// Left side  → VectoShift logo + "Pipeline Builder" subtitle
// Right side → 4 coloured DraggableNode chips (one per node type)
//
// The user drags a chip from here onto the canvas to add a node.
import { DraggableNode } from './draggableNode';

export const PipelineToolbar = () => {
    return (
        <div style={{
            background: 'linear-gradient(180deg, #12151f 0%, #0f1117 100%)',
            borderBottom: '1px solid #2e3347',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
        }}>

            {/*Left: App Branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Small gradient square acting as a logo icon */}
                <div style={{
                    width: 32, height: 32,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px',
                }}>⚡</div>

                {/* App name + subtitle */}
                <div>
                    <div style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '15px',
                        fontWeight: '700',
                        color: '#f1f5f9',
                        letterSpacing: '-0.3px',
                    }}>VectoShift</div>
                    <div style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '10px',
                        color: '#6b7280',
                        fontWeight: '500',
                    }}>Pipeline Builder</div>
                </div>
            </div>

            {/* ── Right: Node Palette (drag these onto the canvas) ── */}
            <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                flexWrap: 'wrap',
            }}>
                {/* Helper text */}
                <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '10px',
                    color: '#6b7280',
                    fontWeight: '500',
                    marginRight: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}>Drag to add:</span>

                {/* Each chip maps to a node type — color + icon matches the node card */}
                <DraggableNode type='customInput' label='Input' color='#3b82f6' icon='⬇️' />
                <DraggableNode type='llm' label='LLM' color='#8b5cf6' icon='🤖' />
                <DraggableNode type='customOutput' label='Output' color='#22c55e' icon='⬆️' />
                <DraggableNode type='text' label='Text' color='#f59e0b' icon='📝' />
            </div>
        </div>
    );
};
