import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'bg-transparent hover:bg-white/10 text-slate-300 hover:text-white',
    outline: 'bg-transparent border border-slate-600 hover:border-indigo-500 text-slate-300 hover:text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`btn ${variants[variant]} ${sizes[size]} ${className}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={18} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={18} />}
        </>
      )}
    </button>
  );
}

