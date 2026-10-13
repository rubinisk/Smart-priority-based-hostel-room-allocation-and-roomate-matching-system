import React from 'react';
import { X, ShieldCheck, FileText, Check } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  showAcceptButton = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 text-slate-800">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fdf2f6] text-[#bf0c4e] flex items-center justify-center border border-[#bf0c4e]/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Terms & Conditions</h3>
              <p className="text-xs text-slate-700 font-medium">StayWise Hostel Accommodation Regulations</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed custom-scrollbar">
          
          <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#fdf2f6] text-[#bf0c4e] flex items-center justify-center text-[11px] font-mono font-bold">1</span>
              Allocation Eligibility & Cycle Lock
            </h4>
            <p className="text-slate-700 font-medium">
              Each student is eligible for at most one bed allocation per academic year. Once an application is submitted, preferences are locked for the scheduled algorithmic allocation cycle.
            </p>
          </div>

          <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#fdf2f6] text-[#bf0c4e] flex items-center justify-center text-[11px] font-mono font-bold">2</span>
              Atomic Group Allocation
            </h4>
            <p className="text-slate-700 font-medium">
              Confirmed roommate groups of 2 to 4 members are treated as an atomic booking unit. The allocation algorithm guarantees group members are assigned to the same room or collectively waitlisted. Groups are never split across separate rooms.
            </p>
          </div>

          <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#fdf2f6] text-[#bf0c4e] flex items-center justify-center text-[11px] font-mono font-bold">3</span>
              Room Sharing & Seniority Rules
            </h4>
            <p className="text-slate-700 font-medium">
              Single-sharing rooms are strictly reserved for students in Year 3 or above. Double, triple, and four-sharing options are available to all active students based on group size compatibility.
            </p>
          </div>

          <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#fdf2f6] text-[#bf0c4e] flex items-center justify-center text-[11px] font-mono font-bold">4</span>
              Deterministic Min-Heap Allocation
            </h4>
            <p className="text-slate-700 font-medium">
              Rooms are allotted using a priority heap. Exact group-capacity matches take strict precedence over compatible surplus rooms. Equivalent candidates are resolved deterministically using verified First-Come, First-Served (FCFS) timestamps.
            </p>
          </div>

          <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#fdf2f6] text-[#bf0c4e] flex items-center justify-center text-[11px] font-mono font-bold">5</span>
              Curfew & Non-Transferability
            </h4>
            <p className="text-slate-700 font-medium">
              Hostel residents must observe mandatory campus curfew. Allotted rooms and bed positions are non-transferable. Subletting, unauthorized swapping, or hosting unverified guests will incur disciplinary action.
            </p>
          </div>

          <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#fdf2f6] text-[#bf0c4e] flex items-center justify-center text-[11px] font-mono font-bold">6</span>
              Fee Confirmation Schedule
            </h4>
            <p className="text-slate-700 font-medium">
              Allotted students must complete simulated hostel fee settlement within the designated confirmation window. Unconfirmed allotments will be cancelled and automatically released to waitlisted students.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Official University Accommodation Policy
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold transition-all shadow-sm"
            >
              Close
            </button>
            {showAcceptButton && onAccept && (
              <button
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-[#bf0c4e] hover:bg-[#9f0a41] text-white text-xs font-bold shadow-md shadow-[#bf0c4e]/20 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                I Agree & Accept
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
