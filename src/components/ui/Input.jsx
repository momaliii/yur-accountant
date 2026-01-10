import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  className = '',
  type = 'text',
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full ${Icon ? 'pl-10' : ''} ${className}
            ${error ? 'border-red-500 focus:border-red-500' : ''}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

export function Select({
  label,
  error,
  children,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <select
        className={`w-full ${className}
          ${error ? 'border-red-500 focus:border-red-500' : ''}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <textarea
        className={`w-full min-h-[100px] ${className}
          ${error ? 'border-red-500 focus:border-red-500' : ''}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

