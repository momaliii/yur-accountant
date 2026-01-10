export default function Card({ 
  children, 
  className = '', 
  hover = false,
  gradient = false,
  padding = true,
}) {
  return (
    <div
      className={`
        rounded-2xl
        ${gradient 
          ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50' 
          : 'glass'
        }
        ${hover ? 'card-hover' : ''}
        ${padding ? 'p-6' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'indigo',
}) {
  // Handle both string and React element values
  const displayValue = typeof value === 'string' ? value : value;
  const colors = {
    indigo: 'from-indigo-500 to-indigo-600',
    cyan: 'from-cyan-500 to-cyan-600',
    green: 'from-emerald-500 to-emerald-600',
    red: 'from-red-500 to-red-600',
    amber: 'from-amber-500 to-amber-600',
  };

  return (
    <Card hover className="relative overflow-hidden">
      {/* Background gradient accent */}
      <div 
        className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20
          bg-gradient-to-br ${colors[color]}`}
      />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]}
              flex items-center justify-center shadow-lg`}
          >
            {Icon && <Icon size={24} className="text-white" />}
          </div>
          
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm font-medium
                ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <div className="text-2xl font-bold text-white">{value}</div>
          {subtitle && (
            <p className="text-slate-500 text-sm">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

