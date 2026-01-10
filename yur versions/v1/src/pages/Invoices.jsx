import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  FileText,
  Edit2,
  Trash2,
  Download,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  EyeOff,
  Search,
  Filter,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select, Textarea } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useDataStore, useSettingsStore } from '../stores/useStore';
import { PrivacyValue } from '../components/ui/PrivacyBlur';
import currencyService from '../services/currency/currencyService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'slate', icon: FileText },
  { value: 'sent', label: 'Sent', color: 'blue', icon: Mail },
  { value: 'paid', label: 'Paid', color: 'emerald', icon: CheckCircle },
  { value: 'overdue', label: 'Overdue', color: 'red', icon: XCircle },
  { value: 'cancelled', label: 'Cancelled', color: 'gray', icon: XCircle },
];

const initialFormState = {
  clientId: '',
  invoiceNumber: '',
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  currency: 'EGP',
  status: 'draft',
  items: [{ description: '', quantity: 1, rate: '', amount: '' }],
  notes: '',
};

export default function Invoices() {
  const { clients, invoices, addInvoice, updateInvoice, deleteInvoice } = useDataStore();
  const { baseCurrency, currencies, privacyMode, setPrivacyMode } = useSettingsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get next invoice number on mount
  useEffect(() => {
    const getNextNumber = async () => {
      if (!editingInvoice && !formData.invoiceNumber && isModalOpen) {
        try {
          const { invoicesDB } = await import('../services/db/database');
          const nextNumber = await invoicesDB.getNextInvoiceNumber();
          setFormData((prev) => ({ ...prev, invoiceNumber: nextNumber }));
        } catch (error) {
          console.error('Failed to get next invoice number:', error);
          // Set a default if it fails
          setFormData((prev) => ({ ...prev, invoiceNumber: 'INV-001' }));
        }
      }
    };
    if (isModalOpen) {
      getNextNumber();
    }
  }, [isModalOpen, editingInvoice, formData.invoiceNumber]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(query) ||
          clients.find((c) => c.id === inv.clientId)?.name.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
  }, [invoices, statusFilter, searchQuery, clients]);

  // Calculate totals
  const totals = useMemo(() => {
    const total = filteredInvoices.reduce((sum, inv) => {
      return sum + currencyService.convert(inv.amount, inv.currency || baseCurrency, baseCurrency, {});
    }, 0);
    const paid = filteredInvoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => {
        return sum + currencyService.convert(inv.amount, inv.currency || baseCurrency, baseCurrency, {});
      }, 0);
    const pending = filteredInvoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'draft')
      .reduce((sum, inv) => {
        return sum + currencyService.convert(inv.amount, inv.currency || baseCurrency, baseCurrency, {});
      }, 0);
    const overdue = filteredInvoices
      .filter((inv) => {
        if (inv.status === 'paid' || !inv.dueDate) return false;
        return new Date(inv.dueDate) < new Date();
      })
      .reduce((sum, inv) => {
        return sum + currencyService.convert(inv.amount, inv.currency || baseCurrency, baseCurrency, {});
      }, 0);

    return { total, paid, pending, overdue };
  }, [filteredInvoices, baseCurrency]);

  const openAddModal = () => {
    setEditingInvoice(null);
    setFormData({
      ...initialFormState,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    });
    setIsModalOpen(true);
  };

  const openEditModal = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      clientId: invoice.clientId?.toString() || '',
      invoiceNumber: invoice.invoiceNumber || '',
      issueDate: invoice.issueDate || new Date().toISOString().split('T')[0],
      dueDate: invoice.dueDate || '',
      currency: invoice.currency || 'EGP',
      status: invoice.status || 'draft',
      items: invoice.items && invoice.items.length > 0 ? invoice.items : [{ description: '', quantity: 1, rate: '', amount: '' }],
      notes: invoice.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      // Auto-calculate amount
      if (field === 'quantity' || field === 'rate') {
        const quantity = parseFloat(newItems[index].quantity) || 0;
        const rate = parseFloat(newItems[index].rate) || 0;
        newItems[index].amount = (quantity * rate).toFixed(2);
      }

      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: '', amount: '' }],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Calculate total amount from items
      const totalAmount = formData.items.reduce((sum, item) => {
        return sum + (parseFloat(item.amount) || 0);
      }, 0);

      const invoiceData = {
        clientId: formData.clientId ? parseInt(formData.clientId) : null,
        invoiceNumber: formData.invoiceNumber,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate || null,
        currency: formData.currency,
        amount: totalAmount,
        status: formData.status,
        items: formData.items.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 0,
          rate: parseFloat(item.rate) || 0,
          amount: parseFloat(item.amount) || 0,
        })),
        notes: formData.notes || null,
      };

      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, invoiceData);
      } else {
        await addInvoice(invoiceData);
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error('Failed to save invoice:', error);
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (invoice) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      await deleteInvoice(invoice.id);
    }
  };

  const handleGeneratePDF = (invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Colors
    const primaryColor = [99, 102, 241];
    const textColor = [51, 65, 85];

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('YUR Finance', 20, 30);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('INVOICE', 20, 42);

    // Invoice details
    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - 20, 30, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, pageWidth - 20, 38, { align: 'right' });
    if (invoice.dueDate) {
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, pageWidth - 20, 46, { align: 'right' });
    }

    yPosition = 70;

    // Bill To
    if (client) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(client.name, 20, yPosition + 8);
      if (client.email) {
        doc.text(client.email, 20, yPosition + 16);
      }
      yPosition += 35;
    }

    // Items table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Items', 20, yPosition);
    yPosition += 10;

    const itemsData = invoice.items.map((item, index) => [
      index + 1,
      item.description || 'Item',
      item.quantity.toString(),
      currencyService.formatCurrency(item.rate, invoice.currency),
      currencyService.formatCurrency(item.amount, invoice.currency),
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['#', 'Description', 'Qty', 'Rate', 'Amount']],
      body: itemsData,
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
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 80 },
        2: { cellWidth: 25 },
        3: { cellWidth: 35 },
        4: { cellWidth: 35 },
      },
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    // Total
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Total: ${currencyService.formatCurrency(invoice.amount, invoice.currency)}`,
      pageWidth - 20,
      yPosition,
      { align: 'right' }
    );

    // Notes
    if (invoice.notes) {
      yPosition += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Notes:', 20, yPosition);
      doc.setFontSize(9);
      const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 40);
      doc.text(splitNotes, 20, yPosition + 8);
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Thank you for your business!',
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );

    doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
  };

  const formatCurrency = (amount, currency) => currencyService.formatCurrency(amount, currency || baseCurrency);

  const getStatusInfo = (status) => INVOICE_STATUSES.find((s) => s.value === status) || INVOICE_STATUSES[0];

  const isOverdue = (invoice) => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
    if (!invoice.dueDate) return false;
    return new Date(invoice.dueDate) < new Date();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Invoices</h1>
          <p className="text-slate-400 mt-1">Create and manage client invoices</p>
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
          <Button onClick={openAddModal} icon={Plus}>
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-lg">
              <FileText className="text-indigo-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Invoices</p>
              <p className="text-xl font-bold text-white">{filteredInvoices.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <CheckCircle className="text-emerald-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Paid</p>
              <p className="text-xl font-bold text-emerald-400">
                <PrivacyValue value={formatCurrency(totals.paid)} />
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Clock className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pending</p>
              <p className="text-xl font-bold text-blue-400">
                <PrivacyValue value={formatCurrency(totals.pending)} />
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <XCircle className="text-red-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Overdue</p>
              <p className="text-xl font-bold text-red-400">
                <PrivacyValue value={formatCurrency(totals.overdue)} />
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="max-w-md flex-1">
          <Input
            icon={Search}
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            {INVOICE_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Invoices Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-sm font-semibold text-slate-400">Invoice #</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-400">Client</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-400">Issue Date</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-400">Due Date</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-400">Amount</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-400">Status</th>
                <th className="text-right p-3 text-sm font-semibold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => {
                  const client = clients.find((c) => c.id === invoice.clientId);
                  const statusInfo = getStatusInfo(invoice.status);
                  const StatusIcon = statusInfo.icon;
                  const overdue = isOverdue(invoice);

                  return (
                    <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 text-sm font-medium text-white">{invoice.invoiceNumber}</td>
                      <td className="p-3 text-sm text-slate-300">{client?.name || 'No Client'}</td>
                      <td className="p-3 text-sm text-slate-400">
                        {new Date(invoice.issueDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm text-slate-400">
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3 text-sm font-semibold text-white">
                        <PrivacyValue value={formatCurrency(invoice.amount, invoice.currency)} />
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            overdue
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : statusInfo.value === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : statusInfo.value === 'sent'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          }`}
                        >
                          <StatusIcon size={12} />
                          {overdue ? 'Overdue' : statusInfo.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleGeneratePDF(invoice)}
                            className="p-2 rounded-lg hover:bg-indigo-500/20 text-indigo-400 transition-colors"
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => openEditModal(invoice)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(invoice)}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <FileText size={40} className="mx-auto mb-2 opacity-50" />
                    <p>No invoices found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInvoice ? 'Edit Invoice' : 'Add New Invoice'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Client *"
              value={formData.clientId}
              onChange={(e) => setFormData((prev) => ({ ...prev, clientId: e.target.value }))}
              required
            >
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
            <Input
              label="Invoice Number *"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
              required
              placeholder="INV-001"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Issue Date *"
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, issueDate: e.target.value }))}
              required
            />
            <Input
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Currency"
              value={formData.currency}
              onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
            >
              {INVOICE_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Invoice Items */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Invoice Items</h3>
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Item {index + 1}</span>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <Input
                    label="Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Item description"
                    className="mb-2"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      label="Quantity"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    />
                    <Input
                      label="Rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                    />
                    <Input
                      label="Amount"
                      type="number"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                      disabled
                      className="opacity-75"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Total Amount:</span>
                <span className="text-base font-bold text-indigo-400">
                  {formatCurrency(
                    formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
                    formData.currency
                  )}
                </span>
              </div>
            </div>
          </div>

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes or terms..."
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={isSubmitting} className="flex-1">
              {editingInvoice ? 'Update Invoice' : 'Add Invoice'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

