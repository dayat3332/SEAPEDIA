import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-surface-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm text-surface-800 placeholder:text-surface-400 transition-all duration-200 ease-out focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none hover:border-surface-300 ${
            Icon ? 'pl-10' : ''
          } ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
