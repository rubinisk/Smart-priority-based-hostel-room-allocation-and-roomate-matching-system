import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2, ShieldCheck, Sparkles, ArrowRight, Home, Users,
  CheckCircle2, BedDouble, UserCheck, Filter
} from 'lucide-react';

interface HostelInfo {
  name: string;
  code: string;
  gender: 'female' | 'male';
  totalRooms: number;
  floors: number;
  description: string;
  restriction?: string;
  sharings: { type: string; cost: string; countDetail: string }[];
}

const ALL_13_HOSTELS: HostelInfo[] = [
  // Girls' Hostels (5 Blocks)
  {
    name: 'Gargi Bhavanam',
    code: 'GAR',
    gender: 'female',
    totalRooms: 400,
    floors: 4,
    description: 'Comfortable girls residence with modern study spaces and quiet academic environment.',
    sharings: [
      { type: '1-Sharing (Single)', cost: '₹75,000 / term', countDetail: '200 rooms (50 on each floor)' },
      { type: '3-Sharing (Triple)', cost: '₹55,000 / term', countDetail: '200 rooms (50 on each floor)' },
    ],
  },
  {
    name: 'Mythreyi Bhavanam',
    code: 'MYT',
    gender: 'female',
    totalRooms: 400,
    floors: 4,
    description: 'Active campus residence with vibrant student community and spacious room options.',
    sharings: [
      { type: '2-Sharing (Double)', cost: '₹65,000 / term', countDetail: '196 rooms (46 on F1, 50 on F2-F4)' },
      { type: '3-Sharing (Triple)', cost: '₹55,000 / term', countDetail: '8 rooms (Dedicated on Floor 1)' },
      { type: '4-Sharing (Quad)', cost: '₹45,000 / term', countDetail: '196 rooms (46 on F1, 50 on F2-F4)' },
    ],
  },
  {
    name: 'Adithi Bhavanam',
    code: 'ADI',
    gender: 'female',
    totalRooms: 400,
    floors: 4,
    description: 'Contemporary residence block with green courtyards and dedicated reading rooms.',
    sharings: [
      { type: '1-Sharing (Single)', cost: '₹75,000 / term', countDetail: '200 rooms (50 on each floor)' },
      { type: '4-Sharing (Quad)', cost: '₹45,000 / term', countDetail: '200 rooms (50 on each floor)' },
    ],
  },
  {
    name: 'Savithri Bhavanam',
    code: 'SAV',
    gender: 'female',
    totalRooms: 400,
    floors: 4,
    description: 'Spacious block featuring single-sharing on Floor 1 and shared suites on upper floors.',
    sharings: [
      { type: '1-Sharing (Single)', cost: '₹75,000 / term', countDetail: '100 rooms (Entire Floor 1)' },
      { type: '2-Sharing (Double)', cost: '₹65,000 / term', countDetail: '150 rooms (50 on F2-F4)' },
      { type: '4-Sharing (Quad)', cost: '₹45,000 / term', countDetail: '150 rooms (50 on F2-F4)' },
    ],
  },
  {
    name: 'Kapila Bhavanam',
    code: 'KAP',
    gender: 'female',
    totalRooms: 400,
    floors: 4,
    restriction: 'Female M.Tech & PhD Scholars Only',
    description: 'Designated research accommodation exclusively for female postgraduate & doctoral scholars.',
    sharings: [
      { type: '1-Sharing (Single)', cost: '₹75,000 / term', countDetail: '400 rooms (100 on each floor)' },
    ],
  },

  // Boys' Hostels (8 Blocks)
  {
    name: 'Agasthya Bhavanam',
    code: 'AGA',
    gender: 'male',
    totalRooms: 400,
    floors: 4,
    description: 'Spacious four-sharing accommodation block close to campus sports complex.',
    sharings: [
      { type: '4-Sharing (Quad)', cost: '₹45,000 / term', countDetail: '400 rooms (100 on each floor)' },
    ],
  },
  {
    name: 'Gauthama Bhavanam',
    code: 'GAU',
    gender: 'male',
    totalRooms: 400,
    floors: 4,
    description: 'Single-occupancy residence designed for focused individual study and seniors.',
    sharings: [
      { type: '1-Sharing (Single)', cost: '₹75,000 / term', countDetail: '400 rooms (100 on each floor)' },
    ],
  },
  {
    name: 'Vasishta Bhavanam',
    code: 'VAS',
    gender: 'male',
    totalRooms: 400,
    floors: 4,
    description: 'Community living residence with spacious four-sharing rooms and study halls.',
    sharings: [
      { type: '4-Sharing (Quad)', cost: '₹45,000 / term', countDetail: '400 rooms (100 on each floor)' },
    ],
  },
  {
    name: 'Sri Vyasa Maharshi Bhavanam',
    code: 'VYA',
    gender: 'male',
    totalRooms: 400,
    floors: 4,
    description: 'Quiet single-occupancy residence block situated in the north campus.',
    sharings: [
      { type: '1-Sharing (Single)', cost: '₹75,000 / term', countDetail: '400 rooms (100 on each floor)' },
    ],
  },
  {
    name: 'Nachiketas Bhavanam',
    code: 'NAC',
    gender: 'male',
    totalRooms: 400,
    floors: 4,
    description: 'Modern single-sharing accommodation with high-speed internet and library access.',
    sharings: [
      { type: '1-Sharing (Single)', cost: '₹75,000 / term', countDetail: '400 rooms (100 on each floor)' },
    ],
  },
  {
    name: 'Yagnavalkya Bhavanam',
    code: 'YAG',
    gender: 'male',
    totalRooms: 400,
    floors: 4,
    description: 'Four-sharing residence featuring recreational lounges and outdoor green spaces.',
    sharings: [
      { type: '4-Sharing (Quad)', cost: '₹45,000 / term', countDetail: '400 rooms (100 on each floor)' },
    ],
  },
  {
    name: 'Kashyapa Bhavanam',
    code: 'KAS',
    gender: 'male',
    totalRooms: 400,
    floors: 4,
    description: 'Multi-sharing residence with triple and four-sharing rooms across four floors.',
    sharings: [
      { type: '3-Sharing (Triple)', cost: '₹55,000 / term', countDetail: '250 rooms (100 on F1, 50 on F2-F4)' },
      { type: '4-Sharing (Quad)', cost: '₹45,000 / term', countDetail: '150 rooms (50 on F2-F4)' },
    ],
  },
  {
    name: 'Bhrigu Bhavanam',
    code: 'BRI',
    gender: 'male',
    totalRooms: 400,
    floors: 4,
    description: 'Versatile residence block featuring single, double, and triple-sharing accommodation.',
    sharings: [
      { type: '1-Sharing (Single)', cost: '₹75,000 / term', countDetail: '100 rooms (Entire Floor 1)' },
      { type: '2-Sharing (Double)', cost: '₹65,000 / term', countDetail: '150 rooms (50 on F2-F4)' },
      { type: '3-Sharing (Triple)', cost: '₹55,000 / term', countDetail: '150 rooms (50 on F2-F4)' },
    ],
  },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filterGender, setFilterGender] = useState<'all' | 'female' | 'male'>('all');

  const filteredHostels = ALL_13_HOSTELS.filter(h => {
    if (filterGender === 'all') return true;
    return h.gender === filterGender;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#edf0f7] text-slate-800">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fdf2f6] border border-[#bf0c4e]/30 text-[#bf0c4e] text-xs font-semibold uppercase tracking-wider mb-5 shadow-sm">
            <Sparkles className="w-4 h-4 text-[#bf0c4e]" />
            Amrita Vishwa Vidyapeetham • StayWise Hostel Portal 2026
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-5 leading-tight">
            Your space. Your people. <br />
            <span className="text-[#bf0c4e]">
              Your stay.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 mb-8 leading-relaxed">
            Rank hostel preferences, form verified roommate groups with two-way approval, and select your preferred rooms with guaranteed transparent algorithmic allocation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            {user ? (
              <Link
                to={user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard'}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#bf0c4e] hover:bg-[#9f0a41] text-white font-bold text-sm shadow-md shadow-[#bf0c4e]/20 transition-all flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#bf0c4e] hover:bg-[#9f0a41] text-white font-bold text-sm shadow-md shadow-[#bf0c4e]/20 transition-all flex items-center justify-center gap-2"
                >
                  Student Login & Apply
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/login?role=admin"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:border-[#bf0c4e] hover:text-[#bf0c4e] font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-[#bf0c4e]" />
                  Admin Portal
                </Link>
              </>
            )}
          </div>

          {/* Quick Demo Credentials Info */}
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-4 px-6 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 shadow-sm">
            <span className="font-bold text-slate-800">Demo Accounts:</span>
            <span>Student: <code className="text-[#bf0c4e] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">CB.SC.U4CSE24001</code> / <code className="text-slate-700 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">student123</code></span>
            <span className="text-slate-300">|</span>
            <span>Admin: <code className="text-[#bf0c4e] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">ADMIN</code> / <code className="text-slate-700 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">admin123</code></span>
          </div>

        </div>
      </section>

      {/* 3-Step Process Explanation */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1">
              How StayWise Booking Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 font-medium">
              Three simple steps from roll number verification to confirmed room allocation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
              <span className="text-3xl font-extrabold text-[#bf0c4e]/20 absolute top-4 right-5 font-mono">01</span>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Submit Preferences & Friends</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Log in with your roll number, rank up to 5 hostel choices, select preferred rooms, and invite friends with instant approval notification.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
              <span className="text-3xl font-extrabold text-[#bf0c4e]/20 absolute top-4 right-5 font-mono">02</span>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Automated Allocation Run</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The min-heap allocation engine verifies roommate groups atomically, respects floor options, and matches exact room bed capacities.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
              <span className="text-3xl font-extrabold text-[#bf0c4e]/20 absolute top-4 right-5 font-mono">03</span>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Confirm Allocation & Pay</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                View your confirmed hostel block, floor, room number, and co-roommates. Complete simulated fee payment to finalize booking.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Complete 13 Hostels Inventory Showcase */}
      <section className="py-12 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#fdf2f6] text-[#bf0c4e] text-xs font-bold uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5" />
                Comprehensive Campus Residences
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                All 13 Campus Hostels & Sharing Plans
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
                4 Floors per hostel • 100 Rooms per floor (Room format: <code className="font-mono text-[#bf0c4e] font-bold">CODE-F1-001</code>) • 5,200 total rooms
              </p>
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start md:self-auto">
              <button
                type="button"
                onClick={() => setFilterGender('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterGender === 'all'
                    ? 'bg-[#bf0c4e] text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 font-bold'
                }`}
              >
                All Hostels (13)
              </button>
              <button
                type="button"
                onClick={() => setFilterGender('female')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterGender === 'female'
                    ? 'bg-[#bf0c4e] text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 font-bold'
                }`}
              >
                Girls' Hostels (5)
              </button>
              <button
                type="button"
                onClick={() => setFilterGender('male')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterGender === 'male'
                    ? 'bg-[#bf0c4e] text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 font-bold'
                }`}
              >
                Boys' Hostels (8)
              </button>
            </div>
          </div>

          {/* 13 Hostels Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHostels.map((hostel) => (
              <div
                key={hostel.code}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top */}
                <div className="p-6">
                  
                  {/* Badges Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-slate-100 text-[#bf0c4e] border border-slate-200">
                      Code: {hostel.code}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {hostel.restriction && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          PG Scholars Only
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          hostel.gender === 'female'
                            ? 'bg-[#fdf2f6] text-[#bf0c4e] border border-pink-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {hostel.gender === 'female' ? "Girls' Hostel" : "Boys' Hostel"}
                      </span>
                    </div>
                  </div>

                  {/* Hostel Title */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#bf0c4e] transition-colors">
                    {hostel.name}
                  </h3>
                  
                  <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">
                    {hostel.description}
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-700 font-semibold">
                    <span>{hostel.floors} Floors</span>
                    <span>•</span>
                    <span>{hostel.totalRooms} Total Rooms</span>
                    <span>•</span>
                    <span>100 Rms/Floor</span>
                  </div>

                  {/* Sharing Capacities & Pricing List */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                      Available Sharing Options & Costs
                    </span>

                    <div className="space-y-2">
                      {hostel.sharings.map((sh, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              {sh.type}
                            </span>
                            <span className="text-[10px] text-slate-700 font-medium">
                              {sh.countDetail}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-[#bf0c4e] block">
                              {sh.cost}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Card Action Footnote */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-semibold text-[11px]">Room IDs: {hostel.code}-F1-001..100</span>
                  <Link
                    to="/booking"
                    className="font-bold text-[#bf0c4e] hover:text-[#9f0a41] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    Select Room <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Clean Bottom Bar (No Marketing Footer) */}
      <div className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-700 font-medium">
        © 2026 Amrita Vishwa Vidyapeetham • StayWise Smart Hostel Booking & Allocation System
      </div>

    </div>
  );
};
