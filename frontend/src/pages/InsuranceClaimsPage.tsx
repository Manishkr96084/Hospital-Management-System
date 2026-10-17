import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, FileCheck, AlertCircle, Plus, 
  RefreshCw, CreditCard, DollarSign, CheckCircle2, FileText, Search
} from 'lucide-react';
import { hospitalService } from '../services/hospitalService';
import { InsurancePolicy, InsuranceClaim, InsuranceClaimStatus, Patient } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../contexts/ToastContext';

export const InsuranceClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeTab, setActiveTab] = useState<'claims' | 'policies'>('claims');
  const [loading, setLoading] = useState(true);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);
  const [isAdjudicateModalOpen, setIsAdjudicateModalOpen] = useState(false);
  const { success, error } = useToast();

  const [claimForm, setClaimForm] = useState({
    patient_id: '',
    policy_id: '',
    total_claimed_amount: '3500.00',
    diagnosis_codes: 'ICD-10: I10, E11.9',
    procedure_codes: 'CPT: 99223, 93000',
    notes: ''
  });

  const [policyForm, setPolicyForm] = useState({
    patient_id: '',
    provider_name: 'Blue Cross Blue Shield Healthcare',
    policy_number: 'BCBS-GOLD-9948210',
    member_id: 'MEM-7749102',
    group_number: 'GRP-55410',
    coverage_amount: '50000',
    co_pay_percentage: '10',
    valid_from: '2026-01-01',
    valid_to: '2026-12-31',
    pre_auth_required: true
  });

  const [adjudicateForm, setAdjudicateForm] = useState<{
    status: InsuranceClaimStatus;
    approved_amount: string;
    rejected_amount: string;
    patient_co_pay_amount: string;
    denial_reason: string;
    notes: string;
  }>({
    status: 'APPROVED',
    approved_amount: '3150',
    rejected_amount: '0',
    patient_co_pay_amount: '350',
    denial_reason: '',
    notes: 'Approved under in-network standard cashless medical authorization.'
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [claimList, policyList, patList] = await Promise.all([
        hospitalService.getInsuranceClaims(),
        hospitalService.getInsurancePolicies(),
        hospitalService.getPatients()
      ]);
      setClaims(claimList);
      setPolicies(policyList);
      setPatients(patList);
    } catch (err: any) {
      error('Failed to load insurance data', err.message);
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hospitalService.submitInsuranceClaim({
        patient_id: Number(claimForm.patient_id),
        policy_id: Number(claimForm.policy_id),
        total_claimed_amount: Number(claimForm.total_claimed_amount),
        diagnosis_codes: claimForm.diagnosis_codes,
        procedure_codes: claimForm.procedure_codes,
        notes: claimForm.notes
      });
      success('Claim Submitted', 'Insurance claim dispatched to provider for cashless clearance.');
      setIsClaimModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Failed to file claim', err.message);
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hospitalService.registerInsurancePolicy({
        patient_id: Number(policyForm.patient_id),
        provider_name: policyForm.provider_name,
        policy_number: policyForm.policy_number,
        member_id: policyForm.member_id,
        group_number: policyForm.group_number,
        coverage_amount: Number(policyForm.coverage_amount),
        remaining_coverage: Number(policyForm.coverage_amount),
        co_pay_percentage: Number(policyForm.co_pay_percentage),
        valid_from: policyForm.valid_from,
        valid_to: policyForm.valid_to,
        pre_auth_required: policyForm.pre_auth_required
      });
      success('Policy Registered', 'Patient health insurance policy verified.');
      setIsPolicyModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Failed to register policy', err.message);
    }
  };

  const handleAdjudicateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    try {
      await hospitalService.updateInsuranceClaim(selectedClaim.id, {
        status: adjudicateForm.status,
        approved_amount: Number(adjudicateForm.approved_amount),
        rejected_amount: Number(adjudicateForm.rejected_amount),
        patient_co_pay_amount: Number(adjudicateForm.patient_co_pay_amount),
        denial_reason: adjudicateForm.denial_reason,
        notes: adjudicateForm.notes
      });
      success('Claim Adjudicated', `Claim updated to ${adjudicateForm.status}.`);
      setIsAdjudicateModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Failed to update claim', err.message);
    }
  };

  const openAdjudicateModal = (claim: InsuranceClaim) => {
    setSelectedClaim(claim);
    setAdjudicateForm({
      status: 'APPROVED',
      approved_amount: (claim.total_claimed_amount * 0.9).toFixed(2),
      rejected_amount: '0.00',
      patient_co_pay_amount: (claim.total_claimed_amount * 0.1).toFixed(2),
      denial_reason: '',
      notes: 'Approved under in-network policy terms.'
    });
    setIsAdjudicateModalOpen(true);
  };

  const totalClaimed = claims.reduce((acc, c) => acc + c.total_claimed_amount, 0);
  const totalApproved = claims.reduce((acc, c) => acc + c.approved_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Insurance & Cashless Claims Management</h1>
              <p className="text-sm text-slate-400">Third-Party Administrator (TPA) clearance, pre-authorization tracking, and settlement pipeline.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsPolicyModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Register Policy
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsClaimModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            File Claim
          </Button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950/20 border-indigo-500/30">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Total Claims Filed</span>
          <p className="text-3xl font-extrabold text-white mt-1">${totalClaimed.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-slate-900 to-emerald-950/20 border-emerald-500/30">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Approved / Settled</span>
          <p className="text-3xl font-extrabold text-white mt-1">${totalApproved.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-slate-900 to-cyan-950/20 border-cyan-500/30">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Active Verified Policies</span>
          <p className="text-3xl font-extrabold text-white mt-1">{policies.length}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'claims' 
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Insurance Claims Pipeline ({claims.length})
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'policies' 
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Patient Policy Registry ({policies.length})
        </button>
      </div>

      {/* Claims List */}
      {activeTab === 'claims' && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">Adjudication & Claims Pipeline</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Claim #</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Claimed</th>
                  <th className="py-3 px-4">Approved</th>
                  <th className="py-3 px-4">Co-Pay</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Adjudication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {claims.map((c) => {
                  const isApproved = c.status === 'APPROVED' || c.status === 'SETTLED';
                  const isSubmitted = c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW';

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                        {c.claim_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{c.patient?.full_name}</div>
                        <div className="text-xs text-slate-400 font-mono">MRN: {c.patient?.mrn}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-300">
                        {c.policy?.provider_name || 'Insurance TPA'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        ${c.total_claimed_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        ${c.approved_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-amber-400 font-semibold">
                        ${c.patient_co_pay_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={isApproved ? 'green' : (isSubmitted ? 'blue' : 'amber')}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openAdjudicateModal(c)}
                        >
                          Review & Settle
                        </Button>
                      </td>
                    </tr>
                  );
                })}

                {claims.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      No insurance claims logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Policies Registry */}
      {activeTab === 'policies' && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">Patient Insurance Policies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((p) => (
              <div key={p.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-750 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-base">{p.provider_name}</span>
                  <Badge variant="green">ACTIVE POLICY</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Policy Number:</span>
                    <strong className="text-white font-mono">{p.policy_number}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Member ID:</span>
                    <strong className="text-indigo-300 font-mono">{p.member_id}</strong>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-400 block">Total Coverage:</span>
                    <strong className="text-emerald-400">${p.coverage_amount.toLocaleString()}</strong>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-400 block">Co-Pay:</span>
                    <strong className="text-amber-400">{p.co_pay_percentage}%</strong>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Validity: {p.valid_from} to {p.valid_to}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* File Claim Modal */}
      <Modal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        title="Submit Insurance Cashless Claim"
        description="File an inpatient or clinical claim for insurance adjudication."
        size="md"
      >
        <form onSubmit={handleCreateClaim} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Patient *</label>
            <select
              required
              value={claimForm.patient_id}
              onChange={(e) => setClaimForm({ ...claimForm, patient_id: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.mrn})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Insurance Policy *</label>
            <select
              required
              value={claimForm.policy_id}
              onChange={(e) => setClaimForm({ ...claimForm, policy_id: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            >
              <option value="">-- Choose Verified Policy --</option>
              {policies.map(pol => <option key={pol.id} value={pol.id}>{pol.provider_name} ({pol.policy_number})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Total Claim Amount ($) *</label>
            <input
              required
              type="number"
              step="0.01"
              value={claimForm.total_claimed_amount}
              onChange={(e) => setClaimForm({ ...claimForm, total_claimed_amount: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Diagnosis Codes</label>
              <input
                type="text"
                value={claimForm.diagnosis_codes}
                onChange={(e) => setClaimForm({ ...claimForm, diagnosis_codes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Procedure Codes</label>
              <input
                type="text"
                value={claimForm.procedure_codes}
                onChange={(e) => setClaimForm({ ...claimForm, procedure_codes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setIsClaimModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Submit Claim</Button>
          </div>
        </form>
      </Modal>

      {/* Register Policy Modal */}
      <Modal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        title="Register Patient Insurance Policy"
        description="Add health insurance card details for cashless clearance."
        size="md"
      >
        <form onSubmit={handleCreatePolicy} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Patient *</label>
            <select
              required
              value={policyForm.patient_id}
              onChange={(e) => setPolicyForm({ ...policyForm, patient_id: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.mrn})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Insurance Provider Name *</label>
            <input
              required
              type="text"
              value={policyForm.provider_name}
              onChange={(e) => setPolicyForm({ ...policyForm, provider_name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Policy Number *</label>
              <input
                required
                type="text"
                value={policyForm.policy_number}
                onChange={(e) => setPolicyForm({ ...policyForm, policy_number: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Member ID *</label>
              <input
                required
                type="text"
                value={policyForm.member_id}
                onChange={(e) => setPolicyForm({ ...policyForm, member_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Coverage Limit ($)</label>
              <input
                type="number"
                value={policyForm.coverage_amount}
                onChange={(e) => setPolicyForm({ ...policyForm, coverage_amount: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Patient Co-Pay (%)</label>
              <input
                type="number"
                value={policyForm.co_pay_percentage}
                onChange={(e) => setPolicyForm({ ...policyForm, co_pay_percentage: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setIsPolicyModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Verify & Save Policy</Button>
          </div>
        </form>
      </Modal>

      {/* Adjudicate Modal */}
      <Modal
        isOpen={isAdjudicateModalOpen}
        onClose={() => setIsAdjudicateModalOpen(false)}
        title="Adjudicate & Settle Claim"
        description="Process provider approval, approved payout amount, and patient co-pay."
        size="md"
      >
        {selectedClaim && (
          <form onSubmit={handleAdjudicateSubmit} className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/40 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Claim Number:</span>
                <span className="font-bold text-white font-mono">{selectedClaim.claim_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Claimed:</span>
                <span className="font-bold text-indigo-300">${selectedClaim.total_claimed_amount.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Adjudication Status *</label>
              <select
                value={adjudicateForm.status}
                onChange={(e) => setAdjudicateForm({ ...adjudicateForm, status: e.target.value as InsuranceClaimStatus })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
              >
                <option value="APPROVED">APPROVED (Full Approval)</option>
                <option value="PARTIALLY_APPROVED">PARTIALLY APPROVED</option>
                <option value="SETTLED">SETTLED (Payment Dispatched)</option>
                <option value="REJECTED">REJECTED (Denied Coverage)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Approved Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={adjudicateForm.approved_amount}
                  onChange={(e) => setAdjudicateForm({ ...adjudicateForm, approved_amount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Patient Co-Pay ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={adjudicateForm.patient_co_pay_amount}
                  onChange={(e) => setAdjudicateForm({ ...adjudicateForm, patient_co_pay_amount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
                />
              </div>
            </div>

            {adjudicateForm.status === 'REJECTED' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Denial Reason</label>
                <input
                  type="text"
                  placeholder="e.g., Non-covered cosmetic procedure, policy lapsed..."
                  value={adjudicateForm.denial_reason}
                  onChange={(e) => setAdjudicateForm({ ...adjudicateForm, denial_reason: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="outline" onClick={() => setIsAdjudicateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Submit Settlement</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
