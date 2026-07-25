import React from 'react';

/**
 * Reusable premium styled button component
 */
export function Button({ children, className = '', variant = 'primary', disabled = false, ...props }) {
  const variantClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  
  return (
    <button 
      className={`btn ${variantClass} ${disabled ? 'btn-disabled' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
