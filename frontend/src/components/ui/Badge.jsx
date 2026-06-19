export default function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  const variants = {
    default: 'bg-surface-50 text-surface-600 border border-surface-200/60',
    primary: 'bg-primary-50/70 text-primary-700 border border-primary-200/50',
    success: 'bg-success-50/70 text-success-600 border border-success-100',
    warning: 'bg-warning-50/70 text-warning-600 border border-warning-100',
    danger: 'bg-danger-50/70 text-danger-600 border border-danger-100',
    seller: 'bg-amber-50/70 text-amber-700 border border-amber-200/45',
    buyer: 'bg-emerald-50/70 text-emerald-700 border border-emerald-200/45',
    driver: 'bg-sky-50/70 text-sky-700 border border-sky-200/45',
    admin: 'bg-purple-50/70 text-purple-700 border border-purple-200/45',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
