import React, { useState, useEffect, useCallback } from 'react';
import { hospitalService } from '../services/hospitalService';
import { Bed, BedType, BedStatus, Patient, Doctor } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  Bed as BedIcon, Activity, UserPlus, UserCheck, 
  Sparkles, Layers, ShieldCheck, CheckCircle2, Wrench, Clock, ArrowRightLeft, Sparkle
} from 'lucide-react';

export const BedMapPage: React.FC = () => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedWardType, setSelectedWardType] = useState<BedType | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Selected Bed Modal State
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Quick Admit Modal State
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [admitPatientId, setAdmitPatientId] = useState<number>(1);
  const [admitDoctorId, setAdmitDoctorId] = useState<number>(1);
  const [admissionReason, setAdmissionReason] = useState('Inpatient cardiac monitoring and medication titration');

  // Bed Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferToBedId, setTransferToBedId] = useState<number | ''>('');
  const [transferReason, setTransferReason] = useState('Clinical escalation to Intensive Care Unit');

  const { success, error, info } = useToast();

  const fetchBeds = useCallback(async () => {
    setLoading(true);
    try {
      const [bList, pList, dList] = await Promise.all([
        hospitalService.getBeds({ 
          floor: selectedFloor || undefined, 
          ward_type: selectedWardType || undefined 
        }),
        hospitalService.getPatients().catch(() => []),
        hospitalService.getDoctors()
      ]);
      setBeds(bList);
      setPatients(pList);
      setDoctors(dList);
      if (pList.length > 0 && !admitPatientId) setAdmitPatientId(pList[0].id);
      if (dList.length > 0 && !admitDoctorId) setAdmitDoctorId(dList[0].id);
    } catch (err) {
      error('Failed to load beds', 'Could not sync bed status matrix.');
    } finally {
      setLoading(false);
    }
  }, [selectedFloor, selectedWardType, admitPatientId, admitDoctorId, error]);

  // WebSocket for Live Bed Updates
  useWebSocket('bed_status', (data) => {
    if (data.event === 'BED_TRANSFERRED') {
      info('Bed Transfer Logged', `Patient transferred from ${data.from_bed} to ${data.to_bed}`);
    }
    fetchBeds();
  });

  useEffect(() => {
    fetchBeds();
  }, [fetchBeds]);

  const handleBedClick = (bed: Bed) => {
    setSelectedBed(bed);
    setModalOpen(true);
  };

  const handleStatusChange = async (newStatus: BedStatus) => {
    if (!selectedBed) return;
    try {
      await hospitalService.updateBedStatus(selectedBed.id, newStatus);
      success('Bed Status Updated', `Bed ${selectedBed.bed_number} marked as ${newStatus}.`);
      setModalOpen(false);
      fetchBeds();
    } catch (err) {
      error('Update Failed', 'Could not modify bed status.');
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed || !transferToBedId) return;
    try {
      await hospitalService.transferBed(selectedBed.id, Number(transferToBedId), transferReason);
      success('Bed Transferred', `Patient moved to destination bed successfully.`);
      setTransferModalOpen(false);
      setModalOpen(false);
      fetchBeds();
    } catch (err: any) {
      error('Transfer Failed', err.response?.data?.error || err.message);
    }
  };

  const handleQuickAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed) return;
    try {
      await hospitalService.admitPatient({
        patient_id: admitPatientId,
        doctor_id: admitDoctorId,
        bed_id: selectedBed.id,
        admission_reason: admissionReason
      });
      success('Patient Admitted', `Admitted to Bed ${selectedBed.bed_number}`);
      setAdmitModalOpen(false);
      setModalOpen(false);
      fetchBeds();
    } catch (err: any) {
      error('Admission Failed', err.response?.data?.error || 'Unable to complete admission.');
    }
  };

  // Filtered beds
  const displayedBeds = beds.filter(b => {
    if (selectedStatus === 'ALL') return true;
    return b.status === selectedStatus;
  });

  const availableCount = beds.filter(b => b.status === 'AVAILABLE').length;
  const occupiedCount = beds.filter(b => b.status === 'OCCUPIED').length;
  const cleaningCount = beds.filter(b => b.status === 'CLEANING').length;
  const isolationCount = beds.filter(b => b.status === 'ISOLATION').length;
  const maintenanceCount = beds.filter(b => b.status === 'MAINTENANCE').length;
  const occupancyRate = beds.length ? Math.round((occupiedCount / beds.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Hospital Floor Plan & Bed Allocation</h1>
            <Badge variant="cyan">Live WebSocket</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time interactive bed occupancy matrix, isolation units, room allocations, and patient transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchBeds} icon={<Activity className="w-4 h-4 text-cyan-400" />}>
            Sync Floor Map
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-4 bg-slate-900 border-slate-800">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Available</span>
          <p className="text-2xl font-extrabold text-white mt-1">{availableCount}</p>
        </Card>
        <Card className="p-4 bg-slate-900 border-slate-800">
          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Occupied</span>
          <p className="text-2xl font-extrabold text-white mt-1">{occupiedCount}</p>
        </Card>
        <Card className="p-4 bg-slate-900 border-slate-800">
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Cleaning</span>
          <p className="text-2xl font-extrabold text-white mt-1">{cleaningCount}</p>
        </Card>
        <Card className="p-4 bg-slate-900 border-slate-800">
          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Isolation</span>
          <p className="text-2xl font-extrabold text-white mt-1">{isolationCount}</p>
        </Card>
        <Card className="p-4 bg-slate-900 border-slate-800">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Occupancy Rate</span>
          <p className="text-2xl font-extrabold text-white mt-1">{occupancyRate}%</p>
        </Card>
      </div>

      {/* Filter Navigation Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'AVAILABLE', 'OCCUPIED', 'CLEANING', 'ISOLATION', 'MAINTENANCE'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedStatus === st
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Floor & Ward Filters */}
          <div className="flex items-center gap-3">
            <select
              value={selectedFloor || ''}
              onChange={(e) => setSelectedFloor(e.target.value ? Number(e.target.value) : null)}
              className="bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Floors</option>
              <option value="1">Floor 1 (Emergency/OPD)</option>
              <option value="2">Floor 2 (General Medical)</option>
              <option value="3">Floor 3 (ICU / Recovery)</option>
              <option value="4">Floor 4 (Executive Suites)</option>
            </select>

            <select
              value={selectedWardType || ''}
              onChange={(e) => setSelectedWardType(e.target.value ? (e.target.value as BedType) : null)}
              className="bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Ward Types</option>
              <option value="ICU">Intensive Care (ICU)</option>
              <option value="EMERGENCY">Emergency Bay</option>
              <option value="GENERAL_WARD">General Ward</option>
              <option value="PRIVATE_ROOM">Private Room</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Bed Floor Plan Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3.5">
        {displayedBeds.map((bed) => {
          const isAvailable = bed.status === 'AVAILABLE';
          const isOccupied = bed.status === 'OCCUPIED';
          const isCleaning = bed.status === 'CLEANING';
          const isIsolation = bed.status === 'ISOLATION';

          let borderClass = 'border-slate-800 bg-slate-900/60';
          let dotClass = 'bg-slate-500';

          if (isAvailable) {
            borderClass = 'border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-500/60';
            dotClass = 'bg-emerald-400';
          } else if (isOccupied) {
            borderClass = 'border-rose-500/40 bg-rose-950/15 hover:border-rose-500/70';
            dotClass = 'bg-rose-500 animate-pulse';
          } else if (isCleaning) {
            borderClass = 'border-cyan-500/40 bg-cyan-950/15';
            dotClass = 'bg-cyan-400';
          } else if (isIsolation) {
            borderClass = 'border-purple-500/40 bg-purple-950/20';
            dotClass = 'bg-purple-400';
          }

          return (
            <div
              key={bed.id}
              onClick={() => handleBedClick(bed)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between relative overflow-hidden group ${borderClass}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-wider">
                    F{bed.floor}
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
                </div>

                <h4 className="text-base font-extrabold text-white font-mono">{bed.bed_number}</h4>
                <p className="text-[11px] font-semibold text-cyan-400 mt-0.5">{bed.ward_type.replace('_', ' ')}</p>
                <span className="text-[10px] text-slate-400 block font-medium mt-0.5">{bed.room_number}</span>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300">${bed.daily_rate}/d</span>
                <span className="font-semibold text-[10px] uppercase text-slate-400">{bed.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bed Details & Action Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Bed Telemetry: ${selectedBed?.bed_number}`}
        description={`${selectedBed?.ward_type.replace('_', ' ')} • Floor ${selectedBed?.floor} (${selectedBed?.room_number})`}
        size="md"
      >
        {selectedBed && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Status:</span>
                <Badge variant={selectedBed.status === 'AVAILABLE' ? 'green' : (selectedBed.status === 'OCCUPIED' ? 'red' : 'cyan')}>
                  {selectedBed.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Daily Charge:</span>
                <span className="font-bold text-white">${selectedBed.daily_rate}.00 / 24h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="font-medium text-slate-200">Floor {selectedBed.floor}, {selectedBed.room_number}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Bed Operations</span>
              <div className="grid grid-cols-2 gap-2">
                {selectedBed.status === 'AVAILABLE' ? (
                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={() => { setModalOpen(false); setAdmitModalOpen(true); }}
                    icon={<UserPlus className="w-4 h-4" />}
                  >
                    Admit Patient
                  </Button>
                ) : selectedBed.status === 'OCCUPIED' ? (
                  <>
                    <Button 
                      variant="primary" 
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white"
                      onClick={() => { setModalOpen(false); setTransferModalOpen(true); }}
                      icon={<ArrowRightLeft className="w-4 h-4" />}
                    >
                      Transfer Bed
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleStatusChange('CLEANING' as BedStatus)}
                    >
                      Discharge to Cleaning
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={() => handleStatusChange('AVAILABLE' as BedStatus)}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Mark Available
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleStatusChange('MAINTENANCE' as BedStatus)}
                  icon={<Wrench className="w-4 h-4" />}
                >
                  Set Maintenance
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Bed Transfer Modal */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Transfer Patient to Destination Bed"
        description="Select an available bed on any floor or ward to transfer the patient with complete audit tracking."
        size="md"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-500/40 text-xs space-y-1">
            <span className="text-slate-400">Source Bed:</span>
            <strong className="text-white block">{selectedBed?.bed_number} ({selectedBed?.ward_type})</strong>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Available Destination Bed *</label>
            <select
              required
              value={transferToBedId}
              onChange={(e) => setTransferToBedId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            >
              <option value="">-- Choose Available Bed --</option>
              {beds.filter(b => b.status === 'AVAILABLE').map(b => (
                <option key={b.id} value={b.id}>
                  {b.bed_number} (Floor {b.floor}, {b.ward_type.replace('_', ' ')}) - ${b.daily_rate}/d
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Reason for Transfer *</label>
            <textarea
              required
              rows={2}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setTransferModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Execute Transfer</Button>
          </div>
        </form>
      </Modal>

      {/* Quick Admit Modal */}
      <Modal
        isOpen={admitModalOpen}
        onClose={() => setAdmitModalOpen(false)}
        title={`Admit Patient to ${selectedBed?.bed_number}`}
        description="Assign attending physician and patient to this bed."
        size="md"
      >
        <form onSubmit={handleQuickAdmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Patient *</label>
            <select
              value={admitPatientId}
              onChange={(e) => setAdmitPatientId(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            >
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.mrn})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Attending Doctor *</label>
            <select
              value={admitDoctorId}
              onChange={(e) => setAdmitDoctorId(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            >
              {doctors.map(d => <option key={d.id} value={d.id}>{d.user?.full_name} ({d.specialization})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Admission Reason *</label>
            <textarea
              rows={2}
              value={admissionReason}
              onChange={(e) => setAdmissionReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setAdmitModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Admit Patient</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
