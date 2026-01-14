import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, CheckCircle2, XCircle, Database, Trash2, FileUp } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { backupDB, clientsDB, incomeDB, expensesDB } from '../services/db/database';
import { useAuthStore } from '../stores/authStore';
import { useDataStore } from '../stores/useStore';

export default function Migration() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { initializeData } = useDataStore();
  const fileInputRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [localDataStats, setLocalDataStats] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    loadLocalDataStats();
  }, []);

  const loadLocalDataStats = async () => {
    try {
      const data = await backupDB.exportAll();
      setLocalDataStats({
        clients: data.clients?.length || 0,
        income: data.income?.length || 0,
        expenses: data.expenses?.length || 0,
        debts: data.debts?.length || 0,
        goals: data.goals?.length || 0,
        invoices: data.invoices?.length || 0,
        todos: data.todos?.length || 0,
        lists: data.lists?.length || 0,
        savings: data.savings?.length || 0,
        savingsTransactions: data.savingsTransactions?.length || 0,
        openingBalances: data.openingBalances?.length || 0,
        expectedIncome: data.expectedIncome?.length || 0,
      });
    } catch (error) {
      console.error('Error loading local data stats:', error);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError('');

    try {
      const data = await backupDB.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yur-finance-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to export data: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };


  const handleDeleteAll = async () => {
    if (!window.confirm('⚠️ WARNING: This will delete ALL local data!\n\nThis action cannot be undone. Make sure you have exported a backup first.\n\nAre you sure you want to continue?')) {
      return;
    }

    if (!window.confirm('⚠️ FINAL CONFIRMATION: Delete ALL local data?\n\nThis will permanently delete all your local data. Only proceed if you have a backup or have migrated to cloud.\n\nDelete all data?')) {
      return;
    }

    setIsDeleting(true);
    setError('');
    setSuccess('');

    try {
      // Clear sync flag to prevent auto-sync after deletion
      localStorage.removeItem('lastSyncTime');
      localStorage.setItem('skipAutoSync', 'true');
      
      // Delete all data
      await backupDB.clearAll();
      
      // Clear the store state
      setSuccess('All local data has been deleted successfully. Refreshing page...');
      
      // Wait a moment then reload to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setError('Failed to delete data: ' + error.message);
      setIsDeleting(false);
    }
  };

  const handleRestore = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setError('');
    setSuccess('');

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate backup format
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid backup file format');
      }

      console.log('Restoring backup with data:', {
        clients: data.clients?.length || 0,
        income: data.income?.length || 0,
        expenses: data.expenses?.length || 0,
        debts: data.debts?.length || 0,
        goals: data.goals?.length || 0,
        savings: data.savings?.length || 0,
        expectedIncome: data.expectedIncome?.length || 0,
      });

      // Import the backup data
      const importResult = await backupDB.importAll(data);
      console.log('Backup import result:', importResult);
      
      // Wait a bit to ensure IndexedDB transaction is fully committed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify data was imported by checking IndexedDB
      const importedClients = await clientsDB.getAll();
      const importedIncome = await incomeDB.getAll();
      const importedExpenses = await expensesDB.getAll();
      
      console.log('Verification after import:', {
        clients: importedClients.length,
        income: importedIncome.length,
        expenses: importedExpenses.length,
      });
      
      if (importedClients.length === 0 && importedIncome.length === 0 && importedExpenses.length === 0) {
        throw new Error('Import completed but no data was found in database. Please check the backup file format.');
      }
      
      setSuccess('Backup restored successfully! Refreshing data...');
      
      // Reload data stats and refresh store
      await loadLocalDataStats();
      await initializeData();
      
      // Verify data is in store
      const storeData = useDataStore.getState();
      console.log('Store data after initialize:', {
        clients: storeData.clients.length,
        income: storeData.income.length,
        expenses: storeData.expenses.length,
      });
      
      // Show success message and reload page to ensure data is displayed
      setSuccess(`Backup restored successfully! Imported: ${importedClients.length} clients, ${importedIncome.length} income records, ${importedExpenses.length} expenses. Reloading page...`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Restore error:', error);
      setError('Failed to restore backup: ' + (error.message || 'Unknown error'));
    } finally {
      setIsRestoring(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };


  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Data Migration
        </h1>
        <p className="text-slate-400 mt-1">Migrate your local data to the cloud</p>
      </div>

      {/* Local Data Stats */}
      {localDataStats && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-semibold">Local Data</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(localDataStats).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-indigo-400">{value}</div>
                <div className="text-sm text-slate-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Export Section */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-semibold">Export Backup</h2>
        </div>
        <p className="text-slate-400 mb-4">
          Download a backup of your local data as a JSON file. This is recommended before deleting data or migrating.
        </p>
        <Button
          onClick={handleExport}
          loading={isExporting}
          icon={Download}
          variant="outline"
        >
          Export to JSON
        </Button>
      </Card>

      {/* Restore from Backup Section */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <FileUp className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold">Restore from Backup</h2>
        </div>
        <p className="text-slate-400 mb-4">
          Restore your data from a previously exported backup file. This will replace all current local data.
        </p>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleRestore}
            className="hidden"
            disabled={isRestoring}
          />
          <Button
            type="button"
            loading={isRestoring}
            icon={FileUp}
            variant="outline"
            disabled={isRestoring}
            onClick={() => {
              if (fileInputRef.current && !isRestoring) {
                fileInputRef.current.click();
              }
            }}
          >
            {isRestoring ? 'Restoring...' : 'Choose Backup File'}
          </Button>
        </div>
        {success && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
      </Card>

      {/* Delete All Local Data Section */}
      <Card className="border-red-500/30 bg-red-500/5">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-6 h-6 text-red-400" />
          <h2 className="text-xl font-semibold text-red-400">Delete All Local Data</h2>
        </div>
        <p className="text-slate-400 mb-4">
          <strong className="text-red-400">⚠️ WARNING:</strong> This will permanently delete all local data from your browser (IndexedDB). 
          This action cannot be undone. Make sure you have exported a backup or migrated to cloud first.
        </p>
        <Button
          onClick={handleDeleteAll}
          loading={isDeleting}
          icon={Trash2}
          variant="outline"
          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
        >
          Delete All Local Data
        </Button>
      </Card>

      {/* Success/Error Display */}
      {success && (
        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="text-emerald-400">{success}</p>
          </div>
        </Card>
      )}

      {error && (
        <Card className="border-red-500/30 bg-red-500/10">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
