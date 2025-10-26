import React from 'react';

type BetaBadgeProps = {
  label?: string;
  className?: string;
};

export default function BetaBadge({ label = 'Beta', className = '' }: BetaBadgeProps) {
  return (
    <span
      title="This application is currently in beta"
      className={`ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide 
        bg-amber-100 text-amber-800 border-amber-200
        dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 ${className}`}
    >
      {label}
    </span>
  );
}
