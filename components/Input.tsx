'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  prefix?: string;
  suffix?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ prefix, suffix, className = '', ...props }, ref) => {
    const baseClasses = 'w-full py-2 bg-white border border-slate-200 hover:border-slate-400/70 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/70 focus:bg-white';
    const tabularClasses = props.type === 'number' ? 'tabular-nums' : '';

    // Adjust padding based on prefix/suffix
    const paddingLeft = prefix ? 'pl-7' : 'pl-4';
    const paddingRight = suffix ? 'pr-7' : 'pr-4';

    return (
      <div className="relative flex-1">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          className={`${baseClasses} ${paddingLeft} ${paddingRight} ${tabularClasses} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
