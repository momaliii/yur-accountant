import { NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  MessageSquare,
  Settings,
  Shield,
  Menu,
  X,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Target,
  Receipt,
  HelpCircle,
  CheckSquare,
  Landmark,
  Calendar,
  Database,
  Bell,
  Mail,
  Ticket,
  Megaphone,
  Webhook,
  Key,
  DollarSign,
  BarChart3,
  Cloud,
} from 'lucide-react';
import { useUIStore } from '../../stores/useStore';
import { useAuthStore } from '../../stores/authStore';

const navItems = [
  { path: '/app', icon: LayoutDashboard, label: 'Home' },
  { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/app/clients', icon: Users, label: 'Clients' },
  { path: '/app/income', icon: TrendingUp, label: 'Income' },
  { path: '/app/expected-income', icon: Calendar, label: 'Expected Income' },
  { path: '/app/expenses', icon: TrendingDown, label: 'Expenses' },
  { path: '/app/debts', icon: CreditCard, label: 'Debts' },
  { path: '/app/goals', icon: Target, label: 'Goals' },
  { path: '/app/savings', icon: Landmark, label: 'My Savings' },
  { path: '/app/todos', icon: CheckSquare, label: 'To-Do List' },
  { path: '/app/invoices', icon: Receipt, label: 'Invoices' },
  { path: '/app/reports', icon: FileText, label: 'Reports' },
  { path: '/app/tax-reports', icon: Receipt, label: 'Tax Reports' },
  { path: '/app/financial', icon: DollarSign, label: 'Financial Dashboard' },
  { path: '/app/financial-reports', icon: BarChart3, label: 'Financial Reports' },
  { path: '/app/notifications', icon: Bell, label: 'Notifications' },
  { path: '/app/messages', icon: Mail, label: 'Messages' },
  { path: '/app/tickets', icon: Ticket, label: 'Support Tickets' },
  { path: '/app/announcements', icon: Megaphone, label: 'Announcements' },
  { path: '/app/migration', icon: Cloud, label: 'Data Sync' },
  { path: '/app/ai-chat', icon: MessageSquare, label: 'AI Assistant' },
  { path: '/app/help', icon: HelpCircle, label: 'Help Center' },
  { path: '/app/settings', icon: Settings, label: 'Settings' },
  { path: '/app/security', icon: Shield, label: 'Security' },
];

export default function Sidebar() {
  const { sidebarOpen, sidebarMinimized, toggleSidebar, toggleSidebarMinimized, setSidebarOpen } = useUIStore();
  const { isAdmin } = useAuthStore();

  // Close sidebar on mobile on initial load
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // Mobile: close sidebar
        setSidebarOpen(false);
      } else {
        // Desktop: open sidebar if it was closed
        if (!sidebarOpen) {
          setSidebarOpen(true);
        }
      }
    };

    // Set initial state on mount
    handleResize();
    
    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg glass"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out
          ${sidebarOpen 
            ? sidebarMinimized 
              ? 'w-20 translate-x-0' 
              : 'w-64 translate-x-0'
            : 'w-64 -translate-x-full lg:w-20 lg:translate-x-0'
          }
          glass`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 lg:p-6 border-b border-white/10 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center animate-pulse-glow flex-shrink-0">
                <Wallet size={24} className="text-white" />
              </div>
              <span
                className={`font-bold text-xl gradient-text transition-opacity duration-300
                  ${sidebarOpen && !sidebarMinimized ? 'opacity-100' : 'opacity-0 lg:hidden'}`}
              >
                YUR Finance
              </span>
            </div>
            {/* Desktop minimize toggle */}
            <button
              onClick={toggleSidebarMinimized}
              className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 items-center justify-center transition-colors"
              aria-label={sidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
            >
              {sidebarMinimized ? (
                <ChevronRight size={14} className="text-slate-300" />
              ) : (
                <ChevronLeft size={14} className="text-slate-300" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${sidebarMinimized ? 'justify-center' : ''}
                  ${isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-white border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <item.icon size={22} className="flex-shrink-0" />
                <span
                  className={`transition-opacity duration-300 whitespace-nowrap
                    ${sidebarOpen && !sidebarMinimized ? 'opacity-100' : 'opacity-0 lg:hidden'}`}
                >
                  {item.label}
                </span>
                {/* Tooltip for minimized state */}
                {sidebarMinimized && (
                  <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-slate-700">
                    {item.label}
                  </div>
                )}
              </NavLink>
            ))}
            
            {/* Admin Section */}
            {isAdmin() && (
              <>
                <div className="h-px bg-white/10 my-4" />
                <NavLink
                  to="/app/admin"
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${sidebarMinimized ? 'justify-center' : ''}
                    ${isActive
                      ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-white border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <Shield size={22} className="flex-shrink-0" />
                  <span
                    className={`transition-opacity duration-300 whitespace-nowrap
                      ${sidebarOpen && !sidebarMinimized ? 'opacity-100' : 'opacity-0 lg:hidden'}`}
                  >
                    Admin Dashboard
                  </span>
                  {sidebarMinimized && (
                    <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-slate-700">
                      Admin Dashboard
                    </div>
                  )}
                </NavLink>
                <NavLink
                  to="/app/webhooks"
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${sidebarMinimized ? 'justify-center' : ''}
                    ${isActive
                      ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-white border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <Webhook size={22} className="flex-shrink-0" />
                  <span
                    className={`transition-opacity duration-300 whitespace-nowrap
                      ${sidebarOpen && !sidebarMinimized ? 'opacity-100' : 'opacity-0 lg:hidden'}`}
                  >
                    Webhooks
                  </span>
                  {sidebarMinimized && (
                    <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-slate-700">
                      Webhooks
                    </div>
                  )}
                </NavLink>
                <NavLink
                  to="/app/api-keys"
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${sidebarMinimized ? 'justify-center' : ''}
                    ${isActive
                      ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-white border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <Key size={22} className="flex-shrink-0" />
                  <span
                    className={`transition-opacity duration-300 whitespace-nowrap
                      ${sidebarOpen && !sidebarMinimized ? 'opacity-100' : 'opacity-0 lg:hidden'}`}
                  >
                    API Keys
                  </span>
                  {sidebarMinimized && (
                    <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-slate-700">
                      API Keys
                    </div>
                  )}
                </NavLink>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <div
              className={`text-xs text-slate-500 transition-opacity duration-300 text-center
                ${sidebarOpen && !sidebarMinimized ? 'opacity-100' : 'opacity-0 lg:hidden'}`}
            >
              Media Buyer Dashboard v1.0
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

