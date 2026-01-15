import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, Shield, ChevronDown, Bell } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/useStore';
import Button from './Button';
import apiClient from '../../services/api/client';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout, isAdmin, isAuthenticated } = useAuthStore();
  const { sidebarOpen, sidebarMinimized } = useUIStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await apiClient.get('/api/notifications/unread-count');
        setUnreadCount(response?.count || 0);
      } catch (error) {
        // Silently ignore 404 errors (route not implemented yet)
        if (error.message?.includes('404') || error.message?.includes('Not Found')) {
          setUnreadCount(0);
          return;
        }
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // Refresh when window regains focus
    const handleFocus = () => fetchUnreadCount();
    window.addEventListener('focus', handleFocus);
    
    // Listen for custom event when notifications are updated
    const handleNotificationUpdate = () => fetchUnreadCount();
    window.addEventListener('notificationUpdated', handleNotificationUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('notificationUpdated', handleNotificationUpdate);
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={`fixed top-0 right-0 z-40 glass border-b border-white/10 transition-all duration-300 ease-in-out
      ${sidebarOpen 
        ? sidebarMinimized 
          ? 'lg:left-20' 
          : 'lg:left-64'
        : 'lg:left-20'
      } left-0`}>
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex-1">
          {/* Empty space for future content like breadcrumbs or search */}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button
            onClick={() => {
              navigate('/notifications');
              // Refresh count after navigation
              setTimeout(() => {
                window.dispatchEvent(new Event('notificationUpdated'));
              }, 500);
            }}
            className="relative p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell 
              size={20} 
              className={`transition-colors ${unreadCount > 0 ? 'text-indigo-400' : 'text-slate-300'}`}
            />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-slate-900 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label="User menu"
              aria-expanded={isProfileOpen}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-white" />
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {user?.profile?.name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {user?.email || 'No email'}
                </div>
              </div>
              <ChevronDown 
                size={16} 
                className={`text-slate-400 transition-transform flex-shrink-0 ${isProfileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 glass rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50 backdrop-blur-xl bg-slate-900/95">
                <div className="p-4 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <User size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">
                        {user?.profile?.name || 'User'}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{user?.email}</div>
                    </div>
                  </div>
                  {isAdmin() && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-500/50">
                        <Shield size={12} />
                        Admin
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate('/app/profile');
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:bg-indigo-500/20 hover:text-white transition-all duration-200 group"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-700/50 group-hover:bg-indigo-500/30 transition-colors">
                      <User size={18} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <span className="font-medium">Profile</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      navigate('/app/settings');
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:bg-indigo-500/20 hover:text-white transition-all duration-200 group"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-700/50 group-hover:bg-indigo-500/30 transition-colors">
                      <Settings size={18} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <span className="font-medium">Settings</span>
                  </button>
                  
                  {isAdmin() && (
                    <button
                      onClick={() => {
                        navigate('/app/admin');
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:bg-indigo-500/20 hover:text-white transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-lg bg-slate-700/50 group-hover:bg-indigo-500/30 transition-colors">
                        <Shield size={18} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <span className="font-medium">Admin Panel</span>
                    </button>
                  )}
                </div>
                
                <div className="border-t border-white/10 p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-all duration-200 group"
                  >
                    <div className="p-1.5 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                      <LogOut size={18} className="text-red-400 group-hover:text-red-300 transition-colors" />
                    </div>
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
