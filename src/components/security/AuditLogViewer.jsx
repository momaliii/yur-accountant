import { useState, useEffect } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import securityService from '../../services/api/security';

const severityColors = {
  low: 'text-blue-400 bg-blue-500/20',
  medium: 'text-yellow-400 bg-yellow-500/20',
  high: 'text-orange-400 bg-orange-500/20',
  critical: 'text-red-400 bg-red-500/20',
};

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    severity: '',
  });

  useEffect(() => {
    loadLogs();
  }, [page, filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await securityService.getAuditLogs(page, 50, filters);
      setLogs(response.logs || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Action', 'Resource Type', 'Severity', 'IP Address', 'User Agent'].join(','),
      ...logs.map((log) =>
        [
          formatDate(log.timestamp),
          log.action,
          log.resourceType,
          log.severity,
          log.ipAddress || '',
          (log.userAgent || '').replace(/,/g, ';'),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Audit Logs</h3>
        <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Input
          type="text"
          placeholder="Filter by action..."
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          icon={Search}
        />
        <select
          value={filters.severity}
          onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading logs...</div>
      ) : logs.length === 0 ? (
        <p className="text-slate-400 text-sm">No audit logs found</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Timestamp</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Action</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Resource</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Severity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-sm text-slate-300">{formatDate(log.timestamp)}</td>
                    <td className="py-3 px-4 text-sm text-white">{log.action}</td>
                    <td className="py-3 px-4 text-sm text-slate-300">
                      {log.resourceType}
                      {log.resourceId && ` (${log.resourceId})`}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${severityColors[log.severity] || severityColors.low}`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400">{log.ipAddress || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 50 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
              <div className="text-sm text-slate-400">
                Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, total)} of {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 50 >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
