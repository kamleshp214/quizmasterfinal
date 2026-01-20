import React from 'react';

export const Logo = ({ className }: { className?: string }) => {
  return (
    <svg 
      width="40" 
      height="40" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }}
      className={className}
    >
      {/* Brain/Circuit Geometry */}
      <path 
        d="M9.5 2C9.5 2 9.5 5 13 6.5C16.5 8 19 5.5 19 5.5" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M12 13V22M12 13L16 10M12 13L8 10" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <circle cx="12" cy="13" r="3" className="fill-neon-cyan/20 stroke-neon-cyan" strokeWidth="2" />
      <path 
        d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        className="opacity-50" 
      />
    </svg>
  );
};