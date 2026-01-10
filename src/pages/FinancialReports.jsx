import { useState, useMemo } from 'react';
import { Download, FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useDataStore } from '../stores/useStore';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function FinancialReports() {
  const { income, expenses, clients } = useDataStore();
  const [reportType, setReportType] = useState('pl');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const filteredData = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59);

    const filteredIncome = income.filter(i => {
      const date = new Date(i.receivedDate);
      return date >= start && date <= end;
    });

    const filteredExpenses = expenses.filter(e => {
      const date = new Date(e.date);
      return date >= start && date <= end;
    });

    return { income: filteredIncome, expenses: filteredExpenses };
  }, [income, expenses, dateRange]);

  const calculatePL = () => {
    const totalIncome = filteredData.income.reduce((sum, i) => sum + (i.netAmount || i.amount || 0), 0);
    const totalExpenses = filteredData.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      grossProfit: totalIncome,
    };
  };

  const calculateCashFlow = () => {
    const cashIn = filteredData.income.reduce((sum, i) => sum + (i.netAmount || i.amount || 0), 0);
    const cashOut = filteredData.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netCashFlow = cashIn - cashOut;

    return {
      cashIn,
      cashOut,
      netCashFlow,
    };
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pl = calculatePL();
    const cashFlow = calculateCashFlow();

    // Title
    doc.setFontSize(20);
    doc.text('Financial Report', 14, 20);

    // Date range
    doc.setFontSize(12);
    doc.text(
      `Period: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`,
      14,
      30
    );

    let yPos = 40;

    if (reportType === 'pl') {
      // Profit & Loss
      doc.setFontSize(16);
      doc.text('Profit & Loss Statement', 14, yPos);
      yPos += 10;

      doc.autoTable({
        startY: yPos,
        head: [['Item', 'Amount (EGP)']],
        body: [
          ['Total Income', pl.totalIncome.toFixed(2)],
          ['Total Expenses', pl.totalExpenses.toFixed(2)],
          ['Net Profit', pl.netProfit.toFixed(2)],
        ],
        theme: 'dark',
        headStyles: { fillColor: [99, 102, 241] },
      });
    } else if (reportType === 'cashflow') {
      // Cash Flow
      doc.setFontSize(16);
      doc.text('Cash Flow Statement', 14, yPos);
      yPos += 10;

      doc.autoTable({
        startY: yPos,
        head: [['Item', 'Amount (EGP)']],
        body: [
          ['Cash In', cashFlow.cashIn.toFixed(2)],
          ['Cash Out', cashFlow.cashOut.toFixed(2)],
          ['Net Cash Flow', cashFlow.netCashFlow.toFixed(2)],
        ],
        theme: 'dark',
        headStyles: { fillColor: [99, 102, 241] },
      });
    } else {
      // Balance Sheet (simplified)
      doc.setFontSize(16);
      doc.text('Balance Sheet', 14, yPos);
      yPos += 10;

      const assets = pl.totalIncome;
      const liabilities = pl.totalExpenses;
      const equity = pl.netProfit;

      doc.autoTable({
        startY: yPos,
        head: [['Item', 'Amount (EGP)']],
        body: [
          ['Assets', assets.toFixed(2)],
          ['Liabilities', liabilities.toFixed(2)],
          ['Equity', equity.toFixed(2)],
        ],
        theme: 'dark',
        headStyles: { fillColor: [99, 102, 241] },
      });
    }

    // Save PDF
    doc.save(`financial-report-${reportType}-${dateRange.start}-${dateRange.end}.pdf`);
  };

  const pl = calculatePL();
  const cashFlow = calculateCashFlow();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Financial Reports
          </h1>
          <p className="text-slate-400 mt-1">Generate comprehensive financial reports</p>
        </div>
        <Button onClick={generatePDF} icon={Download}>
          Export PDF
        </Button>
      </div>

      {/* Report Type Selection */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="pl">Profit & Loss</option>
              <option value="cashflow">Cash Flow</option>
              <option value="balance">Balance Sheet</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </Card>

      {/* Report Display */}
      {reportType === 'pl' && (
        <Card>
          <h2 className="text-2xl font-semibold mb-6">Profit & Loss Statement</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-green-400" />
                <span className="text-lg font-medium">Total Income</span>
              </div>
              <span className="text-2xl font-bold text-green-400">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'EGP',
                }).format(pl.totalIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-3">
                <TrendingDown className="text-red-400" />
                <span className="text-lg font-medium">Total Expenses</span>
              </div>
              <span className="text-2xl font-bold text-red-400">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'EGP',
                }).format(pl.totalExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <div className="flex items-center gap-3">
                <DollarSign className="text-indigo-400" />
                <span className="text-lg font-medium">Net Profit</span>
              </div>
              <span className={`text-2xl font-bold ${pl.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'EGP',
                }).format(pl.netProfit)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {reportType === 'cashflow' && (
        <Card>
          <h2 className="text-2xl font-semibold mb-6">Cash Flow Statement</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <span className="text-lg font-medium">Cash In</span>
              <span className="text-2xl font-bold text-green-400">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'EGP',
                }).format(cashFlow.cashIn)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <span className="text-lg font-medium">Cash Out</span>
              <span className="text-2xl font-bold text-red-400">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'EGP',
                }).format(cashFlow.cashOut)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <span className="text-lg font-medium">Net Cash Flow</span>
              <span className={`text-2xl font-bold ${cashFlow.netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'EGP',
                }).format(cashFlow.netCashFlow)}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
