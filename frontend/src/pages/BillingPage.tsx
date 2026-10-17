import React, { useState, useEffect } from 'react';
import { hospitalService } from '../services/hospitalService';
import { Invoice, InvoiceItem, InvoiceStatus, PaymentMethod, Patient } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Card } from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import confetti from 'canvas-confetti';
import { 
  CreditCard, Download, Plus, DollarSign, 
  Receipt, CheckCircle2, ShieldCheck, ArrowRight, Trash2 
} from 'lucide-react';

export const BillingPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // New Invoice Modal State
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [patientId, setPatientId] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [notes, setNotes] = useState('Hospital consultation and diagnostic services.');
  const [items, setItems] = useState<{ item_type: string; description: string; quantity: number; unit_price: number }[]>([
    { item_type: 'CONSULTATION', description: 'Senior Specialist Consultation', quantity: 1, unit_price: 250.0 },
    { item_type: 'LAB_TEST', description: 'Complete Blood Count (CBC)', quantity: 1, unit_price: 45.0 }
  ]);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [payRef, setPayRef] = useState('TXN-CARD-9921');
  const [processingPay, setProcessingPay] = useState(false);

  const { user } = useAuth();
  const { success, error } = useToast();

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const [invList, patList] = await Promise.all([
        hospitalService.getInvoices({ status: statusFilter || undefined }),
        hospitalService.getPatients().catch(() => [])
      ]);
      setInvoices(invList);
      setPatients(patList);
      if (patList.length > 0) setPatientId(patList[0].id);
    } catch (err) {
      error('Failed to load billing records', 'Server error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [statusFilter]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { item_type: 'MEDICINE', description: 'Prescribed Pharmacy Medications', quantity: 1, unit_price: 35.0 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
  const grandTotal = Math.max(0, subtotal - discount + tax);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      error('No Items Added', 'Please add at least one billed charge item.');
      return;
    }
    setCreatingInvoice(true);
    try {
      const inv = await hospitalService.createInvoice({
        patient_id: patientId,
        discount,
        tax,
        notes,
        items
      });
      success('Invoice Generated', `Created invoice #${inv.invoice_number} for $${inv.grand_total.toFixed(2)}`);
      setInvoiceModalOpen(false);
      fetchBillingData();
    } catch (err: any) {
      error('Invoice Error', err.response?.data?.error || 'Validation error');
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleOpenPayment = (invoice: Invoice) => {
    setActiveInvoice(invoice);
    setPayAmount(invoice.balance_amount);
    setPayRef(`TXN-MEDI-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;
    setProcessingPay(true);
    try {
      await hospitalService.recordPayment({
        invoice_id: activeInvoice.id,
        amount: payAmount,
        payment_method: payMethod,
        transaction_reference: payRef,
        notes: `Processed via ${payMethod}`
      });
      success('Payment Processed', `Successfully settled $${payAmount.toFixed(2)} for ${activeInvoice.invoice_number}`);
      
      // Confetti celebratory trigger
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      setPaymentModalOpen(false);
      fetchBillingData();
    } catch (err: any) {
      error('Payment Failed', err.response?.data?.error || 'Could not record payment');
    } finally {
      setProcessingPay(false);
    }
  };

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      cell: (inv) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white font-mono">
            {inv.invoice_number}
          </div>
          <span className="text-[10px] text-slate-400">
            {new Date(inv.issue_date).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Patient Dossier',
      cell: (inv) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-200">
            {inv.patient?.full_name}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            MRN: {inv.patient?.mrn}
          </span>
        </div>
      ),
    },
    {
      header: 'Financial Breakdown',
      cell: (inv) => (
        <div className="text-xs space-y-0.5">
          <div className="font-bold text-slate-900 dark:text-white">
            Total: ${inv.grand_total.toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
            Paid: ${inv.paid_amount.toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      header: 'Outstanding Balance',
      cell: (inv) => (
        <span className={`text-sm font-black ${
          inv.balance_amount > 0 ? 'text-rose-500' : 'text-emerald-500'
        }`}>
          ${inv.balance_amount.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (inv) => (
        <Badge variant={getStatusBadgeVariant(inv.status)}>
          {inv.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (inv) => (
        <div className="flex items-center justify-end gap-1.5">
          {inv.balance_amount > 0 && (
            <Button
              variant="emerald"
              size="sm"
              onClick={() => handleOpenPayment(inv)}
              leftIcon={<DollarSign className="w-3.5 h-3.5" />}
            >
              Pay Balance
            </Button>
          )}

          <button
            onClick={() => hospitalService.downloadInvoicePdf(inv.id)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold inline-flex items-center gap-1"
            title="Download PDF Tax Invoice"
          >
            <Download className="w-3.5 h-3.5" /> Statement
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-teal-500" />
            <span>Digital Invoicing & Inpatient Billing</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Itemized clinical statements, cashless insurance processing, and automated tax invoicing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Invoices</option>
            <option value="PENDING">Pending Balance</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Fully Paid</option>
          </select>

          {(user?.role === 'ADMIN' || user?.role === 'BILLING_STAFF' || user?.role === 'RECEPTIONIST') && (
            <Button
              variant="primary"
              onClick={() => setInvoiceModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Generate Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={invoices}
        columns={columns}
        isLoading={loading}
        searchPlaceholder="Search invoice # or patient name..."
        searchableKeys={['invoice_number']}
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Record Payment (${activeInvoice?.invoice_number})`}
        subtitle={`Patient: ${activeInvoice?.patient?.full_name} • Total: $${activeInvoice?.grand_total.toFixed(2)}`}
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Billed:</span>
              <span className="font-bold text-slate-900 dark:text-white">${activeInvoice?.grand_total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Already Paid:</span>
              <span className="font-bold text-emerald-500">${activeInvoice?.paid_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 font-bold">Outstanding Balance:</span>
              <span className="font-black text-rose-500">${activeInvoice?.balance_amount.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              max={activeInvoice?.balance_amount}
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Method
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
            >
              <option value="CREDIT_CARD">Credit Card (Visa / Mastercard / Amex)</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="UPI">UPI / Instant Digital Transfer</option>
              <option value="INSURANCE">Cashless Insurance Settlement</option>
              <option value="CASH">Cash at Concierge Desk</option>
              <option value="NET_BANKING">Net Banking / Wire</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transaction Reference / Claim ID
            </label>
            <input
              type="text"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="emerald" type="submit" isLoading={processingPay} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Process Payment Settlement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="Generate Itemized Patient Invoice"
        subtitle="Calculates subtotal, discounts, and itemized billing ledger"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Billed Patient
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.mrn})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Itemized Service Line Items
              </span>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Service Line
              </Button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 items-end">
                <div className="sm:col-span-3">
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx].description = e.target.value;
                      setItems(next);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx].quantity = Number(e.target.value);
                      setItems(next);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx].unit_price = Number(e.target.value);
                      setItems(next);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex items-center justify-end">
                  <button type="button" onClick={() => handleRemoveItem(idx)} className="p-2 text-slate-400 hover:text-rose-500 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Discount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tax / Surcharge ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center justify-between text-sm font-bold">
            <span className="text-slate-700 dark:text-slate-300">Grand Total Invoice Balance:</span>
            <span className="text-lg font-black text-brand-600 dark:text-brand-400">${grandTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setInvoiceModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={creatingInvoice}>
              Issue Final Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
