import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Sparkles, FileText, Check, Copy, AlertCircle, FileCheck2, HeartHandshake } from 'lucide-react';
import { hospitalService } from '../../services/hospitalService';
import { useToast } from '../../contexts/ToastContext';

interface DoctorAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  onApplyDraft?: (draftText: string) => void;
}

export const DoctorAIAssistantModal: React.FC<DoctorAIAssistantModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  onApplyDraft,
}) => {
  const [actionType, setActionType] = useState<'draft_soap_note' | 'draft_discharge_summary' | 'summarize_history' | 'simplify_for_patient'>('draft_soap_note');
  const [rawNotes, setRawNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    generated_text: string;
    key_findings: string[];
    recommended_precautions: string[];
  } | null>(null);

  const { success, error } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await hospitalService.doctorAIAssist(patientId, actionType, rawNotes);
      setResult(data);
      success('AI Clinical Draft Ready', 'Please review, modify, and authorize before saving.');
    } catch (err: any) {
      error('Failed to generate AI assistance', err.response?.data?.error || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.generated_text) {
      navigator.clipboard.writeText(result.generated_text);
      success('Copied to Clipboard', 'You can paste this draft into clinical documentation.');
    }
  };

  const handleApply = () => {
    if (result?.generated_text && onApplyDraft) {
      onApplyDraft(result.generated_text);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Medivanta Clinical AI Assistant"
      subtitle={`Authorized Clinical Copilot for ${patientName}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl">
          {[
            { id: 'draft_soap_note', label: 'SOAP Note', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'draft_discharge_summary', label: 'Discharge Plan', icon: <FileCheck2 className="w-3.5 h-3.5" /> },
            { id: 'summarize_history', label: 'Patient Dossier', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'simplify_for_patient', label: 'Patient Advice', icon: <HeartHandshake className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActionType(tab.id as any);
                setResult(null);
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                actionType === tab.id
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Doctor Raw Input Prompt */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Raw Dictation / Key Observations (Optional)
          </label>
          <textarea
            rows={3}
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            placeholder="e.g., 3-day history of cough, mild fever 99.8F, chest clear, BP 120/80, SpO2 98%. Advised hydration and follow-up."
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-white"
          />
        </div>

        <Button
          onClick={handleGenerate}
          isLoading={loading}
          variant="primary"
          className="w-full"
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          Generate Structured Clinical Draft
        </Button>

        {/* AI Result Box */}
        {result && (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>AI-Assisted Draft. Requires clinical review and verification by the attending physician before formal EMR record entry.</span>
            </div>

            {/* Generated Output Preview */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto font-mono">
              {result.generated_text}
            </div>

            {/* Key Findings / Badges */}
            {result.key_findings.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">Key Insights:</span>
                {result.key_findings.map((f, i) => (
                  <span key={i} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                    {f}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                Copy Text
              </Button>
              {onApplyDraft && (
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={handleApply}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                >
                  Insert into Clinical Notes
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
