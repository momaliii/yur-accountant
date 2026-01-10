import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, CheckCircle2, XCircle, Loader2, Database, Cloud } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { backupDB } from '../services/db/database';
import migrationAPI from '../services/api/migration';
import { useAuthStore } from '../stores/authStore';

export default function Migration() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [error, setError] = useState('');
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

  const handleUpload = async () => {
    setIsUploading(true);
    setError('');
    setMigrationResult(null);

    try {
      const data = await backupDB.exportAll();
      const result = await migrationAPI.upload(data);
      setMigrationResult(result);
    } catch (error) {
      setError('Migration failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
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
          <h2 className="text-xl font-semibold">Export Data</h2>
        </div>
        <p className="text-slate-400 mb-4">
          Download a backup of your local data as a JSON file. This is recommended before migration.
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

      {/* Upload/Migrate Section */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Cloud className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-semibold">Migrate to Cloud</h2>
        </div>
        <p className="text-slate-400 mb-4">
          Upload your local data to MongoDB. Your data will be safely imported and associated with your account.
        </p>
        <Button
          onClick={handleUpload}
          loading={isUploading}
          icon={Upload}
          variant="primary"
        >
          Migrate to Cloud
        </Button>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/10">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </Card>
      )}

      {/* Migration Result */}
      {migrationResult && (
        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-semibold text-emerald-400">Migration Complete</h2>
          </div>

          {migrationResult.summary && (
            <div className="mb-4">
              <p className="text-slate-300 mb-2">
                <strong>Total Imported:</strong> {migrationResult.summary.imported} items
              </p>
              {migrationResult.summary.errors > 0 && (
                <p className="text-amber-400">
                  <strong>Errors:</strong> {migrationResult.summary.errors} items
                </p>
              )}
            </div>
          )}

          {migrationResult.details && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-300">Details:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {Object.entries(migrationResult.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-slate-200">
                      {value.imported || 0}
                      {value.errors?.length > 0 && (
                        <span className="text-amber-400 ml-1">
                          ({value.errors.length} errors)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Error Details */}
              {migrationResult.summary?.errors > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <h3 className="font-semibold text-amber-400 mb-3">Error Details:</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {Object.entries(migrationResult.details).map(([key, value]) => {
                      if (!value.errors || value.errors.length === 0) return null;
                      return (
                        <div key={key} className="bg-slate-800/50 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-slate-300 mb-2 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </h4>
                          <div className="space-y-1">
                            {value.errors.map((error, idx) => (
                              <div key={idx} className="text-xs text-amber-400/80">
                                <span className="text-slate-500">
                                  {error.id ? `ID: ${error.id} - ` : ''}
                                </span>
                                <span>{error.error || 'Unknown error'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-slate-500 text-xs mt-3">
                    Note: Items with errors were skipped. You can try migrating again after fixing the data, or manually add these items.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-slate-400 text-sm">
              {migrationResult.summary?.errors > 0 
                ? `${migrationResult.summary.imported} items were successfully migrated. ${migrationResult.summary.errors} items had errors (see details above).`
                : 'Your data has been successfully migrated to the cloud. You can now access it from any device.'
              }
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
