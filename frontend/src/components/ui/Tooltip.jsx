import React, { useState } from 'react';

/**
 * Reusable animated tooltip component
 */
export function Tooltip({ content, children, className = '' }) {
  const [visible, setVisible] = useState(false);

  return (
    <div 
      className={`tooltip-container ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="tooltip-bubble">
          {content}
        </div>
      )}
    </div>
  );
}

export default Tooltip;
