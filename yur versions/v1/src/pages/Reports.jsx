import { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  PieChart,
  Eye,
  EyeOff,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { useDataStore, useSettingsStore } from '../stores/useStore';
import { PrivacyValue } from '../components/ui/PrivacyBlur';
import currencyService from '../services/currency/currencyService';

export default function Reports() {
  const { clients, income, expenses } = useDataStore();
  const { baseCurrency, exchangeRates, privacyMode, setPrivacyMode } = useSettingsStore();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set();
    income.forEach((i) => years.add(new Date(i.receivedDate).getFullYear()));
    expenses.forEach((e) => years.add(new Date(e.date).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [income, expenses]);

  // Monthly data for charts
  const monthlyData = useMemo(() => {
    const months = [];
    
    // If a specific month is selected, only show that month
    if (selectedMonth !== null) {
      const i = selectedMonth;
      const monthIncome = income
        .filter((item) => {
          const d = new Date(item.receivedDate);
          return d.getFullYear() === selectedYear && d.getMonth() === i;
        })
        .reduce((sum, item) => {
          const amount = item.netAmount || item.amount;
          const converted = currencyService.convert(amount, item.currency || baseCurrency, baseCurrency, exchangeRates);
          return sum + converted;
        }, 0);

      const monthExpenses = expenses
        .filter((item) => {
          const d = new Date(item.date);
          return d.getFullYear() === selectedYear && d.getMonth() === i;
        })
        .reduce((sum, item) => {
          const converted = currencyService.convert(item.amount, item.currency || baseCurrency, baseCurrency, exchangeRates);
          return sum + converted;
        }, 0);

      const monthName = new Date(selectedYear, i, 1).toLocaleDateString('en-US', {
        month: 'short',
      });

      months.push({
        name: monthName,
        income: monthIncome,
        expenses: monthExpenses,
        profit: monthIncome - monthExpenses,
      });
      
      return months;
    }
    
    // Otherwise, use quarter or full year logic
    const startMonth = selectedQuarter ? (selectedQuarter - 1) * 3 : 0;
    const endMonth = selectedQuarter ? selectedQuarter * 3 : 12;

    for (let i = startMonth; i < endMonth; i++) {
      const monthIncome = income
        .filter((item) => {
          const d = new Date(item.receivedDate);
          return d.getFullYear() === selectedYear && d.getMonth() === i;
        })
        .reduce((sum, item) => {
          const amount = item.netAmount || item.amount;
          const converted = currencyService.convert(amount, item.currency || baseCurrency, baseCurrency, exchangeRates);
          return sum + converted;
        }, 0);

      const monthExpenses = expenses
        .filter((item) => {
          const d = new Date(item.date);
          return d.getFullYear() === selectedYear && d.getMonth() === i;
        })
        .reduce((sum, item) => {
          const converted = currencyService.convert(item.amount, item.currency || baseCurrency, baseCurrency, exchangeRates);
          return sum + converted;
        }, 0);

      const monthName = new Date(selectedYear, i, 1).toLocaleDateString('en-US', {
        month: 'short',
      });

      months.push({
        name: monthName,
        income: monthIncome,
        expenses: monthExpenses,
        profit: monthIncome - monthExpenses,
      });
    }
    return months;
  }, [income, expenses, selectedYear, selectedQuarter, selectedMonth, baseCurrency, exchangeRates]);

  // Per-client breakdown
  const clientBreakdown = useMemo(() => {
    const breakdown = {};

    clients.forEach((client) => {
      breakdown[client.id] = {
        name: client.name,
        income: 0,
        expenses: 0,
        profit: 0,
      };
    });

    income.forEach((i) => {
      const d = new Date(i.receivedDate);
      if (d.getFullYear() !== selectedYear) return;
      if (selectedMonth !== null) {
        if (d.getMonth() !== selectedMonth) return;
      } else if (selectedQuarter) {
        const quarter = Math.floor(d.getMonth() / 3) + 1;
        if (quarter !== selectedQuarter) return;
      }
      if (i.clientId && breakdown[i.clientId]) {
        const amount = i.netAmount || i.amount;
        const converted = currencyService.convert(amount, i.currency || baseCurrency, baseCurrency, exchangeRates);
        breakdown[i.clientId].income += converted;
      }
    });

    expenses.forEach((e) => {
      const d = new Date(e.date);
      if (d.getFullYear() !== selectedYear) return;
      if (selectedMonth !== null) {
        if (d.getMonth() !== selectedMonth) return;
      } else if (selectedQuarter) {
        const quarter = Math.floor(d.getMonth() / 3) + 1;
        if (quarter !== selectedQuarter) return;
      }
      if (e.clientId && breakdown[e.clientId]) {
        const converted = currencyService.convert(e.amount, e.currency || baseCurrency, baseCurrency, exchangeRates);
        breakdown[e.clientId].expenses += converted;
      }
    });

    return Object.values(breakdown)
      .map((c) => ({
        ...c,
        profit: c.income - c.expenses,
      }))
      .filter((c) => c.income > 0 || c.expenses > 0)
      .sort((a, b) => b.income - a.income);
  }, [clients, income, expenses, selectedYear, selectedQuarter, selectedMonth, baseCurrency, exchangeRates]);

  // Totals
  const totals = useMemo(() => {
    return monthlyData.reduce(
      (acc, month) => ({
        income: acc.income + month.income,
        expenses: acc.expenses + month.expenses,
        profit: acc.profit + month.profit,
      }),
      { income: 0, expenses: 0, profit: 0 }
    );
  }, [monthlyData]);

  // Expense by category
  const expensesByCategory = useMemo(() => {
    const categories = {};

    expenses.forEach((e) => {
      const d = new Date(e.date);
      if (d.getFullYear() !== selectedYear) return;
      if (selectedMonth !== null) {
        if (d.getMonth() !== selectedMonth) return;
      } else if (selectedQuarter) {
        const quarter = Math.floor(d.getMonth() / 3) + 1;
        if (quarter !== selectedQuarter) return;
      }
      const cat = e.category || 'Other';
      const converted = currencyService.convert(e.amount, e.currency || baseCurrency, baseCurrency, exchangeRates);
      categories[cat] = (categories[cat] || 0) + converted;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, selectedYear, selectedQuarter, baseCurrency, exchangeRates]);

  const formatCurrency = (amount) => currencyService.formatCurrency(amount, baseCurrency);

  const handleExportReport = () => {
    const period = selectedMonth !== null
      ? new Date(selectedYear, selectedMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : selectedQuarter
      ? `Q${selectedQuarter} ${selectedYear}`
      : `Year ${selectedYear}`;

    // Create PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Colors
    const primaryColor = [99, 102, 241]; // Indigo
    const successColor = [16, 185, 129]; // Emerald
    const dangerColor = [239, 68, 68]; // Red
    const textColor = [51, 65, 85]; // Slate

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('YUR Finance', 20, 25);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Financial Report', 20, 35);

    // Period
    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.text(`Period: ${period}`, pageWidth - 20, 25, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 20, 35, { align: 'right' });

    yPosition = 50;

    // Summary Section
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.text('Financial Summary', 20, yPosition);
    yPosition += 10;

    // Summary Table
    const summaryData = [
      ['Total Income', formatCurrency(totals.income)],
      ['Total Expenses', formatCurrency(totals.expenses)],
      ['Net Profit', formatCurrency(totals.profit)],
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Category', 'Amount']],
      body: summaryData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: textColor,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      styles: {
        cellPadding: 5,
        fontSize: 11,
      },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60, halign: 'right' },
      },
    });

    yPosition = doc.lastAutoTable.finalY + 20;

    // Monthly Data Section
    if (monthlyData.length > 0) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Breakdown', 20, yPosition);
      yPosition += 10;

      const monthlyTableData = monthlyData.map(month => [
        month.name,
        formatCurrency(month.income),
        formatCurrency(month.expenses),
        formatCurrency(month.profit),
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Month', 'Income', 'Expenses', 'Profit']],
        body: monthlyTableData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        bodyStyles: {
          textColor: textColor,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        styles: {
          cellPadding: 5,
          fontSize: 10,
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 45, halign: 'right' },
          2: { cellWidth: 45, halign: 'right' },
          3: { cellWidth: 45, halign: 'right' },
        },
      });

      yPosition = doc.lastAutoTable.finalY + 20;
    }

    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    // Client Breakdown Section
    if (clientBreakdown.length > 0) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Client Performance', 20, yPosition);
      yPosition += 10;

      const clientTableData = clientBreakdown.slice(0, 10).map(client => [
        client.name,
        formatCurrency(client.income),
        formatCurrency(client.expenses),
        formatCurrency(client.profit),
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Client', 'Income', 'Expenses', 'Profit']],
        body: clientTableData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        bodyStyles: {
          textColor: textColor,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        styles: {
          cellPadding: 5,
          fontSize: 10,
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' },
        },
      });

      yPosition = doc.lastAutoTable.finalY + 20;
    }

    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    // Expense Categories Section
    if (expensesByCategory.length > 0) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Expenses by Category', 20, yPosition);
      yPosition += 10;

      const categoryTableData = expensesByCategory.map(cat => [
        cat.name,
        formatCurrency(cat.value),
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Category', 'Amount']],
        body: categoryTableData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        bodyStyles: {
          textColor: textColor,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        styles: {
          cellPadding: 5,
          fontSize: 11,
        },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 60, halign: 'right' },
        },
      });
    }

    // Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    const periodStr = selectedMonth !== null 
      ? `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
      : selectedQuarter 
      ? `q${selectedQuarter}-${selectedYear}`
      : `${selectedYear}`;
    doc.save(`report-${periodStr}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Reports</h1>
          <p className="text-slate-400 mt-1">Analyze your financial performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className="p-2 rounded-lg glass hover:bg-white/10 transition-colors"
            title={privacyMode ? 'Show data' : 'Hide data'}
            aria-label={privacyMode ? 'Show data' : 'Hide data'}
          >
            {privacyMode ? (
              <EyeOff size={20} className="text-slate-400" />
            ) : (
              <Eye size={20} className="text-slate-400" />
            )}
          </button>
          <Button onClick={handleExportReport} icon={Download}>
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="min-w-[120px]"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
        <Select
          value={selectedMonth !== null ? selectedMonth.toString() : ''}
          onChange={(e) => {
            const month = e.target.value ? parseInt(e.target.value) : null;
            setSelectedMonth(month);
            // Clear quarter when month is selected
            if (month !== null) {
              setSelectedQuarter(null);
            }
          }}
          className="min-w-[150px]"
        >
          <option value="">All Months</option>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((month) => (
            <option key={month} value={month}>
              {new Date(selectedYear, month, 1).toLocaleDateString('en-US', { month: 'long' })}
            </option>
          ))}
        </Select>
        <Select
          value={selectedQuarter || ''}
          onChange={(e) => {
            const quarter = e.target.value ? parseInt(e.target.value) : null;
            setSelectedQuarter(quarter);
            // Clear month when quarter is selected
            if (quarter !== null) {
              setSelectedMonth(null);
            }
          }}
          className="min-w-[150px]"
        >
          <option value="">Full Year</option>
          <option value="1">Q1 (Jan-Mar)</option>
          <option value="2">Q2 (Apr-Jun)</option>
          <option value="3">Q3 (Jul-Sep)</option>
          <option value="4">Q4 (Oct-Dec)</option>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-emerald-500">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-emerald-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">Total Income</p>
              <p className="text-2xl font-bold text-emerald-400">
                <PrivacyValue value={formatCurrency(totals.income)} />
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <TrendingDown className="text-red-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold text-red-400">
                <PrivacyValue value={formatCurrency(totals.expenses)} />
              </p>
            </div>
          </div>
        </Card>
        <Card
          className={`border-l-4 ${
            totals.profit >= 0 ? 'border-indigo-500' : 'border-red-500'
          }`}
        >
          <div className="flex items-center gap-3">
            <FileText
              className={totals.profit >= 0 ? 'text-indigo-400' : 'text-red-400'}
              size={24}
            />
            <div>
              <p className="text-slate-400 text-sm">Net Profit</p>
              <p
                className={`text-2xl font-bold ${
                  totals.profit >= 0 ? 'text-indigo-400' : 'text-red-400'
                }`}
              >
                <PrivacyValue value={formatCurrency(totals.profit)} />
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Monthly Income vs Expenses */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-indigo-400" />
            Monthly Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Profit Trend */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-400" />
            Profit Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Client Breakdown */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users size={20} className="text-indigo-400" />
          Client Breakdown
        </h3>
        {clientBreakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-slate-400">
                    Client
                  </th>
                  <th className="text-right p-3 text-sm font-medium text-slate-400">
                    Income
                  </th>
                  <th className="text-right p-3 text-sm font-medium text-slate-400">
                    Expenses
                  </th>
                  <th className="text-right p-3 text-sm font-medium text-slate-400">
                    Profit
                  </th>
                  <th className="text-right p-3 text-sm font-medium text-slate-400">
                    Margin
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clientBreakdown.map((client) => {
                  const margin =
                    client.income > 0
                      ? ((client.profit / client.income) * 100).toFixed(1)
                      : 0;
                  return (
                    <tr key={client.name} className="hover:bg-white/5">
                      <td className="p-3 font-medium">{client.name}</td>
                      <td className="p-3 text-right text-emerald-400">
                        <PrivacyValue value={formatCurrency(client.income)} />
                      </td>
                      <td className="p-3 text-right text-red-400">
                        <PrivacyValue value={formatCurrency(client.expenses)} />
                      </td>
                      <td
                        className={`p-3 text-right font-semibold ${
                          client.profit >= 0 ? 'text-indigo-400' : 'text-red-400'
                        }`}
                      >
                        <PrivacyValue value={formatCurrency(client.profit)} />
                      </td>
                      <td className="p-3 text-right text-slate-400">{margin}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">
            No client data for this period
          </p>
        )}
      </Card>

      {/* Expense Categories */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <PieChart size={20} className="text-indigo-400" />
          Expenses by Category
        </h3>
        {expensesByCategory.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {expensesByCategory.map((cat, index) => (
              <div
                key={cat.name}
                className="p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <p className="text-sm text-slate-400 capitalize">{cat.name}</p>
                <p className="text-xl font-bold text-red-400 mt-1">
                  <PrivacyValue value={formatCurrency(cat.value)} />
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {((cat.value / totals.expenses) * 100).toFixed(1)}% of total
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">
            No expense data for this period
          </p>
        )}
      </Card>
    </div>
  );
}

