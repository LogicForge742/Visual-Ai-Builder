// draggableNode.js
// A single draggable chip button shown in the toolbar.
// The user grabs one of these and drops it onto the canvas
// to create a new node.
//
// Props:
//   type  — the ReactFlow node type (e.g. 'customInput', 'llm')
//   label — the display text shown on the chip (e.g. "Input")
//   color — the accent hex color for this node type
//   icon  — the emoji shown above the label

export const DraggableNode = ({ type, label, color, icon }) => {

  // When the user starts dragging, store the node type in
  // the drag event's data so the canvas knows what to create.
  const onDragStart = (event, nodeType) => {
    const appData = { nodeType };
    event.target.style.cursor = 'grabbing';
    event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={type}
      onDragStart={(event) => onDragStart(event, type)}
      onDragEnd={(event) => (event.target.style.cursor = 'grab')} // reset cursor after drop
      draggable
      style={{
        cursor: 'grab',
        minWidth: '90px',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '5px',
        borderRadius: '10px',
        // Tinted background using semi-transparent version of the node color
        background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`,
        border: `1px solid ${color}55`,
        boxShadow: `0 2px 12px ${color}22`,
        transition: 'transform 0.15s, box-shadow 0.15s',
        userSelect: 'none',
      }}
      // Hover: lift the chip up slightly and brighten the glow
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 6px 20px ${color}44`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 2px 12px ${color}22`;
      }}
    >
      {/* Emoji icon at the top of the chip */}
      <span style={{ fontSize: '18px' }}>{icon}</span>

      {/* Chip label, colored to match the node accent color */}
      <span style={{
        color: color,
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '0.3px',
        fontFamily: 'Inter, sans-serif',
      }}>{label}</span>
    </div>
  );
};