import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: {
    type: 'positive' | 'negative' | 'neutral';
    text: string;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  trend,
  className = '',
}) => {
  return (
    <div className={`p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors ${className}`}>
      <div className="flex items-center justify-between gap-2 text-slate-500 dark:text-slate-400">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        {icon && <div className="text-slate-400 dark:text-slate-500">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 tracking-tight">
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
            {subValue}
          </span>
        )}
      </div>

      {trend && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          <span
            className={
              trend.type === 'positive'
                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                : trend.type === 'negative'
                ? 'text-rose-600 dark:text-rose-400 font-medium'
                : 'text-slate-500 dark:text-slate-400'
            }
          >
            {trend.text}
          </span>
        </div>
      )}
    </div>
  );
};
