import React, { useState, useEffect } from 'react';
import { hospitalService } from '../services/hospitalService';
import { LabOrder, LabTest, LabStatus, LabFlag, Patient, Doctor } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  FlaskConical, Download, Plus, CheckCircle2, 
  Clock, ShieldAlert, ArrowRight, FileCheck2, Activity 
} from 'lucide-react';

export const LaboratoryPage: React.FC = () => {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Result Entry Modal State
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<LabOrder | null>(null);
  const [resultValues, setResultValues] = useState<Record<number, { val: string; flag: LabFlag; notes: string }>>({});
  const [savingResults, setSavingResults] = useState(false);

  // New Order Modal State
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(1);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(1);
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const { user } = useAuth();
  const { success, error } = useToast();

  const fetchLabData = async () => {
    setLoading(true);
    try {
      const [ordList, testList, patList, docList] = await Promise.all([
        hospitalService.getLabOrders({ status: (statusFilter as LabStatus) || undefined }),
        hospitalService.getLabTests(),
        hospitalService.getPatients().catch(() => []),
        hospitalService.getDoctors()
      ]);
      setOrders(ordList);
      setTests(testList);
      setPatients(patList);
      setDoctors(docList);
      if (patList.length > 0) setSelectedPatientId(patList[0].id);
      if (docList.length > 0) setSelectedDoctorId(docList[0].id);
    } catch (err) {
      error('Failed to load lab data', 'Server error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabData();
  }, [statusFilter]);

  const handleOpenResults = (order: LabOrder) => {
    setActiveOrder(order);
    const initialVals: Record<number, { val: string; flag: LabFlag; notes: string }> = {};
    order.items.forEach(item => {
      initialVals[item.id] = {
        val: item.result_value || 'Normal parameters observed',
        flag: item.flag || 'NORMAL',
        notes: item.notes || 'Calibrated under standard controls.'
      };
    });
    setResultValues(initialVals);
    setResultModalOpen(true);
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    setSavingResults(true);
    try {
      const payload = Object.entries(resultValues).map(([itemId, data]) => ({
        id: Number(itemId),
        result_value: data.val,
        flag: data.flag,
        notes: data.notes
      }));

      await hospitalService.submitLabResults(activeOrder.id, payload);
      success('Lab Results Verified', `Order ${activeOrder.order_number} marked VERIFIED with PDF report ready.`);
      setResultModalOpen(false);
      fetchLabData();
    } catch (err: any) {
      error('Failed to save results', err.response?.data?.error || 'Validation error');
    } finally {
      setSavingResults(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTestIds.length === 0) {
      error('No Tests Selected', 'Please select at least one lab test investigation.');
      return;
    }
    setCreatingOrder(true);
    try {
      const res = await hospitalService.createLabOrder({
        patient_id: selectedPatientId,
        doctor_id: selectedDoctorId,
        test_ids: selectedTestIds,
        priority: 'ROUTINE'
      });
      success('Lab Order Dispatched', `Created order #${res.order_number}`);
      setNewOrderModalOpen(false);
      setSelectedTestIds([]);
      fetchLabData();
    } catch (err: any) {
      error('Creation Failed', err.response?.data?.error || 'Error dispatching order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: LabStatus) => {
    try {
      await hospitalService.updateLabOrderStatus(orderId, status);
      success('Status Updated', `Lab order moved to ${status}`);
      fetchLabData();
    } catch (err: any) {
      error('Failed to update', err.response?.data?.error || 'Error updating status');
    }
  };

  const columns: Column<LabOrder>[] = [
    {
      header: 'Order # & Date',
      cell: (o) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white font-mono">
            {o.order_number}
          </div>
          <span className="text-[10px] text-slate-400">
            {new Date(o.order_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      ),
    },
    {
      header: 'Patient Dossier',
      cell: (o) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center text-xs shrink-0">
            {o.patient?.full_name?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {o.patient?.full_name}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              MRN: {o.patient?.mrn}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Ordered Investigations',
      cell: (o) => (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1 max-w-xs">
            {o.items.map((i, idx) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {i.lab_test?.name || 'Diagnostic Test'}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      header: 'Status & Priority',
      cell: (o) => (
        <div className="space-y-1">
          <Badge variant={getStatusBadgeVariant(o.status)}>
            {o.status}
          </Badge>
          <span className="text-[10px] text-slate-400 block font-semibold">
            {o.priority} PRIORITY
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (o) => (
        <div className="flex items-center justify-end gap-1.5">
          {o.status === 'REQUESTED' && (user?.role === 'ADMIN' || user?.role === 'LAB_STAFF' || user?.role === 'NURSE') && (
            <button
              onClick={() => handleUpdateStatus(o.id, 'SAMPLE_COLLECTED' as LabStatus)}
              className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold"
            >
              Collect Sample
            </button>
          )}

          {o.status === 'SAMPLE_COLLECTED' && (user?.role === 'ADMIN' || user?.role === 'LAB_STAFF') && (
            <button
              onClick={() => handleUpdateStatus(o.id, 'PROCESSING' as LabStatus)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold"
            >
              Start Analyzer
            </button>
          )}

          {(o.status === 'PROCESSING' || o.status === 'SAMPLE_COLLECTED') && (user?.role === 'ADMIN' || user?.role === 'LAB_STAFF') && (
            <button
              onClick={() => handleOpenResults(o)}
              className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold inline-flex items-center gap-1"
            >
              <FileCheck2 className="w-3.5 h-3.5" /> Enter Results
            </button>
          )}

          {(o.status === 'COMPLETED' || o.status === 'VERIFIED') && (
            <button
              onClick={() => hospitalService.downloadLabReportPdf(o.id)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold inline-flex items-center gap-1"
              title="Download Verified PDF Lab Report"
            >
              <Download className="w-3.5 h-3.5" /> PDF Report
            </button>
          )}
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
            <FlaskConical className="w-7 h-7 text-purple-500" />
            <span>Diagnostic Pathology & Laboratory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Automated sample collection, bio-analyzer result validation, and digital report delivery
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="SAMPLE_COLLECTED">Sample Collected</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="VERIFIED">Verified</option>
          </select>

          <Button
            variant="primary"
            onClick={() => setNewOrderModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Lab Order
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={orders}
        columns={columns}
        isLoading={loading}
        searchPlaceholder="Search order number or patient name..."
        searchableKeys={['order_number']}
      />

      {/* Enter Lab Results Modal */}
      <Modal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title={`Enter Diagnostic Results (${activeOrder?.order_number})`}
        subtitle={`Patient: ${activeOrder?.patient?.full_name} (${activeOrder?.patient?.mrn})`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveResults} className="space-y-4">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {activeOrder?.items.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.lab_test?.name} ({item.lab_test?.category})
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Sample: {item.lab_test?.sample_type}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-400 block font-semibold mb-1">
                      Observed Result Value
                    </label>
                    <input
                      type="text"
                      required
                      value={resultValues[item.id]?.val || ''}
                      onChange={(e) => {
                        setResultValues({
                          ...resultValues,
                          [item.id]: { ...resultValues[item.id], val: e.target.value }
                        });
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block font-semibold mb-1">
                      Diagnostic Flag
                    </label>
                    <select
                      value={resultValues[item.id]?.flag || 'NORMAL'}
                      onChange={(e) => {
                        setResultValues({
                          ...resultValues,
                          [item.id]: { ...resultValues[item.id], flag: e.target.value as LabFlag }
                        });
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white font-semibold"
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="LOW">LOW</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">
                    Pathologist Clinical Notes / Interpretation
                  </label>
                  <input
                    type="text"
                    value={resultValues[item.id]?.notes || ''}
                    onChange={(e) => {
                      setResultValues({
                        ...resultValues,
                        [item.id]: { ...resultValues[item.id], notes: e.target.value }
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setResultModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="emerald" type="submit" isLoading={savingResults} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Verify & Issue Official Report
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Lab Order Modal */}
      <Modal
        isOpen={newOrderModalOpen}
        onClose={() => setNewOrderModalOpen(false)}
        title="Dispatch Diagnostic Laboratory Order"
        subtitle="Select investigations for automated sample tracking"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.mrn})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ordering Doctor
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.user?.full_name} ({d.specialization})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Diagnostic Test Panels
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {tests.map((test) => {
                const isSelected = selectedTestIds.includes(test.id);
                return (
                  <div
                    key={test.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTestIds(selectedTestIds.filter(id => id !== test.id));
                      } else {
                        setSelectedTestIds([...selectedTestIds, test.id]);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{test.name}</span>
                    <span className="text-slate-400 font-normal">${test.price}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setNewOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={creatingOrder}>
              Dispatch Lab Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
