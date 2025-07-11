import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...rest
    },
    ref
  ) => {
    const baseInputStyles =
      'flex h-10 rounded-md border bg-white px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring- focus-visible:ring-primary-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700';
    
    const errorInputStyles = error
      ? 'border-error-500 focus-visible:ring-error-500'
      : 'border-gray-300 dark:border-gray-600';
    
    const widthStyle = fullWidth ? 'w-full' : '';
    
    return (
      <div className={`${widthStyle} space-y-1 ${className}`}>
        {label && (
          <label
            className="text-sm font-medium leading-none text-slate-700"
            htmlFor={rest.id}
          >
            {label}
          </label>
        )}
        <div className="relative mt-2">
          {leftIcon && (
            <div className="absolute left-2 top-0 flex h-10 items-center text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`${baseInputStyles} ${errorInputStyles} ${
              leftIcon ? 'pl-9' : ''
            } ${rightIcon ? 'pr-9' : ''} ${widthStyle}`}
            disabled={disabled}
            {...rest}
          />
          {rightIcon && (
            <div className="absolute right-2 top-0 flex h-10 items-center text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {helperText && !error && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
        {error && <p className="text-xs text-error-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;