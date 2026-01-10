import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/ui/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Debts from './pages/Debts';
import Goals from './pages/Goals';
import Savings from './pages/Savings';
import ToDoList from './pages/ToDoList';
import Reports from './pages/Reports';
import TaxReports from './pages/TaxReports';
import Invoices from './pages/Invoices';
import AIChat from './pages/AIChat';
import Settings from './pages/Settings';
import HelpCenter from './pages/HelpCenter';
import { useDataStore, useSettingsStore } from './stores/useStore';
import currencyService from './services/currency/currencyService';

export default function App() {
  const { initializeData } = useDataStore();
  const { exchangeRates, setExchangeRates, lastRateUpdate } = useSettingsStore();

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
  }, [initializeData, exchangeRates, lastRateUpdate, setExchangeRates]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="income" element={<Income />} />
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
          <Route path="help" element={<HelpCenter />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
