import { useEffect, useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/ui/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import UpdateChecker from './components/UpdateChecker';
import { useDataStore, useSettingsStore } from './stores/useStore';
import { useAuthStore } from './stores/authStore';
import currencyService from './services/currency/currencyService';

// Lazy load heavy components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const Income = lazy(() => import('./pages/Income'));
const ExpectedIncome = lazy(() => import('./pages/ExpectedIncome'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Debts = lazy(() => import('./pages/Debts'));
const Goals = lazy(() => import('./pages/Goals'));
const Savings = lazy(() => import('./pages/Savings'));
const ToDoList = lazy(() => import('./pages/ToDoList'));
const Reports = lazy(() => import('./pages/Reports'));
const TaxReports = lazy(() => import('./pages/TaxReports'));
const Invoices = lazy(() => import('./pages/Invoices'));
const AIChat = lazy(() => import('./pages/AIChat'));
const Settings = lazy(() => import('./pages/Settings'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const Migration = lazy(() => import('./pages/Migration'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Home = lazy(() => import('./pages/Home'));
const FinancialDashboard = lazy(() => import('./pages/FinancialDashboard'));
const FinancialReports = lazy(() => import('./pages/FinancialReports'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Messages = lazy(() => import('./pages/Messages'));
const Tickets = lazy(() => import('./pages/Tickets'));
const Announcements = lazy(() => import('./pages/Announcements'));
const Webhooks = lazy(() => import('./pages/Webhooks'));
const APIKeys = lazy(() => import('./pages/APIKeys'));
const Security = lazy(() => import('./pages/Security'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const Landing = lazy(() => import('./pages/Landing'));
const Pricing = lazy(() => import('./pages/Pricing'));
const About = lazy(() => import('./pages/About'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

export default function App() {
  const { initializeData, processRecurringExpenses, cleanupDuplicateExpenses } = useDataStore();
  const { exchangeRates, setExchangeRates, lastRateUpdate, hasSeenOnboarding } = useSettingsStore();
  const { initialize: initializeAuth } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(!hasSeenOnboarding);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Check if running in Electron
    const isElectron = !!(window.electron || (typeof window !== 'undefined' && window.process && window.process.type === 'renderer'));
    
    // Check if running in Capacitor (mobile)
    const isCapacitor = !!(typeof window !== 'undefined' && window.Capacitor);
    
    // Initialize data and wait for completion
    const initApp = async () => {
      try {
        // Initialize database
        console.log('Initializing database...');
        await initializeData();
        console.log('Database initialized successfully');
        
        // Clean up any duplicate expenses first
        console.log('Cleaning up duplicate expenses...');
        await cleanupDuplicateExpenses();
        
        // Process recurring expenses to auto-create monthly entries
        console.log('Processing recurring expenses...');
        await processRecurringExpenses();
        
        // Load exchange rates if not already loaded or if older than 24 hours
        const shouldUpdateRates = 
          Object.keys(exchangeRates).length === 0 || 
          !lastRateUpdate || 
          (new Date().getTime() - new Date(lastRateUpdate).getTime()) > 24 * 60 * 60 * 1000;
        
        if (shouldUpdateRates) {
          await currencyService.getExchangeRates('USD').then((rates) => {
            setExchangeRates(rates);
          }).catch((error) => {
            console.error('Failed to load exchange rates:', error);
          });
        }
        
        // Small delay to ensure everything is rendered
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Notify Electron that app is ready (if running in Electron)
        if (isElectron) {
          try {
            // Try to use window.electron API (if exposed via preload)
            if (window.electron && typeof window.electron.send === 'function') {
              window.electron.send('app-ready');
              console.log('App-ready signal sent via window.electron');
            } else if (typeof window !== 'undefined' && window.require) {
              // Fallback to direct require (if contextIsolation is disabled)
              try {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.send('app-ready');
                console.log('App-ready signal sent via ipcRenderer');
              } catch (e) {
                console.warn('Could not send app-ready signal:', e);
              }
            } else {
              console.warn('Electron IPC not available');
            }
          } catch (error) {
            console.error('Error sending app-ready signal:', error);
          }
        }
        
        // Handle mobile app lifecycle (Capacitor)
        if (isCapacitor && window.Capacitor?.Plugins?.App) {
          const { App } = window.Capacitor.Plugins;
          
          // Handle app state changes
          App.addListener('appStateChange', ({ isActive }) => {
            console.log('App state changed. Is active?', isActive);
          });
          
          // Handle back button on Android
          if (window.Capacitor.getPlatform() === 'android') {
            App.addListener('backButton', ({ canGoBack }) => {
              if (!canGoBack) {
                App.exitApp();
              } else {
                window.history.back();
              }
            });
          }
        }
      } catch (error) {
        console.error('Initialization error:', error);
        console.error('Error details:', error.stack);
        // Still notify ready even if there's an error
        if (isElectron) {
          try {
            if (window.electron && typeof window.electron.send === 'function') {
              window.electron.send('app-ready');
            } else if (typeof window !== 'undefined' && window.require) {
              try {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.send('app-ready');
              } catch (e) {
                console.warn('Could not send app-ready signal after error:', e);
              }
            }
          } catch (e) {
            console.error('Error sending app-ready signal after initialization error:', e);
          }
        }
      }
    };
    
    initApp();
  }, [initializeData, processRecurringExpenses, cleanupDuplicateExpenses, exchangeRates, lastRateUpdate, setExchangeRates]);

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <HashRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Protected routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="home" element={<Home />} />
            <Route path="profile" element={<Profile />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="income" element={<Income />} />
            <Route path="expected-income" element={<ExpectedIncome />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="debts" element={<Debts />} />
            <Route path="goals" element={<Goals />} />
            <Route path="savings" element={<Savings />} />
            <Route path="todos" element={<ToDoList />} />
            <Route path="reports" element={<Reports />} />
            <Route path="tax-reports" element={<TaxReports />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="ai-chat" element={<AIChat />} />
            <Route path="settings" element={<Settings />} />
            <Route path="security" element={<Security />} />
          <Route path="migration" element={<Migration />} />
          <Route path="help" element={<HelpCenter />} />
          <Route path="financial" element={<FinancialDashboard />} />
          <Route path="financial-reports" element={<FinancialReports />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="messages" element={<Messages />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="announcements" element={<Announcements />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="webhooks"
            element={
              <ProtectedRoute requireAdmin>
                <Webhooks />
              </ProtectedRoute>
            }
          />
          <Route
            path="api-keys"
            element={
              <ProtectedRoute requireAdmin>
                <APIKeys />
              </ProtectedRoute>
            }
          />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
