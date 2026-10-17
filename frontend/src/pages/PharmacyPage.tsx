import React, { useState, useEffect } from 'react';
import { hospitalService } from '../services/hospitalService';
import { Medicine, Prescription, PrescriptionStatus } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Card } from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Pill, AlertTriangle, Plus, CheckCircle2, 
  Package, Layers, Calendar, DollarSign, ArrowRight 
} from 'lucide-react';

export const PharmacyPage: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions'>('inventory');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Medicine Modal State
  const [medModalOpen, setMedModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    category: 'Antibiotics',
    batch_number: 'BAT-2026-101',
    unit_price: 2.50,
    stock_quantity: 150,
    reorder_level: 30,
    manufacturer: 'Pfizer Labs',
    manufacturing_date: '2024-01-10',
    expiry_date: '2027-01-10',
    location_rack: 'Rack B-04',
    is_prescription_required: true
  });
  const [savingMed, setSavingMed] = useState(false);
  const [dispensingId, setDispensingId] = useState<number | null>(null);

  const { user } = useAuth();
  const { success, error } = useToast();

  const fetchPharmacyData = async () => {
    setLoading(true);
    try {
      const [meds, rxs] = await Promise.all([
        hospitalService.getMedicines({ low_stock_only: lowStockOnly }),
        hospitalService.getPrescriptions()
      ]);
      setMedicines(meds);
      setPrescriptions(rxs);
    } catch (err) {
      error('Failed to load pharmacy data', 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacyData();
  }, [lowStockOnly]);

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMed(true);
    try {
      await hospitalService.createMedicine(formData as any);
      success('Medicine Stock Added', `${formData.name} added to inventory registry.`);
      setMedModalOpen(false);
      fetchPharmacyData();
    } catch (err: any) {
      error('Failed to add medicine', err.response?.data?.error || 'Validation error');
    } finally {
      setSavingMed(false);
    }
  };

  const handleDispenseRx = async (rxId: number) => {
    setDispensingId(rxId);
    try {
      await hospitalService.dispensePrescription(rxId);
      success('Prescription Dispensed', 'Inventory stocks updated and patient notified.');
      fetchPharmacyData();
    } catch (err: any) {
      error('Dispense Failed', err.response?.data?.error || err.response?.data?.detail || 'Stock issue');
    } finally {
      setDispensingId(null);
    }
  };

  const lowStockCount = medicines.filter(m => m.stock_quantity <= m.reorder_level).length;

  const medColumns: Column<Medicine>[] = [
    {
      header: 'Drug Name & Code',
      cell: (m) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white">
            {m.name}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {m.code} • {m.generic_name || m.category}
          </span>
        </div>
      ),
    },
    {
      header: 'Category & Rack',
      cell: (m) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
            {m.category}
          </span>
          <span className="text-[10px] text-brand-500 font-mono">
            {m.location_rack || 'Warehouse'}
          </span>
        </div>
      ),
    },
    {
      header: 'Batch & Expiry',
      cell: (m) => (
        <div className="text-xs">
          <span className="font-mono text-slate-700 dark:text-slate-300 block">
            {m.batch_number}
          </span>
          <span className="text-[10px] text-slate-400">
            Exp: {m.expiry_date}
          </span>
        </div>
      ),
    },
    {
      header: 'Unit Price',
      cell: (m) => (
        <span className="font-bold text-slate-900 dark:text-white text-xs">
          ${m.unit_price.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Current Stock',
      cell: (m) => {
        const isLow = m.stock_quantity <= m.reorder_level;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`font-black text-sm ${isLow ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                {m.stock_quantity} units
              </span>
              {isLow && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 font-bold">
                  Low Stock
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Reorder threshold: {m.reorder_level}
            </span>
          </div>
        );
      },
    },
  ];

  const rxColumns: Column<Prescription>[] = [
    {
      header: 'Prescription #',
      cell: (rx) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white font-mono">
            {rx.prescription_number}
          </div>
          <span className="text-[10px] text-slate-400">
            Issued: {new Date(rx.date_issued).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Patient & Doctor',
      cell: (rx) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-200">
            {rx.patient?.full_name}
          </div>
          <span className="text-[10px] text-slate-400">
            MRN: {rx.patient?.mrn} • Dr. {rx.doctor?.user?.full_name}
          </span>
        </div>
      ),
    },
    {
      header: 'Prescribed Items',
      cell: (rx) => (
        <div className="space-y-1">
          {rx.items.map((i, idx) => (
            <div key={idx} className="text-xs text-slate-700 dark:text-slate-300">
              • <b>{i.medicine_name}</b> ({i.dosage}) — Qty: {i.quantity}
            </div>
          ))}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (rx) => (
        <Badge variant={getStatusBadgeVariant(rx.status)}>
          {rx.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (rx) => (
        <div className="flex items-center justify-end gap-2">
          {rx.status !== 'DISPENSED' && (user?.role === 'ADMIN' || user?.role === 'PHARMACIST') && (
            <Button
              variant="emerald"
              size="sm"
              isLoading={dispensingId === rx.id}
              onClick={() => handleDispenseRx(rx.id)}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Dispense Rx
            </Button>
          )}
          <button
            onClick={() => hospitalService.downloadPrescriptionPdf(rx.id)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
          >
            PDF
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
            <Pill className="w-7 h-7 text-cyan-500" />
            <span>Pharmacy & Medicine Inventory Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time batch tracking, stock depletion on dispensing, and low-inventory alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(user?.role === 'ADMIN' || user?.role === 'PHARMACIST') && (
            <Button
              variant="primary"
              onClick={() => setMedModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Medicine Stock
            </Button>
          )}
        </div>
      </div>

      {/* Low Stock Warning Alert if any */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold">Pharmacy Inventory Threshold Notice</h4>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {lowStockCount} medicines have reached or fallen below their safety reorder thresholds.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLowStockOnly(!lowStockOnly)}
          >
            {lowStockOnly ? 'Show All Stock' : 'Filter Low Stock Only'}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'inventory'
              ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Medicine Inventory Catalog ({medicines.length})
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'prescriptions'
              ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Prescription Dispensing Queue ({prescriptions.length})
        </button>
      </div>

      {/* Content Table */}
      {activeTab === 'inventory' ? (
        <DataTable
          data={medicines}
          columns={medColumns}
          isLoading={loading}
          searchPlaceholder="Search medicines by name, generic name, batch #..."
          searchableKeys={['name', 'generic_name', 'batch_number', 'category']}
        />
      ) : (
        <DataTable
          data={prescriptions}
          columns={rxColumns}
          isLoading={loading}
          searchPlaceholder="Search prescriptions by #, patient..."
          searchableKeys={['prescription_number']}
        />
      )}

      {/* Add Medicine Stock Modal */}
      <Modal
        isOpen={medModalOpen}
        onClose={() => setMedModalOpen(false)}
        title="Register New Medicine Batch"
        subtitle="Adds pharmaceutical inventory to active hospital dispensary"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateMedicine} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Medicine Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Ciprofloxacin 500mg"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Generic Compound
              </label>
              <input
                type="text"
                value={formData.generic_name}
                onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                placeholder="e.g., Ciprofloxacin HCl"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              >
                {['Antibiotics', 'Analgesics', 'Cardiovascular', 'Endocrinology', 'Gastroenterology', 'Respiratory', 'Injectables'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batch Number
              </label>
              <input
                type="text"
                required
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                required
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reorder Alert Level
              </label>
              <input
                type="number"
                required
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rack Location
              </label>
              <input
                type="text"
                value={formData.location_rack}
                onChange={(e) => setFormData({ ...formData, location_rack: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                required
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setMedModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={savingMed}>
              Save Medicine Batch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
