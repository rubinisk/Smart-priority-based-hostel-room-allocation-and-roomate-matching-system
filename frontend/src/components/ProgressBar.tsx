import React from 'react';
import { Check, Users, Heart, Home, CheckCircle2 } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number; // 1 to 4
}

const steps = [
  { id: 1, name: 'Friends', icon: Users, label: '01 Friends' },
  { id: 2, name: 'Preferences', icon: Heart, label: '02 Preferences' },
  { id: 3, name: 'Room Choice', icon: Home, label: '03 Room Choice' },
  { id: 4, name: 'Review & Submit', icon: CheckCircle2, label: '04 Review & Submit' },
];

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-8 shadow-sm">
      <div className="flex items-center justify-between relative">
        
        {/* Progress Line */}
        <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-200 -translate-y-1/2 z-0 hidden md:block" />
        <div
          className="absolute top-1/2 left-4 h-1 bg-gradient-to-r from-[#bf0c4e] to-emerald-500 -translate-y-1/2 z-0 transition-all duration-500 hidden md:block"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 96}%` }}
        />

        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-md'
                    : isCurrent
                    ? 'bg-[#bf0c4e] text-white ring-4 ring-[#bf0c4e]/20 shadow-md scale-110'
                    : 'bg-white border-2 border-slate-300 text-slate-700'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <Icon className="w-5 h-5" />}
              </div>

              <span
                className={`mt-2 text-xs font-semibold tracking-wide transition-colors hidden sm:block ${
                  isCurrent ? 'text-[#bf0c4e] font-bold' : isCompleted ? 'text-emerald-700 font-bold' : 'text-slate-700 font-semibold'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
