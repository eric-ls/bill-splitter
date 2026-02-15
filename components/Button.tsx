'use client';

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'chip';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40',
  secondary: 'border border-slate-200 text-slate-700 hover:bg-slate-50',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
  chip: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
};

const activeChipClass = 'bg-blue-500 text-white shadow-sm hover:bg-blue-600';

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-4 py-3',
  icon: 'p-2.5',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', active = false, className = '', children, ...props }, ref) => {
    const baseClasses = 'font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2';

    const variantClass = variant === 'chip' && active ? activeChipClass : variantClasses[variant];

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClass} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
