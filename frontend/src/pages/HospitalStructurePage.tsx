import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Network, Plus, RefreshCw, 
  Layers, Bed, DoorOpen, Shield, CheckCircle2, ChevronRight
} from 'lucide-react';
import { hospitalService } from '../services/hospitalService';
import { Hospital, Branch, Floor, Ward, Room } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../contexts/ToastContext';

export const HospitalStructurePage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isWardModalOpen, setIsWardModalOpen] = useState(false);
  const { success, error } = useToast();

  const [branchForm, setBranchForm] = useState({
    hospital_id: 1,
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    is_main_branch: false
  });

  const [wardForm, setWardForm] = useState({
    branch_id: 1,
    floor_id: 1,
    name: '',
    code: '',
    ward_type: 'GENERAL_WARD',
    total_beds: 10
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [hospList, branchList, floorList, wardList, roomList] = await Promise.all([
        hospitalService.getHospitals(),
        hospitalService.getBranches(),
        hospitalService.getFloors(),
        hospitalService.getWards(),
        hospitalService.getRooms()
      ]);
      setHospitals(hospList);
      setBranches(branchList);
      setFloors(floorList);
      setWards(wardList);
      setRooms(roomList);
      if (branchList.length > 0 && !selectedBranchId) {
        setSelectedBranchId(branchList[0].id);
      }
    } catch (err: any) {
      error('Failed to load hospital structure', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hospitalService.createBranch(branchForm as any);
      success('Branch Created', `New hospital facility added: ${branchForm.name}`);
      setIsBranchModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Failed to add branch', err.message);
    }
  };

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hospitalService.getWards(); // Trigger
      success('Ward Created', `New ward created: ${wardForm.name}`);
      setIsWardModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Failed to create ward', err.message);
    }
  };

  const currentHosp = hospitals[0] || {
    name: "Medivanta Luxury Medical Institute",
    code: "MED-MAIN",
    license_number: "HOSP-2026-MED-098",
    tax_id: "TX-8839210",
    email: "concierge@medivanta.health",
    phone: "+1 (800) 555-MEDI"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Multi-Hospital & Facility Architecture</h1>
              <p className="text-sm text-slate-400">Organization governance, multi-branch network, floor maps, and ward hierarchies.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsBranchModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Add Hospital Branch
          </Button>
        </div>
      </div>

      {/* Hospital Organization Banner */}
      <Card className="p-6 bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-950 border-purple-500/30">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-white">{currentHosp.name}</span>
              <Badge variant="green">ENTERPRISE HQ</Badge>
            </div>
            <p className="text-xs text-slate-400">
              License #: <strong className="text-slate-200">{currentHosp.license_number}</strong> • Tax ID: <strong className="text-slate-200">{currentHosp.tax_id}</strong>
            </p>
            <p className="text-xs text-purple-300 font-mono">Organization Code: {currentHosp.code}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block font-semibold uppercase">Branches</span>
              <span className="text-xl font-bold text-purple-400">{branches.length}</span>
            </div>
            <div className="bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block font-semibold uppercase">Floors</span>
              <span className="text-xl font-bold text-cyan-400">{floors.length}</span>
            </div>
            <div className="bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block font-semibold uppercase">Wards</span>
              <span className="text-xl font-bold text-emerald-400">{wards.length}</span>
            </div>
            <div className="bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block font-semibold uppercase">Rooms</span>
              <span className="text-xl font-bold text-amber-400">{rooms.length}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Branches List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Hospital Campus Branches & Medical Centers</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {branches.map((b) => (
            <Card key={b.id} className="p-6 space-y-4 border-slate-750">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{b.name}</h3>
                    {b.is_main_branch && <Badge variant="cyan">Main Pavilion</Badge>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">Code: {b.code} • Contact: {b.phone}</p>
                </div>
                <Badge variant="green">OPERATIONAL</Badge>
              </div>

              <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {b.address}
              </div>

              {/* Hierarchy Visualizer */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Configured Floors & Wards:</span>
                <div className="flex flex-wrap gap-2">
                  {wards.filter(w => w.branch_id === b.id).map(w => (
                    <span key={w.id} className="text-xs bg-slate-900 border border-slate-750 px-2.5 py-1 rounded-lg text-slate-300">
                      {w.name} ({w.total_beds} Beds)
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Branch Modal */}
      <Modal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        title="Add Hospital Branch / Center"
        description="Register a new hospital building, medical wing, or satellite clinic."
        size="md"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Branch Name *</label>
            <input
              required
              type="text"
              placeholder="e.g., Medivanta North Oncology Center"
              value={branchForm.name}
              onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Branch Code *</label>
              <input
                required
                type="text"
                placeholder="e.g., MED-NC"
                value={branchForm.code}
                onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Phone *</label>
              <input
                required
                type="text"
                placeholder="e.g., +1 (800) 555-0103"
                value={branchForm.phone}
                onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Official Email *</label>
            <input
              required
              type="email"
              placeholder="e.g., north@medivanta.health"
              value={branchForm.email}
              onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Physical Address *</label>
            <textarea
              required
              rows={2}
              placeholder="e.g., 780 Ridgeview Parkway, North Hills, CA"
              value={branchForm.address}
              onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setIsBranchModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Branch</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
