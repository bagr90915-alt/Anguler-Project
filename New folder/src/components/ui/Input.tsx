import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, prefixElement, suffixElement, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 transition-colors focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 shadow-xs">
          {prefixElement && (
            <div className="pl-3 pr-2 text-slate-400 dark:text-slate-500 select-none text-sm font-medium">
              {prefixElement}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full py-2 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent focus:outline-none disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed ${
              prefixElement ? 'pl-0' : ''
            } ${suffixElement ? 'pr-0' : ''} ${className}`}
            {...props}
          />
          {suffixElement && (
            <div className="pr-3 pl-2 text-slate-400 dark:text-slate-500 select-none text-xs font-medium">
              {suffixElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
