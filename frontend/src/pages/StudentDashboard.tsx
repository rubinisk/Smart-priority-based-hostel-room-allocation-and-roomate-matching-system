import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Application, Allocation, RoommateInvite, Payment } from '../types';
import { apiFetch } from '../api/client';
import {
  User, CheckCircle2, AlertCircle, Clock, CreditCard, Building2, Home, Users,
  Check, X, FileText, Sparkles, Layers, ShieldCheck, ArrowRight, ArrowLeft, Edit3
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState<Application | null>(null);
  const [allocData, setAllocData] = useState<Allocation | null>(null);
  const [invitations, setInvitations] = useState<RoommateInvite[]>([]);
  const [paymentData, setPaymentData] = useState<Payment | null>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccessTxn, setPaySuccessTxn] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Application
      const aRes = await apiFetch<{ has_application: boolean; application: Application | null }>('/student/application');
      if (aRes.has_application && aRes.application) {
        setAppData(aRes.application);
      }

      // Fetch Allocation
      const alRes = await apiFetch<{ has_allocation: boolean; allocation: Allocation | null }>('/student/allocation');
      if (alRes.has_allocation && alRes.allocation) {
        setAllocData(alRes.allocation);
      }

      // Fetch Invitations
      const iRes = await apiFetch<{ invitations: RoommateInvite[] }>('/student/invitations');
      setInvitations(iRes.invitations);

      // Fetch Payment
      const pRes = await apiFetch<{ has_payment: boolean; payment: Payment | null }>('/payment/details');
      if (pRes.has_payment && pRes.payment) {
        setPaymentData(pRes.payment);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const handleRespondInvitation = async (invitationId: number, action: 'accept' | 'reject') => {
    try {
      await apiFetch(`/student/invitations/${invitationId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleExecutePayment = async () => {
    setPayError(null);
    setPaying(true);

    try {
      const res = await apiFetch<{ transaction_id: string }>('/payment/pay', {
        method: 'POST',
        body: JSON.stringify({ payment_method: 'simulated_upi' }),
      });
      setPaySuccessTxn(res.transaction_id);
      fetchData();
    } catch (err: any) {
      setPayError(err.message || 'Simulated payment failed.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#edf0f7] text-slate-800">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#bf0c4e] border-t-transparent" />
      </div>
    );
  }

  // Determine Timeline Step Index (0..4)
  let timelineStep = 0;
  if (appData) {
    if (appData.status === 'submitted') timelineStep = 1;
    else if (appData.status === 'under_review') timelineStep = 2;
    else if (appData.status === 'allocated') timelineStep = 3;
    else if (appData.status === 'payment_completed') timelineStep = 4;
  }

  const steps = [
    { id: 0, label: 'Not Applied' },
    { id: 1, label: 'Submitted' },
    { id: 2, label: 'Under Review' },
    { id: 3, label: 'Allocated' },
    { id: 4, label: 'Payment Completed' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#edf0f7] text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full space-y-6">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 bg-white p-6 rounded-2xl shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#bf0c4e] block mb-1">Hostel Booking & Allocation Console</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Welcome, {user?.name}</h1>
            <p className="text-xs text-slate-700 font-mono mt-1 flex flex-wrap items-center gap-1.5">
              <span>Roll Number: <strong className="text-[#bf0c4e] font-bold">{user?.roll_number}</strong></span>
              {user?.department_code && (
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#fdf2f6] text-[#bf0c4e] border border-pink-200 font-sans font-bold">
                  Dept: {user.department_code} • Sec {user.section_letter || 'A'}
                </span>
              )}
              <span className="text-slate-700 font-sans font-medium">• Year {user?.academic_year}</span>
              <span className="text-slate-700 font-sans font-medium capitalize">• {user?.gender} Hostel</span>
            </p>
          </div>

          {!appData ? (
            <Link
              to="/booking"
              className="px-6 py-3 rounded-xl bg-[#bf0c4e] hover:bg-[#9f0a41] text-white font-bold text-xs shadow-md shadow-[#bf0c4e]/20 transition-all flex items-center gap-2 self-start"
            >
              Start Room Booking Wizard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/booking"
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border-2 border-slate-300 transition-all flex items-center gap-2 self-start shadow-sm"
            >
              <FileText className="w-4 h-4 text-[#bf0c4e]" />
              Manage Booking Application
            </Link>
          )}
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-700 uppercase font-bold block mb-1">Application Status</span>
            <div className="text-base font-bold text-slate-900 capitalize flex items-center gap-2">
              {appData ? appData.status.replace('_', ' ') : 'Not Submitted'}
            </div>
            {appData && <span className="text-[11px] text-[#bf0c4e] font-mono font-bold mt-1 block">Reg #{appData.registration_number}</span>}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-700 uppercase font-bold block mb-1">Roommate Mode</span>
            <div className="text-base font-bold text-slate-900 capitalize">
              {appData ? (appData.roommate_mode === 'group' ? `Friend Group` : 'Individual') : 'N/A'}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-700 uppercase font-bold block mb-1">Allocated Room</span>
            <div className="text-base font-bold text-emerald-700">
              {allocData ? `${allocData.hostel_name} - Room ${allocData.room_number}` : 'Pending Allocation'}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-700 uppercase font-bold block mb-1">Fee Payment</span>
            <div className="text-base font-bold text-slate-900 capitalize">
              {paymentData ? (
                paymentData.payment_status === 'successful' ? (
                  <span className="text-emerald-700 font-bold">Paid (₹{paymentData.amount.toLocaleString()})</span>
                ) : (
                  <span className="text-amber-800 font-bold">Due (₹{paymentData.amount.toLocaleString()})</span>
                )
              ) : 'N/A'}
            </div>
          </div>

        </div>

        {/* Application Progress Timeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#bf0c4e] mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#bf0c4e]" />
            Application Progress Timeline
          </h3>

          <div className="flex items-center justify-between relative px-2 sm:px-6">
            <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-200 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-4 h-1 bg-gradient-to-r from-[#bf0c4e] to-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${(timelineStep / 4) * 94}%` }}
            />

            {steps.map((st) => {
              const isCompleted = st.id <= timelineStep;
              const isCurrent = st.id === timelineStep;

              return (
                <div key={st.id} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-md'
                        : isCurrent
                        ? 'bg-[#bf0c4e] text-white ring-4 ring-[#bf0c4e]/20'
                        : 'bg-white border-2 border-slate-300 text-slate-600 font-bold'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : st.id}
                  </div>
                  <span className={`mt-2 text-[11px] font-bold text-center ${isCurrent ? 'text-[#bf0c4e]' : isCompleted ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Roommate Invitations Notifications */}
        {invitations.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border-2 border-[#bf0c4e]/30 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-[#bf0c4e] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#bf0c4e]" />
              Pending Roommate Invitations ({invitations.length})
            </h3>

            <div className="space-y-3">
              {invitations.map(inv => (
                <div key={inv.invitation_id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Invitation from {inv.leader_name} ({inv.leader_roll})
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Wants you to join a {inv.group_size}-person roommate group for hostel allocation.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRespondInvitation(inv.invitation_id, 'accept')}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Yes, Accept
                    </button>
                    <button
                      onClick={() => handleRespondInvitation(inv.invitation_id, 'reject')}
                      className="px-4 py-2 rounded-lg bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      No, Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Allocation Section */}
        {allocData ? (
          <div className="bg-white border-2 border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmed Bed Allocation
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900">{allocData.hostel_name}</h3>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/booking"
                  className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Application (Locked)
                </Link>

                {paymentData && paymentData.payment_status === 'pending' && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-6 py-2.5 rounded-lg bg-[#bf0c4e] hover:bg-[#9f0a41] text-white font-bold text-xs shadow-md shadow-[#bf0c4e]/20 transition-all flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay Hostel Fee (Simulated)
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-700 uppercase font-bold block mb-1">Room Number</span>
                <span className="text-lg font-bold text-[#bf0c4e] font-mono">Room {allocData.room_number}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-700 uppercase font-bold block mb-1">Floor Level</span>
                <span className="text-lg font-bold text-slate-900">Floor {allocData.floor}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-700 uppercase font-bold block mb-1">Sharing Capacity</span>
                <span className="text-lg font-bold text-slate-900">{allocData.sharing_type}-Sharing</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-700 uppercase font-bold block mb-1">Preference Satisfied</span>
                <span className="text-lg font-bold text-emerald-700">Rank #{allocData.preference_rank_satisfied}</span>
              </div>
            </div>

            {/* Roommates list */}
            {allocData.roommates && allocData.roommates.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">Allocated Co-Roommates</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {allocData.roommates.map((rm, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="font-bold text-slate-900">{rm.name}</div>
                      <div className="text-slate-700 font-mono font-bold">{rm.roll_number}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          appData && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm space-y-4">
              <Clock className="w-12 h-12 text-[#bf0c4e] mx-auto animate-pulse" />
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Application Under Review</h3>
                <p className="text-xs text-slate-700 font-medium max-w-md mx-auto">
                  Your application Reg #{appData.registration_number} is recorded. The StayWise allocation engine will allocate rooms during the admin batch run.
                </p>
              </div>

              <div>
                <Link
                  to="/booking"
                  className="px-5 py-2.5 rounded-lg bg-[#bf0c4e] hover:bg-[#9f0a41] text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-[#bf0c4e]/20 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Review, Modify, or Cancel Application
                </Link>
              </div>
            </div>
          )
        )}

        {/* Payment Modal */}
        {showPaymentModal && paymentData && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#fdf2f6] text-[#bf0c4e] flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Simulated Hostel Fee Payment</h3>
                <p className="text-xs text-slate-700 font-medium mt-1">Prototype Payment Gateway Simulation</p>
              </div>

              {paySuccessTxn ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Payment Successful!</h4>
                  <p className="text-xs text-slate-700 font-medium">Transaction ID: <span className="font-mono text-[#bf0c4e] font-bold">{paySuccessTxn}</span></p>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full py-3 rounded-lg bg-[#bf0c4e] text-white font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {payError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                      {payError}
                    </div>
                  )}

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-700 font-semibold">Hostel Block:</span>
                      <span className="font-bold text-slate-900">{allocData?.hostel_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 font-semibold">Room Assigned:</span>
                      <span className="font-bold text-slate-900">Room {allocData?.room_number}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                      <span className="font-bold text-slate-900">Total Fee Due:</span>
                      <span className="font-extrabold text-[#bf0c4e]">₹{paymentData.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleExecutePayment}
                    disabled={paying}
                    className="w-full py-3 rounded-lg bg-[#bf0c4e] hover:bg-[#9f0a41] text-white font-bold text-xs shadow-md shadow-[#bf0c4e]/20 transition-all flex items-center justify-center gap-2"
                  >
                    {paying ? 'Processing Payment...' : 'Confirm Simulated Pay Now'}
                    <CreditCard className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
