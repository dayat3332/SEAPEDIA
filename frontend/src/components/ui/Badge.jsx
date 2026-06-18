export default function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  const variants = {
    default: 'bg-surface-100 text-surface-600',
    primary: 'bg-primary-50 text-primary-700',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
    seller: 'bg-amber-50 text-amber-700',
    buyer: 'bg-emerald-50 text-emerald-700',
    driver: 'bg-sky-50 text-sky-700',
    admin: 'bg-purple-50 text-purple-700',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
