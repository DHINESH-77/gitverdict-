import React from 'react';

/**
 * Reusable Card container with frosted glass styles
 */
export function Card({ children, className = '', interactive = false, ...props }) {
  return (
    <div 
      className={`glass p-6 ${interactive ? 'glass-interactive cursor-pointer' : ''} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
