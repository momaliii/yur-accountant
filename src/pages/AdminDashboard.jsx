import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  DollarSign,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Shield,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  Filter,
  ArrowUpDown,
  CreditCard,
  Target,
  Receipt,
  CheckSquare,
  Landmark,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingDown,
  Bell,
  Key,
  Package,
  Plus,
  Save,
  Star,
  Smartphone,
  Upload,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card, { StatCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../services/api/client';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuthStore();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [plans, setPlans] = useState([]);
  const [appVersions, setAppVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Plans modal state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  // App Updates modal state
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null);
  const [versionForm, setVersionForm] = useState({
    version: '',
    platform: 'web',
    buildNumber: '',
    releaseNotes: '',
    downloadUrl: '',
    manifestUrl: '',
    isRequired: false,
    isActive: true,
    minSupportedVersion: '',
    updateSize: 0,
  });
  const [planForm, setPlanForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: { monthly: 0, yearly: 0 },
    currency: 'EGP',
    features: [],
    limits: {
      clients: null,
      incomeEntries: null,
      expenseEntries: null,
      invoices: null,
      storage: null,
      apiCalls: null,
    },
    isActive: true,
    isDefault: false,
    isHighlighted: false,
    trialDays: 0,
    sortOrder: 0,
  });
  
  // Users table state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    subscription: '',
  });
  
  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user',
  });
  const [notificationForm, setNotificationForm] = useState({
    userIds: [],
    type: 'info',
    title: '',
    message: '',
    actionUrl: '',
    priority: 'normal',
  });

  // Activity logs filters
  const [activityFilters, setActivityFilters] = useState({
    userId: '',
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
  });
  const [activityPage, setActivityPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin()) {
      navigate('/app');
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'plans') {
      loadPlans();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    } else if (activeTab === 'activity') {
      loadActivityLogs();
    } else if (activeTab === 'system') {
      loadSystemHealth();
    } else if (activeTab === 'updates') {
      loadAppVersions();
    }
  }, [activeTab, currentPage, sortField, sortOrder, filters, searchQuery]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersData, statsData] = await Promise.all([
        apiClient.get('/api/admin/users'),
        apiClient.get('/api/admin/stats'),
      ]);
      
      if (usersData && usersData.users) {
        setUsers(usersData.users);
      } else if (Array.isArray(usersData)) {
        setUsers(usersData);
      } else {
        setUsers([]);
      }
      
      setStats(statsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      alert(`Failed to load admin data: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
      });
      
      const usersData = await apiClient.get(`/api/admin/users?${params}`);
      if (usersData && usersData.users) {
        setUsers(usersData.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await apiClient.get('/api/admin/analytics?days=30');
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: activityPage.toString(),
        limit: '50',
        ...(activityFilters.userId && { userId: activityFilters.userId }),
        ...(activityFilters.action && { action: activityFilters.action }),
        ...(activityFilters.entityType && { entityType: activityFilters.entityType }),
        ...(activityFilters.startDate && { startDate: activityFilters.startDate }),
        ...(activityFilters.endDate && { endDate: activityFilters.endDate }),
      });
      
      const logsData = await apiClient.get(`/api/admin/activity?${params}`);
      if (logsData && logsData.logs) {
        setActivityLogs(logsData.logs);
      }
    } catch (error) {
      console.error('Error loading activity logs:', error);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const [health, metrics, dbStats] = await Promise.all([
        apiClient.get('/api/health/detailed').catch(() => null),
        apiClient.get('/api/health/metrics').catch(() => null),
        apiClient.get('/api/health/database').catch(() => null),
      ]);
      setSystemHealth({ health, metrics, dbStats });
    } catch (error) {
      console.error('Error loading system health:', error);
    }
  };

  const loadPlans = async () => {
    try {
      const data = await apiClient.get('/api/admin/plans');
      setPlans(data?.plans || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const loadAppVersions = async () => {
    try {
      const data = await apiClient.get('/api/app/updates?platform=all');
      setAppVersions(data?.versions || []);
    } catch (error) {
      console.error('Error loading app versions:', error);
      // Try alternative endpoint - get each platform separately
      try {
        const [ios, android, web] = await Promise.all([
          apiClient.get('/api/app/updates/ios').catch(() => ({ versions: [] })),
          apiClient.get('/api/app/updates/android').catch(() => ({ versions: [] })),
          apiClient.get('/api/app/updates/web').catch(() => ({ versions: [] })),
        ]);
        setAppVersions([
          ...(ios?.versions || []),
          ...(android?.versions || []),
          ...(web?.versions || []),
        ]);
      } catch (err) {
        console.error('Error loading app versions from alternative endpoint:', err);
        setAppVersions([]);
      }
    }
  };

  const handleCreateVersion = async (e) => {
    e.preventDefault();
    try {
      if (editingVersion) {
        await apiClient.put(`/api/admin/app-versions/${editingVersion._id}`, versionForm);
      } else {
        await apiClient.post('/api/admin/app-versions', versionForm);
      }
      setIsVersionModalOpen(false);
      setEditingVersion(null);
      setVersionForm({
        version: '',
        platform: 'web',
        buildNumber: '',
        releaseNotes: '',
        downloadUrl: '',
        manifestUrl: '',
        isRequired: false,
        isActive: true,
        minSupportedVersion: '',
        updateSize: 0,
      });
      loadAppVersions();
    } catch (error) {
      console.error('Error saving app version:', error);
      alert(`Failed to save app version: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditVersion = (version) => {
    setEditingVersion(version);
    setVersionForm({
      version: version.version || '',
      platform: version.platform || 'web',
      buildNumber: version.buildNumber || '',
      releaseNotes: version.releaseNotes || '',
      downloadUrl: version.downloadUrl || '',
      manifestUrl: version.manifestUrl || '',
      isRequired: version.isRequired || false,
      isActive: version.isActive !== undefined ? version.isActive : true,
      minSupportedVersion: version.minSupportedVersion || '',
      updateSize: version.updateSize || 0,
    });
    setIsVersionModalOpen(true);
  };

  const handleDeleteVersion = async (versionId) => {
    if (!confirm('Are you sure you want to delete this app version?')) {
      return;
    }
    try {
      await apiClient.delete(`/api/admin/app-versions/${versionId}`);
      loadAppVersions();
    } catch (error) {
      console.error('Error deleting app version:', error);
      alert(`Failed to delete app version: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/admin/plans', planForm);
      setIsPlanModalOpen(false);
      setPlanForm({
        name: '',
        slug: '',
        description: '',
        price: { monthly: 0, yearly: 0 },
        currency: 'EGP',
        features: [],
        limits: {
          clients: null,
          incomeEntries: null,
          expenseEntries: null,
          invoices: null,
          storage: null,
          apiCalls: null,
        },
        isActive: true,
        isDefault: false,
        isHighlighted: false,
        trialDays: 0,
        sortOrder: 0,
      });
      loadPlans();
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Failed to create plan');
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/api/admin/plans/${editingPlan._id}`, planForm);
      setIsPlanModalOpen(false);
      setEditingPlan(null);
      setPlanForm({
        name: '',
        slug: '',
        description: '',
        price: { monthly: 0, yearly: 0 },
        currency: 'EGP',
        features: [],
        limits: {
          clients: null,
          incomeEntries: null,
          expenseEntries: null,
          invoices: null,
          storage: null,
          apiCalls: null,
        },
        isActive: true,
        isDefault: false,
        isHighlighted: false,
        trialDays: 0,
        sortOrder: 0,
      });
      loadPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Failed to update plan');
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) return;
    try {
      await apiClient.delete(`/api/admin/plans/${id}`);
      loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert(error.response?.data?.error || 'Failed to delete plan');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    if (activeTab === 'analytics') await loadAnalytics();
    if (activeTab === 'activity') await loadActivityLogs();
    setIsRefreshing(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/admin/users', userForm);
      setIsUserModalOpen(false);
      setUserForm({ email: '', password: '', name: '', role: 'user' });
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/api/admin/users/${editingUser._id || editingUser.id}`, {
        email: userForm.email,
        name: userForm.name,
        role: userForm.role,
      });
      setIsUserModalOpen(false);
      setEditingUser(null);
      setUserForm({ email: '', password: '', name: '', role: 'user' });
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await apiClient.delete(`/api/admin/users/${id}`);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleActivateUser = async (id) => {
    try {
      await apiClient.post(`/api/admin/users/${id}/activate`);
      loadUsers();
      alert('User activated successfully');
    } catch (error) {
      console.error('Error activating user:', error);
      alert('Failed to activate user');
    }
  };

  const handleResetPassword = async (userId, newPassword) => {
    try {
      await apiClient.post(`/api/admin/users/${userId}/reset-password`, { newPassword });
      alert('Password reset successfully');
      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password');
      return false;
    }
  };

  const handleViewUserDetails = async (user) => {
    try {
      setSelectedUser(user);
      const details = await apiClient.get(`/api/admin/users/${user._id || user.id}/details`);
      setUserDetails(details);
      setIsUserDetailModalOpen(true);
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const handleExportUsers = async (format = 'json') => {
    try {
      const token = useAuthStore.getState().token;
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${baseUrl}/api/admin/export/users?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      if (format === 'csv') {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      alert('Failed to export users');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = !searchQuery || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = !filters.role || user.role === filters.role;
    const matchesStatus = !filters.status || 
      (filters.status === 'active' && user.isActive) ||
      (filters.status === 'inactive' && !user.isActive);
    const matchesSubscription = !filters.subscription || 
      user.subscription?.plan === filters.subscription;

    return matchesSearch && matchesRole && matchesStatus && matchesSubscription;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortField) {
      case 'email':
        aVal = a.email || '';
        bVal = b.email || '';
        break;
      case 'name':
        aVal = a.profile?.name || '';
        bVal = b.profile?.name || '';
        break;
      case 'createdAt':
        aVal = new Date(a.createdAt || 0);
        bVal = new Date(b.createdAt || 0);
        break;
      case 'lastLogin':
        aVal = new Date(a.lastLogin || 0);
        bVal = new Date(b.lastLogin || 0);
        break;
      default:
        aVal = a[sortField] || '';
        bVal = b[sortField] || '';
    }
    
    if (typeof aVal === 'string') {
      return sortOrder === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    } else {
      return sortOrder === 'asc' 
        ? aVal - bVal
        : bVal - aVal;
    }
  });

  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated || !isAdmin()) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="w-8 h-8" />
            Admin Dashboard
          </h1>
          <p className="text-slate-400 mt-1">Manage users and view platform statistics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={handleRefresh}
            disabled={isRefreshing}
            icon={RefreshCw}
            className={isRefreshing ? 'animate-spin' : ''}
          >
            Refresh
          </Button>
          {activeTab === 'users' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleExportUsers('csv')}
                icon={Download}
              >
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportUsers('json')}
                icon={Download}
              >
                Export JSON
              </Button>
            </div>
          )}
          {activeTab === 'users' && (
            <Button onClick={() => setIsUserModalOpen(true)} icon={UserPlus}>
              Create User
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'plans', label: 'Plans', icon: Package },
          { id: 'analytics', label: 'Analytics', icon: PieChartIcon },
          { id: 'activity', label: 'Activity Logs', icon: Activity },
          { id: 'updates', label: 'App Updates', icon: Smartphone },
          { id: 'system', label: 'System Health', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 active:bg-white/5'
              }`}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Users"
                value={stats.users?.total || 0}
                subtitle={`${stats.users?.active || 0} active`}
                icon={Users}
                color="indigo"
              />
              <StatCard
                title="Total Clients"
                value={stats.data?.clients || 0}
                icon={Users}
                color="cyan"
              />
              <StatCard
                title="Total Income"
                value={new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'EGP',
                  minimumFractionDigits: 0,
                }).format(stats.data?.income || 0)}
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                title="Total Expenses"
                value={new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'EGP',
                  minimumFractionDigits: 0,
                }).format(stats.data?.expenses || 0)}
                icon={TrendingDown}
                color="red"
              />
              <StatCard
                title="Net Profit"
                value={new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'EGP',
                  minimumFractionDigits: 0,
                }).format(stats.data?.netProfit || 0)}
                icon={DollarSign}
                color={stats.data?.netProfit >= 0 ? 'green' : 'red'}
              />
              <StatCard
                title="Total Debts"
                value={stats.data?.debts || 0}
                icon={CreditCard}
                color="amber"
              />
              <StatCard
                title="Total Goals"
                value={stats.data?.goals || 0}
                icon={Target}
                color="purple"
              />
              <StatCard
                title="Total Savings"
                value={stats.data?.savings || 0}
                icon={Landmark}
                color="cyan"
              />
              <StatCard
                title="Total Invoices"
                value={stats.data?.invoices || 0}
                icon={Receipt}
                color="indigo"
              />
              <StatCard
                title="Total Todos"
                value={stats.data?.todos || 0}
                icon={CheckSquare}
                color="emerald"
              />
              <StatCard
                title="Avg Income/User"
                value={new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'EGP',
                  minimumFractionDigits: 0,
                }).format(stats.data?.avgIncomePerUser || 0)}
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                title="Avg Expenses/User"
                value={new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'EGP',
                  minimumFractionDigits: 0,
                }).format(stats.data?.avgExpensesPerUser || 0)}
                icon={TrendingDown}
                color="red"
              />
            </div>
          )}
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card padding={false}>
          <div className="p-6 border-b border-slate-700">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Users</h2>
              </div>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-4">
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={Search}
                  className="flex-1 min-w-full sm:min-w-64"
                />
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 touch-manipulation"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 touch-manipulation"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={filters.subscription}
                  onChange={(e) => setFilters({ ...filters, subscription: e.target.value })}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 touch-manipulation"
                >
                  <option value="">All Plans</option>
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading users...</div>
          ) : paginatedUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400 mb-4">
                {searchQuery || Object.values(filters).some(f => f) 
                  ? 'No users found matching your filters.' 
                  : 'No users found. Create your first user!'}
              </p>
              {!searchQuery && !Object.values(filters).some(f => f) && (
                <Button onClick={() => setIsUserModalOpen(true)} icon={UserPlus}>
                  Create First User
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th 
                        className="text-left p-4 text-sm font-medium text-slate-400 cursor-pointer hover:text-slate-300"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center gap-2">
                          Email
                          <ArrowUpDown size={14} />
                        </div>
                      </th>
                      <th 
                        className="text-left p-4 text-sm font-medium text-slate-400 cursor-pointer hover:text-slate-300"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          Name
                          <ArrowUpDown size={14} />
                        </div>
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-slate-400">Role</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-400">Subscription</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                      <th 
                        className="text-left p-4 text-sm font-medium text-slate-400 cursor-pointer hover:text-slate-300"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center gap-2">
                          Created
                          <ArrowUpDown size={14} />
                        </div>
                      </th>
                      <th 
                        className="text-left p-4 text-sm font-medium text-slate-400 cursor-pointer hover:text-slate-300"
                        onClick={() => handleSort('lastLogin')}
                      >
                        <div className="flex items-center gap-2">
                          Last Login
                          <ArrowUpDown size={14} />
                        </div>
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedUsers.map((user) => (
                      <tr key={user._id || user.id} className="hover:bg-white/5">
                        <td className="p-4">{user.email}</td>
                        <td className="p-4">{user.profile?.name || '-'}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-indigo-500/20 text-indigo-400'
                                : 'bg-slate-500/20 text-slate-400'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs text-slate-400 capitalize">
                            {user.subscription?.plan || 'free'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              user.isActive
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-400">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="p-4 text-sm text-slate-400">
                          {formatDate(user.lastLogin)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUserDetails(user)}
                              icon={Eye}
                              className="touch-manipulation"
                              title="View Details"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingUser(user);
                                setUserForm({
                                  email: user.email,
                                  password: '',
                                  name: user.profile?.name || '',
                                  role: user.role,
                                });
                                setIsUserModalOpen(true);
                              }}
                              icon={Edit2}
                              className="touch-manipulation"
                              title="Edit User"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newPassword = prompt(`Reset password for ${user.email}\n\nEnter new password (min 6 characters):`);
                                if (newPassword && newPassword.length >= 6) {
                                  handleResetPassword(user._id || user.id, newPassword);
                                } else if (newPassword) {
                                  alert('Password must be at least 6 characters');
                                }
                              }}
                              icon={Key}
                              className="text-yellow-400 hover:text-yellow-300 touch-manipulation"
                              title="Reset Password"
                            />
                            {!user.isActive ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleActivateUser(user._id || user.id)}
                                className="text-green-400 hover:text-green-300 touch-manipulation"
                                title="Activate User"
                              >
                                Activate
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user._id || user.id)}
                                className="text-red-400 hover:text-red-300 touch-manipulation"
                                icon={Trash2}
                                title="Deactivate User"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-700 flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    Showing {(currentPage - 1) * usersPerPage + 1} to {Math.min(currentPage * usersPerPage, sortedUsers.length)} of {sortedUsers.length} users
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        Math.abs(page - currentPage) <= 1
                      )
                      .map((page, idx, arr) => (
                        <div key={page} className="flex items-center gap-1">
                          {idx > 0 && arr[idx - 1] !== page - 1 && <span className="text-slate-600">...</span>}
                          <Button
                            variant={currentPage === page ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <Card padding={false}>
          <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-white">Subscription Plans</h2>
            <Button onClick={() => {
              setEditingPlan(null);
              setPlanForm({
                name: '',
                slug: '',
                description: '',
                price: { monthly: 0, yearly: 0 },
                currency: 'EGP',
                features: [],
                limits: {
                  clients: null,
                  incomeEntries: null,
                  expenseEntries: null,
                  invoices: null,
                  storage: null,
                  apiCalls: null,
                },
                isActive: true,
                isDefault: false,
                isHighlighted: false,
                trialDays: 0,
                sortOrder: 0,
              });
              setIsPlanModalOpen(true);
            }} icon={Plus}>
              Create Plan
            </Button>
          </div>

          <div className="p-6">
            {plans.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <p>No plans found. Create your first plan!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card 
                    key={plan._id} 
                    className={`relative transition-all hover:shadow-lg hover:shadow-indigo-500/10 ${
                      plan.isHighlighted 
                        ? 'border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 shadow-lg shadow-yellow-500/20' 
                        : 'border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {/* Badges */}
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
                      {plan.isDefault && (
                        <span className="px-2.5 py-1 bg-indigo-500/30 text-indigo-300 text-xs font-medium rounded-md border border-indigo-500/50">
                          Default
                        </span>
                      )}
                      {plan.isHighlighted && (
                        <span className="px-2.5 py-1 bg-yellow-500/30 text-yellow-300 text-xs font-medium rounded-md border border-yellow-500/50 flex items-center gap-1">
                          <Star size={12} className="fill-yellow-300 text-yellow-300" />
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-5">
                      {/* Plan Name & Description */}
                      <div className="pr-20">
                        <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                        {plan.description && (
                          <p className="text-sm text-slate-400 leading-relaxed">{plan.description}</p>
                        )}
                      </div>
                      
                      {/* Price */}
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-white">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: plan.currency,
                              minimumFractionDigits: 2,
                            }).format(plan.price?.monthly || 0)}
                          </span>
                          <span className="text-slate-400 text-sm font-medium">/month</span>
                        </div>
                        {plan.price?.yearly > 0 && (
                          <div className="text-sm text-slate-400">
                            or {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: plan.currency,
                              minimumFractionDigits: 2,
                            }).format(plan.price.yearly)}/year
                          </div>
                        )}
                        {plan.trialDays > 0 && (
                          <div className="text-sm font-medium text-green-400 mt-2">
                            {plan.trialDays} days free trial
                          </div>
                        )}
                      </div>

                      {/* Limits */}
                      {(plan.limits?.clients !== null || plan.limits?.incomeEntries !== null || plan.limits?.storage !== null || 
                        plan.limits?.expenseEntries !== null || plan.limits?.invoices !== null) && (
                        <div className="pt-4 border-t border-slate-700">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Limits:</div>
                          <div className="space-y-1.5">
                            {plan.limits?.clients !== null && plan.limits?.clients !== undefined && (
                              <div className="text-sm text-slate-300">
                                <span className="text-slate-400">Clients:</span> {plan.limits.clients === -1 ? 'Unlimited' : plan.limits.clients}
                              </div>
                            )}
                            {plan.limits?.incomeEntries !== null && plan.limits?.incomeEntries !== undefined && (
                              <div className="text-sm text-slate-300">
                                <span className="text-slate-400">Income Entries:</span> {plan.limits.incomeEntries === -1 ? 'Unlimited' : plan.limits.incomeEntries}
                              </div>
                            )}
                            {plan.limits?.expenseEntries !== null && plan.limits?.expenseEntries !== undefined && (
                              <div className="text-sm text-slate-300">
                                <span className="text-slate-400">Expense Entries:</span> {plan.limits.expenseEntries === -1 ? 'Unlimited' : plan.limits.expenseEntries}
                              </div>
                            )}
                            {plan.limits?.invoices !== null && plan.limits?.invoices !== undefined && (
                              <div className="text-sm text-slate-300">
                                <span className="text-slate-400">Invoices:</span> {plan.limits.invoices === -1 ? 'Unlimited' : plan.limits.invoices}
                              </div>
                            )}
                            {plan.limits?.storage !== null && plan.limits?.storage !== undefined && (
                              <div className="text-sm text-slate-300">
                                <span className="text-slate-400">Storage:</span> {plan.limits.storage === -1 ? 'Unlimited' : `${plan.limits.storage} MB`}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                          plan.isActive 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700">
                        <Button
                          variant={plan.isHighlighted ? "primary" : "outline"}
                          size="sm"
                          onClick={async () => {
                            try {
                              await apiClient.put(`/api/admin/plans/${plan._id}`, {
                                isHighlighted: !plan.isHighlighted,
                              });
                              loadPlans();
                            } catch (error) {
                              console.error('Error toggling highlight:', error);
                              alert('Failed to update highlight status');
                            }
                          }}
                          icon={Star}
                          className={`flex-1 sm:flex-none ${plan.isHighlighted ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30' : ''}`}
                        >
                          {plan.isHighlighted ? 'Unhighlight' : 'Highlight'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPlan(plan);
                            setPlanForm({
                              name: plan.name,
                              slug: plan.slug,
                              description: plan.description || '',
                              price: plan.price || { monthly: 0, yearly: 0 },
                              currency: plan.currency || 'EGP',
                              features: plan.features || [],
                              limits: plan.limits || {
                                clients: null,
                                incomeEntries: null,
                                expenseEntries: null,
                                invoices: null,
                                storage: null,
                                apiCalls: null,
                              },
                              isActive: plan.isActive,
                              isDefault: plan.isDefault,
                              isHighlighted: plan.isHighlighted || false,
                              trialDays: plan.trialDays || 0,
                              sortOrder: plan.sortOrder || 0,
                            });
                            setIsPlanModalOpen(true);
                          }}
                          icon={Edit2}
                          className="flex-1 sm:flex-none"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeletePlan(plan._id)}
                          icon={Trash2}
                          className="flex-1 sm:flex-none"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {analytics ? (
            <>
              {/* User Growth Chart */}
              <Card>
                <h3 className="text-xl font-semibold mb-4">User Growth</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Revenue Trends */}
              <Card>
                <h3 className="text-xl font-semibold mb-4">Revenue Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.revenueTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Subscription Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <h3 className="text-xl font-semibold mb-4">Subscription Plans</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.subscriptionStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ plan, count }) => `${plan}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics.subscriptionStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                {/* Monthly Stats */}
                <Card>
                  <h3 className="text-xl font-semibold mb-4">Monthly Statistics</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics.monthlyStats?.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                      <Legend />
                      <Bar dataKey="income" fill="#10b981" />
                      <Bar dataKey="expenses" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <div className="p-8 text-center text-slate-400">Loading analytics...</div>
            </Card>
          )}
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'activity' && (
        <Card padding={false}>
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Activity Logs</h2>
            <div className="flex flex-wrap gap-4">
              <Input
                type="text"
                placeholder="User ID (optional)"
                value={activityFilters.userId}
                onChange={(e) => setActivityFilters({ ...activityFilters, userId: e.target.value })}
                className="w-48"
              />
              <select
                value={activityFilters.action}
                onChange={(e) => setActivityFilters({ ...activityFilters, action: e.target.value })}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="create_client">Create Client</option>
                <option value="update_client">Update Client</option>
                <option value="delete_client">Delete Client</option>
                <option value="create_income">Create Income</option>
                <option value="create_expense">Create Expense</option>
              </select>
              <Input
                type="date"
                placeholder="Start Date"
                value={activityFilters.startDate}
                onChange={(e) => setActivityFilters({ ...activityFilters, startDate: e.target.value })}
                className="w-48"
              />
              <Input
                type="date"
                placeholder="End Date"
                value={activityFilters.endDate}
                onChange={(e) => setActivityFilters({ ...activityFilters, endDate: e.target.value })}
                className="w-48"
              />
              <Button onClick={loadActivityLogs} icon={Filter}>
                Apply Filters
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">User</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Action</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Entity</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Timestamp</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activityLogs.map((log) => (
                  <tr key={log._id || log.id} className="hover:bg-white/5">
                    <td className="p-4">
                      {log.userId?.email || log.userId?._id || 'Unknown'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-500/20 text-indigo-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {log.entityType || '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* App Updates Tab */}
      {activeTab === 'updates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">App Versions</h2>
              <p className="text-slate-400 mt-1">Manage app versions for iOS, Android, and Web</p>
            </div>
            <Button
              onClick={() => {
                setEditingVersion(null);
                setVersionForm({
                  version: '',
                  platform: 'web',
                  buildNumber: '',
                  releaseNotes: '',
                  downloadUrl: '',
                  manifestUrl: '',
                  isRequired: false,
                  isActive: true,
                  minSupportedVersion: '',
                  updateSize: 0,
                });
                setIsVersionModalOpen(true);
              }}
              icon={Plus}
            >
              Create Version
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="text-sm text-slate-400 mb-1">iOS Versions</div>
              <div className="text-2xl font-bold text-white">
                {appVersions.filter(v => v.platform === 'ios' && v.isActive).length}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-slate-400 mb-1">Android Versions</div>
              <div className="text-2xl font-bold text-white">
                {appVersions.filter(v => v.platform === 'android' && v.isActive).length}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-slate-400 mb-1">Web Versions</div>
              <div className="text-2xl font-bold text-white">
                {appVersions.filter(v => v.platform === 'web' && v.isActive).length}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            {['ios', 'android', 'web'].map((platform) => {
              const platformVersions = appVersions.filter(v => v.platform === platform);
              if (platformVersions.length === 0) return null;

              return (
                <Card key={platform}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white capitalize">{platform} Versions</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-4 text-slate-400">Version</th>
                          <th className="text-left py-2 px-4 text-slate-400">Build</th>
                          <th className="text-left py-2 px-4 text-slate-400">Status</th>
                          <th className="text-left py-2 px-4 text-slate-400">Required</th>
                          <th className="text-left py-2 px-4 text-slate-400">Release Date</th>
                          <th className="text-right py-2 px-4 text-slate-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {platformVersions.map((version) => (
                          <tr key={version._id} className="border-b border-slate-800 hover:bg-slate-800/50">
                            <td className="py-3 px-4">
                              <div className="font-medium text-white">{version.version}</div>
                              {version.releaseNotes && (
                                <div className="text-sm text-slate-400 mt-1">{version.releaseNotes.substring(0, 50)}...</div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-300">{version.buildNumber}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs ${
                                version.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                              }`}>
                                {version.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {version.isRequired && (
                                <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">Required</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-sm">
                              {version.releaseDate ? new Date(version.releaseDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={Edit2}
                                  onClick={() => handleEditVersion(version)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={Trash2}
                                  onClick={() => handleDeleteVersion(version._id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}

            {appVersions.length === 0 && (
              <Card>
                <div className="p-8 text-center text-slate-400">
                  No app versions found. Create your first version to get started.
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* System Health Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {systemHealth ? (
            <>
              {/* System Health Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <h3 className="text-lg font-semibold mb-2">System Status</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${systemHealth.health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-slate-300">{systemHealth.health?.status || 'Unknown'}</span>
                  </div>
                  {systemHealth.health?.uptime && (
                    <p className="text-sm text-slate-400 mt-2">
                      Uptime: {Math.floor(systemHealth.health.uptime / 3600)}h {Math.floor((systemHealth.health.uptime % 3600) / 60)}m
                    </p>
                  )}
                </Card>
                
                {systemHealth.metrics && (
                  <Card>
                    <h3 className="text-lg font-semibold mb-2">API Metrics</h3>
                    <p className="text-slate-300">Total Requests: {systemHealth.metrics.totalRequests || 0}</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Avg Response Time: {systemHealth.metrics.avgResponseTime ? `${systemHealth.metrics.avgResponseTime.toFixed(2)}ms` : 'N/A'}
                    </p>
                  </Card>
                )}
                
                {systemHealth.dbStats && (
                  <Card>
                    <h3 className="text-lg font-semibold mb-2">Database</h3>
                    <p className="text-slate-300">Collections: {systemHealth.dbStats.collections || 'N/A'}</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Data Size: {systemHealth.dbStats.dataSize ? `${(systemHealth.dbStats.dataSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                    </p>
                  </Card>
                )}
              </div>

              {/* Quick Links */}
              <Card>
                <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/app/tickets')}
                    className="w-full"
                  >
                    View Tickets
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/app/announcements')}
                    className="w-full"
                  >
                    Announcements
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/app/webhooks')}
                    className="w-full"
                  >
                    Webhooks
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/app/api-keys')}
                    className="w-full"
                  >
                    API Keys
                  </Button>
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <div className="p-8 text-center text-slate-400">Loading system health...</div>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
          setUserForm({ email: '', password: '', name: '', role: 'user' });
        }}
        title={editingUser ? 'Edit User' : 'Create User'}
      >
        <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
          <Input
            type="email"
            label="Email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            required
            disabled={!!editingUser}
          />
          <Input
            type="text"
            label="Name"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
          />
          {!editingUser && (
            <Input
              type="password"
              label="Password"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              required={!editingUser}
              minLength={6}
            />
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsUserModalOpen(false);
                setEditingUser(null);
                setUserForm({ email: '', password: '', name: '', role: 'user' });
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{editingUser ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* User Details Modal */}
      <Modal
        isOpen={isUserDetailModalOpen}
        onClose={() => {
          setIsUserDetailModalOpen(false);
          setSelectedUser(null);
          setUserDetails(null);
        }}
        title={`User Details: ${selectedUser?.email || ''}`}
      >
        {userDetails ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Account Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-slate-400">Email:</span>
                  <p className="text-white">{userDetails.user.email}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Name:</span>
                  <p className="text-white">{userDetails.user.profile?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Role:</span>
                  <p className="text-white capitalize">{userDetails.user.role}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Subscription:</span>
                  <p className="text-white capitalize">{userDetails.user.subscription?.plan || 'free'}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Created:</span>
                  <p className="text-white">{formatDate(userDetails.user.createdAt)}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Last Login:</span>
                  <p className="text-white">{formatDate(userDetails.user.lastLogin) || 'Never'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Data Counts</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-slate-400">Clients:</span>
                  <p className="text-white text-xl font-semibold">{userDetails.dataCounts.clients}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Income:</span>
                  <p className="text-white text-xl font-semibold">{userDetails.dataCounts.income}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Expenses:</span>
                  <p className="text-white text-xl font-semibold">{userDetails.dataCounts.expenses}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Debts:</span>
                  <p className="text-white text-xl font-semibold">{userDetails.dataCounts.debts}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Goals:</span>
                  <p className="text-white text-xl font-semibold">{userDetails.dataCounts.goals}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Invoices:</span>
                  <p className="text-white text-xl font-semibold">{userDetails.dataCounts.invoices}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Todos:</span>
                  <p className="text-white text-xl font-semibold">{userDetails.dataCounts.todos}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Savings:</span>
                  <p className="text-white text-xl font-semibold">{userDetails.dataCounts.savings}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-slate-400">Total Income:</span>
                  <p className="text-white text-xl font-semibold text-green-400">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'EGP',
                      minimumFractionDigits: 0,
                    }).format(userDetails.totals.income)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Total Expenses:</span>
                  <p className="text-white text-xl font-semibold text-red-400">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'EGP',
                      minimumFractionDigits: 0,
                    }).format(userDetails.totals.expenses)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Net Profit:</span>
                  <p className={`text-white text-xl font-semibold ${
                    userDetails.totals.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'EGP',
                      minimumFractionDigits: 0,
                    }).format(userDetails.totals.netProfit)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-700 flex gap-2">
              <Button
                onClick={() => {
                  const newPassword = prompt('Enter new password (min 6 characters):');
                  if (newPassword && newPassword.length >= 6) {
                    handleResetPassword(userDetails.user.id, newPassword);
                  } else if (newPassword) {
                    alert('Password must be at least 6 characters');
                  }
                }}
                variant="outline"
              >
                Reset Password
              </Button>
              <Button
                onClick={() => {
                  setNotificationForm({
                    userIds: [userDetails.user.id],
                    type: 'info',
                    title: '',
                    message: '',
                    actionUrl: '',
                    priority: 'normal',
                  });
                  setIsNotificationModalOpen(true);
                }}
                variant="primary"
                icon={Bell}
              >
                Send Notification
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">Loading user details...</div>
        )}
      </Modal>

      {/* Send Notification Modal */}
      {isNotificationModalOpen && (
        <Modal
          isOpen={isNotificationModalOpen}
          onClose={() => {
            setIsNotificationModalOpen(false);
            setNotificationForm({
              userIds: [],
              type: 'info',
              title: '',
              message: '',
              actionUrl: '',
              priority: 'normal',
            });
          }}
          title="Send Notification"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await apiClient.post('/api/admin/notifications/send', notificationForm);
                alert('Notification sent successfully!');
                setIsNotificationModalOpen(false);
                setNotificationForm({
                  userIds: [],
                  type: 'info',
                  title: '',
                  message: '',
                  actionUrl: '',
                  priority: 'normal',
                });
              } catch (error) {
                console.error('Error sending notification:', error);
                alert('Failed to send notification. Please try again.');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                To Users (select multiple)
              </label>
              <select
                multiple
                value={notificationForm.userIds}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setNotificationForm({ ...notificationForm, userIds: selected });
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white min-h-[100px]"
                required
              >
                {users.map((u) => (
                  <option key={u._id || u.id} value={u._id || u.id}>
                    {u.email} {u.profile?.name ? `(${u.profile.name})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Hold Ctrl/Cmd to select multiple users</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type
              </label>
              <select
                value={notificationForm.type}
                onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Message *
              </label>
              <textarea
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                rows={4}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Action URL (optional)
              </label>
              <input
                type="url"
                value={notificationForm.actionUrl}
                onChange={(e) => setNotificationForm({ ...notificationForm, actionUrl: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                placeholder="/dashboard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Priority
              </label>
              <select
                value={notificationForm.priority}
                onChange={(e) => setNotificationForm({ ...notificationForm, priority: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" icon={Bell}>
                Send Notification
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsNotificationModalOpen(false);
                  setNotificationForm({
                    userIds: [],
                    type: 'info',
                    title: '',
                    message: '',
                    actionUrl: '',
                    priority: 'normal',
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create/Edit App Version Modal */}
      <Modal
        isOpen={isVersionModalOpen}
        onClose={() => {
          setIsVersionModalOpen(false);
          setEditingVersion(null);
          setVersionForm({
            version: '',
            platform: 'web',
            buildNumber: '',
            releaseNotes: '',
            downloadUrl: '',
            manifestUrl: '',
            isRequired: false,
            isActive: true,
            minSupportedVersion: '',
            updateSize: 0,
          });
        }}
        title={editingVersion ? 'Edit App Version' : 'Create App Version'}
      >
        <form onSubmit={handleCreateVersion} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Platform</label>
              <select
                value={versionForm.platform}
                onChange={(e) => setVersionForm({ ...versionForm, platform: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              >
                <option value="ios">iOS</option>
                <option value="android">Android</option>
                <option value="web">Web</option>
              </select>
            </div>
            <Input
              type="text"
              label="Version (e.g., 1.0.0)"
              value={versionForm.version}
              onChange={(e) => setVersionForm({ ...versionForm, version: e.target.value })}
              required
            />
          </div>

          <Input
            type="text"
            label="Build Number"
            value={versionForm.buildNumber}
            onChange={(e) => setVersionForm({ ...versionForm, buildNumber: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Release Notes</label>
            <textarea
              value={versionForm.releaseNotes}
              onChange={(e) => setVersionForm({ ...versionForm, releaseNotes: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              rows={4}
              placeholder="What's new in this version..."
            />
          </div>

          <Input
            type="url"
            label="Download URL (for native apps)"
            value={versionForm.downloadUrl}
            onChange={(e) => setVersionForm({ ...versionForm, downloadUrl: e.target.value })}
            placeholder="https://example.com/app.apk"
          />

          <Input
            type="url"
            label="Manifest URL (for Live Updates)"
            value={versionForm.manifestUrl}
            onChange={(e) => setVersionForm({ ...versionForm, manifestUrl: e.target.value })}
            placeholder="https://example.com/manifest.json"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              label="Minimum Supported Version"
              value={versionForm.minSupportedVersion}
              onChange={(e) => setVersionForm({ ...versionForm, minSupportedVersion: e.target.value })}
              placeholder="1.0.0"
            />
            <Input
              type="number"
              label="Update Size (bytes)"
              value={versionForm.updateSize}
              onChange={(e) => setVersionForm({ ...versionForm, updateSize: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={versionForm.isRequired}
                onChange={(e) => setVersionForm({ ...versionForm, isRequired: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-300">Required Update</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={versionForm.isActive}
                onChange={(e) => setVersionForm({ ...versionForm, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-300">Active</span>
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" variant="primary" className="flex-1" icon={Save}>
              {editingVersion ? 'Update Version' : 'Create Version'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsVersionModalOpen(false);
                setEditingVersion(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create/Edit Plan Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => {
          setIsPlanModalOpen(false);
          setEditingPlan(null);
          setPlanForm({
            name: '',
            slug: '',
            description: '',
            price: { monthly: 0, yearly: 0 },
            currency: 'EGP',
            features: [],
            limits: {
              clients: null,
              incomeEntries: null,
              expenseEntries: null,
              invoices: null,
              storage: null,
              apiCalls: null,
            },
                isActive: true,
                isDefault: false,
                isHighlighted: false,
                trialDays: 0,
                sortOrder: 0,
              });
            }}
            title={editingPlan ? 'Edit Plan' : 'Create Plan'}
      >
        <form onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan} className="space-y-4">
          <Input
            type="text"
            label="Plan Name"
            value={planForm.name}
            onChange={(e) => {
              const name = e.target.value;
              setPlanForm({
                ...planForm,
                name,
                slug: planForm.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
              });
            }}
            required
          />
          <Input
            type="text"
            label="Slug (URL-friendly identifier)"
            value={planForm.slug}
            onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Monthly Price</label>
              <Input
                type="number"
                value={planForm.price.monthly}
                onChange={(e) => setPlanForm({
                  ...planForm,
                  price: { ...planForm.price, monthly: parseFloat(e.target.value) || 0 },
                })}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Yearly Price</label>
              <Input
                type="number"
                value={planForm.price.yearly}
                onChange={(e) => setPlanForm({
                  ...planForm,
                  price: { ...planForm.price, yearly: parseFloat(e.target.value) || 0 },
                })}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
              <select
                value={planForm.currency}
                onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="EGP">EGP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Trial Days</label>
              <Input
                type="number"
                value={planForm.trialDays}
                onChange={(e) => setPlanForm({ ...planForm, trialDays: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Clients Limit (leave empty for unlimited)</label>
              <Input
                type="number"
                value={planForm.limits.clients === null ? '' : planForm.limits.clients}
                onChange={(e) => setPlanForm({
                  ...planForm,
                  limits: {
                    ...planForm.limits,
                    clients: e.target.value === '' ? null : parseInt(e.target.value),
                  },
                })}
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Storage (MB, leave empty for unlimited)</label>
              <Input
                type="number"
                value={planForm.limits.storage === null ? '' : planForm.limits.storage}
                onChange={(e) => setPlanForm({
                  ...planForm,
                  limits: {
                    ...planForm.limits,
                    storage: e.target.value === '' ? null : parseInt(e.target.value),
                  },
                })}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={planForm.isActive}
                  onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-slate-300">Active</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={planForm.isDefault}
                  onChange={(e) => setPlanForm({ ...planForm, isDefault: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-slate-300">Default Plan</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={planForm.isHighlighted}
                  onChange={(e) => setPlanForm({ ...planForm, isHighlighted: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-slate-300 flex items-center gap-1">
                  <Star size={14} className={planForm.isHighlighted ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'} />
                  Highlight/Featured
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Sort Order</label>
            <Input
              type="number"
              value={planForm.sortOrder}
              onChange={(e) => setPlanForm({ ...planForm, sortOrder: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsPlanModalOpen(false);
                setEditingPlan(null);
                setPlanForm({
                  name: '',
                  slug: '',
                  description: '',
                  price: { monthly: 0, yearly: 0 },
                  currency: 'EGP',
                  features: [],
                  limits: {
                    clients: null,
                    incomeEntries: null,
                    expenseEntries: null,
                    invoices: null,
                    storage: null,
                    apiCalls: null,
                  },
                  isActive: true,
                  isDefault: false,
                  isHighlighted: false,
                  trialDays: 0,
                  sortOrder: 0,
                });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" icon={Save}>
              {editingPlan ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
