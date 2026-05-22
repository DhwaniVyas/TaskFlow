import React from 'react';

export default function Card({
  children,
  className = '',
  hoverable = true,
  ...props
}) {
  const hoverClass = hoverable ? 'hover-lift' : '';
  return (
    <div
      className={`card ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
