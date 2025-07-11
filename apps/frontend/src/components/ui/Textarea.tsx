import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = '',
      disabled,
      ...rest
    },
    ref
  ) => {
    const baseTextareaStyles =
      'flex min-h-[80px] rounded-md border bg-white px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:placeholder:text-gray-500 dark:focus-visible:ring-offset-gray-900';
    
    const errorTextareaStyles = error
      ? 'border-error-500 focus-visible:ring-error-500'
      : 'border-gray-300 dark:border-gray-600';
    
    const widthStyle = fullWidth ? 'w-full' : '';
    
    return (
      <div className={`${widthStyle} space-y-1 ${className}`}>
        {label && (
          <label
            className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100"
            htmlFor={rest.id}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`${baseTextareaStyles} ${errorTextareaStyles} ${widthStyle}`}
          disabled={disabled}
          {...rest}
        />
        {helperText && !error && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
        {error && <p className="text-xs text-error-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;