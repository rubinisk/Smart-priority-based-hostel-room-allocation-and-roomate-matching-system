import React, { useState } from 'react';
import { Building2, ShieldCheck, Heart } from 'lucide-react';
import { TermsModal } from './TermsModal';

export const Footer: React.FC = () => {
  const [showTerms, setShowTerms] = useState<boolean>(false);
  return (
    <footer className="bg-white border-t border-slate-200 py-10 mt-auto text-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#bf0c4e] flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">
                Stay<span className="text-[#bf0c4e]">Wise</span>
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium max-w-md leading-relaxed">
              Your space. Your people. Your stay. Next-generation campus hostel allocation system providing transparent preferences, roommate group bonding, and instant bed allocations.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Hostel Portals</h4>
            <ul className="space-y-2 text-xs text-slate-700 font-medium">
              <li>Girls' Hostels (5 Blocks — Gargi, Mythreyi, Adithi, Savithri, Kapila)</li>
              <li>Boys' Hostels (8 Blocks — Agasthya, Gauthama, Vasishta, Vyasa, etc.)</li>
              <li>Roommate Invitations (DSU Algorithm)</li>
              <li>Fee Structures & Amenities</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Support & Security</h4>
            <ul className="space-y-2 text-xs text-slate-700 font-medium flex flex-col">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Student Portal
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="hover:text-[#bf0c4e] transition-colors underline font-semibold"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>Audit Trail Logging & Min-Heap Engine</li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-700 font-medium">
          <p>© 2026 StayWise Accommodation System. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-[#bf0c4e] fill-[#bf0c4e]" /> for seamless campus living.
          </p>
        </div>
      </div>

      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </footer>
  );
};
