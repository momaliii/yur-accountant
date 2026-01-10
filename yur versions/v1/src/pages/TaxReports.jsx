import { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Calculator,
  TrendingUp,
  TrendingDown,
  Receipt,
  Eye,
  EyeOff,
  Calendar,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { useDataStore, useSettingsStore } from '../stores/useStore';
import { PrivacyValue } from '../components/ui/PrivacyBlur';
import currencyService from '../services/currency/currencyService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function TaxReports() {
  const { income, expenses } = useDataStore();
  const { baseCurrency, exchangeRates, privacyMode, setPrivacyMode, vatRate = 0, taxYear, setTaxYear } = useSettingsStore();

  const [selectedYear, setSelectedYear] = useState(taxYear || new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(null);

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set();
    income.forEach((i) => years.add(new Date(i.receivedDate).getFullYear()));
    expenses.forEach((e) => years.add(new Date(e.date).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [income, expenses]);

  // Calculate tax summary
  const taxSummary = useMemo(() => {
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59);

    let quarterStart, quarterEnd;
    if (selectedQuarter) {
      const startMonth = (selectedQuarter - 1) * 3;
      quarterStart = new Date(selectedYear, startMonth, 1);
      quarterEnd = new Date(selectedYear, startMonth + 3, 0, 23, 59, 59);
    }

    const periodStart = selectedQuarter ? quarterStart : yearStart;
    const periodEnd = selectedQuarter ? quarterEnd : yearEnd;

    // Taxable income
    const taxableIncome = income
      .filter((i) => {
        const date = new Date(i.receivedDate);
        return date >= periodStart && date <= periodEnd && (i.isTaxable !== false);
      })
      .reduce((sum, i) => {
        const amount = i.netAmount || i.amount;
        return sum + currencyService.convert(amount, i.currency || baseCurrency, baseCurrency, exchangeRates);
      }, 0);

    // Tax deductions (tax-deductible expenses)
    const taxDeductions = expenses
      .filter((e) => {
        const date = new Date(e.date);
        return date >= periodStart && date <= periodEnd && e.isTaxDeductible;
      })
      .reduce((sum, e) => {
        return sum + currencyService.convert(e.amount, e.currency || baseCurrency, baseCurrency, exchangeRates);
      }, 0);

    // Taxable income after deductions
    const taxableIncomeAfterDeductions = Math.max(taxableIncome - taxDeductions, 0);

    // Calculate tax by category
    const incomeByCategory = {};
    income
      .filter((i) => {
        const date = new Date(i.receivedDate);
        return date >= periodStart && date <= periodEnd && (i.isTaxable !== false);
      })
      .forEach((i) => {
        const category = i.taxCategory || 'uncategorized';
        const amount = i.netAmount || i.amount;
        const converted = currencyService.convert(amount, i.currency || baseCurrency, baseCurrency, exchangeRates);
        incomeByCategory[category] = (incomeByCategory[category] || 0) + converted;
      });

    const expensesByCategory = {};
    expenses
      .filter((e) => {
        const date = new Date(e.date);
        return date >= periodStart && date <= periodEnd && e.isTaxDeductible;
      })
      .forEach((e) => {
        const category = e.taxCategory || e.category || 'uncategorized';
        const converted = currencyService.convert(e.amount, e.currency || baseCurrency, baseCurrency, exchangeRates);
        expensesByCategory[category] = (expensesByCategory[category] || 0) + converted;
      });

    // Estimated tax (if VAT rate is set)
    const estimatedTax = vatRate > 0 ? (taxableIncomeAfterDeductions * vatRate) / 100 : 0;

    return {
      taxableIncome,
      taxDeductions,
      taxableIncomeAfterDeductions,
      estimatedTax,
      incomeByCategory,
      expensesByCategory,
      period: selectedQuarter ? `Q${selectedQuarter} ${selectedYear}` : `Year ${selectedYear}`,
    };
  }, [income, expenses, selectedYear, selectedQuarter, baseCurrency, exchangeRates, vatRate]);

  const formatCurrency = (amount) => currencyService.formatCurrency(amount, baseCurrency);

  const handleExportTaxReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Colors
    const primaryColor = [99, 102, 241];
    const textColor = [51, 65, 85];

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('YUR Finance', 20, 25);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Tax Report', 20, 35);

    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.text(`Period: ${taxSummary.period}`, pageWidth - 20, 25, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 20, 35, { align: 'right' });

    yPosition = 50;

    // Tax Summary
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Tax Summary', 20, yPosition);
    yPosition += 10;

    const summaryData = [
      ['Taxable Income', formatCurrency(taxSummary.taxableIncome)],
      ['Tax Deductions', formatCurrency(taxSummary.taxDeductions)],
      ['Taxable Income (After Deductions)', formatCurrency(taxSummary.taxableIncomeAfterDeductions)],
      ['Estimated Tax (VAT/GST)', formatCurrency(taxSummary.estimatedTax)],
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Item', 'Amount']],
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
      styles: {
        cellPadding: 5,
        fontSize: 11,
      },
    });

    yPosition = doc.lastAutoTable.finalY + 20;

    // Income by Category
    if (Object.keys(taxSummary.incomeByCategory).length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Taxable Income by Category', 20, yPosition);
      yPosition += 10;

      const incomeCategoryData = Object.entries(taxSummary.incomeByCategory)
        .map(([category, amount]) => [category || 'Uncategorized', formatCurrency(amount)])
        .sort((a, b) => parseFloat(b[1].replace(/[^0-9.-]+/g, '')) - parseFloat(a[1].replace(/[^0-9.-]+/g, '')));

      doc.autoTable({
        startY: yPosition,
        head: [['Category', 'Amount']],
        body: incomeCategoryData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        bodyStyles: {
          textColor: textColor,
        },
        styles: {
          cellPadding: 5,
          fontSize: 10,
        },
      });

      yPosition = doc.lastAutoTable.finalY + 20;
    }

    // Deductions by Category
    if (Object.keys(taxSummary.expensesByCategory).length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Tax Deductions by Category', 20, yPosition);
      yPosition += 10;

      const deductionCategoryData = Object.entries(taxSummary.expensesByCategory)
        .map(([category, amount]) => [category || 'Uncategorized', formatCurrency(amount)])
        .sort((a, b) => parseFloat(b[1].replace(/[^0-9.-]+/g, '')) - parseFloat(a[1].replace(/[^0-9.-]+/g, '')));

      doc.autoTable({
        startY: yPosition,
        head: [['Category', 'Amount']],
        body: deductionCategoryData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        bodyStyles: {
          textColor: textColor,
        },
        styles: {
          cellPadding: 5,
          fontSize: 10,
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

    const periodStr = selectedQuarter 
      ? `q${selectedQuarter}-${selectedYear}`
      : `${selectedYear}`;
    doc.save(`tax-report-${periodStr}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Tax Reports</h1>
          <p className="text-slate-400 mt-1">Track taxable income and deductions for tax filing</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className="p-2 rounded-lg glass hover:bg-white/10 transition-colors"
            title={privacyMode ? 'Show data' : 'Hide data'}
          >
            {privacyMode ? (
              <EyeOff size={20} className="text-slate-400" />
            ) : (
              <Eye size={20} className="text-slate-400" />
            )}
          </button>
          <Button onClick={handleExportTaxReport} icon={Download}>
            Export Tax Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={selectedYear}
          onChange={(e) => {
            const year = parseInt(e.target.value);
            setSelectedYear(year);
            setTaxYear(year);
          }}
          className="min-w-[120px]"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
        <Select
          value={selectedQuarter || ''}
          onChange={(e) => setSelectedQuarter(e.target.value ? parseInt(e.target.value) : null)}
          className="min-w-[150px]"
        >
          <option value="">Full Year</option>
          <option value="1">Q1 (Jan-Mar)</option>
          <option value="2">Q2 (Apr-Jun)</option>
          <option value="3">Q3 (Jul-Sep)</option>
          <option value="4">Q4 (Oct-Dec)</option>
        </Select>
      </div>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-emerald-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="text-emerald-400" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Taxable Income</p>
              <p className="text-2xl font-bold text-emerald-400">
                <PrivacyValue value={formatCurrency(taxSummary.taxableIncome)} />
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <TrendingDown className="text-red-400" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Tax Deductions</p>
              <p className="text-2xl font-bold text-red-400">
                <PrivacyValue value={formatCurrency(taxSummary.taxDeductions)} />
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-indigo-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-lg">
              <Calculator className="text-indigo-400" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Taxable After Deductions</p>
              <p className="text-2xl font-bold text-indigo-400">
                <PrivacyValue value={formatCurrency(taxSummary.taxableIncomeAfterDeductions)} />
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-amber-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <Receipt className="text-amber-400" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Estimated Tax</p>
              <p className="text-2xl font-bold text-amber-400">
                <PrivacyValue value={formatCurrency(taxSummary.estimatedTax)} />
              </p>
              {vatRate > 0 && (
                <p className="text-xs text-slate-500 mt-1">({vatRate}% VAT/GST)</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Income by Category */}
      {Object.keys(taxSummary.incomeByCategory).length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Taxable Income by Category</h3>
          <div className="space-y-2">
            {Object.entries(taxSummary.incomeByCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-slate-300">{category || 'Uncategorized'}</span>
                  <span className="font-semibold text-emerald-400">
                    <PrivacyValue value={formatCurrency(amount)} />
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Deductions by Category */}
      {Object.keys(taxSummary.expensesByCategory).length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Tax Deductions by Category</h3>
          <div className="space-y-2">
            {Object.entries(taxSummary.expensesByCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-slate-300">{category || 'Uncategorized'}</span>
                  <span className="font-semibold text-red-400">
                    <PrivacyValue value={formatCurrency(amount)} />
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <FileText className="text-blue-400 flex-shrink-0 mt-1" size={20} />
          <div>
            <h4 className="font-semibold text-blue-300 mb-2">Tax Reporting Information</h4>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Mark income as taxable when adding/editing income entries</li>
              <li>• Mark expenses as tax-deductible when adding/editing expenses</li>
              <li>• Set VAT/GST rate in Settings to calculate estimated tax</li>
              <li>• Export tax report as PDF for your accountant or tax filing</li>
              <li>• This is for tracking purposes only - consult a tax professional for filing</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

