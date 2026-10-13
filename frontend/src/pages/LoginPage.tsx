import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Program, Section } from '../types';
import { apiFetch } from '../api/client';
import {
  Building2, Lock, User, ShieldCheck, AlertCircle, ArrowRight,
  Sparkles, CheckCircle2, GraduationCap, Mail, UserPlus, BookOpen, Layers
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'student';

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [roleTab, setRoleTab] = useState<'student' | 'admin'>(initialRole);
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Registration state
  const [academicOptions, setAcademicOptions] = useState<{
    programs: (Program & { sections?: Section[] })[];
    batches: number[];
    default_campus_code: string;
    default_school_code: string;
  } | null>(null);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGender, setRegGender] = useState<'female' | 'male'>('female');
  const [regAcademicYear, setRegAcademicYear] = useState<number>(2);
  const [regProgramId, setRegProgramId] = useState<number | null>(null);
  const [regBatchYear, setRegBatchYear] = useState<number>(2025);
  const [regSectionId, setRegSectionId] = useState<number | null>(null);
  const [registeredResult, setRegisteredResult] = useState<{
    roll_number: string;
    name: string;
  } | null>(null);

  // Auto-sync academic year with admission batch year:
  // Batch 2024 represents 3rd Year, Batch 2025 represents 2nd Year
  useEffect(() => {
    const yearMapping: Record<number, number> = {
      2026: 1,
      2025: 2,
      2024: 3,
      2023: 4,
      2022: 4,
    };
    if (yearMapping[regBatchYear]) {
      setRegAcademicYear(yearMapping[regBatchYear]);
    }
  }, [regBatchYear]);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin-dashboard');
      else navigate('/student-dashboard');
    }
  }, [user, navigate]);

  // Load academic options for student registration
  useEffect(() => {
    apiFetch<{
      programs: (Program & { sections?: Section[] })[];
      batches: number[];
      default_campus_code: string;
      default_school_code: string;
    }>('/auth/academic-options')
      .then(res => {
        setAcademicOptions(res);
        if (res.programs && res.programs.length > 0) {
          // Default to CSE Core program if present, or first
          const cse = res.programs.find(p => p.department_code === 'CSE') || res.programs[0];
          setRegProgramId(cse.id);
        }
      })
      .catch(err => {
        console.error('Failed to load academic options', err);
      });
  }, []);

  // Update section options when program or batch changes
  const activeProgram = academicOptions?.programs.find(p => p.id === regProgramId);
  const availableSections = activeProgram?.sections?.filter(
    s => s.admission_batch_year === regBatchYear && s.is_active
  ) || [];

  useEffect(() => {
    if (availableSections.length > 0) {
      if (!availableSections.some(s => s.id === regSectionId)) {
        setRegSectionId(availableSections[0].id);
      }
    } else {
      setRegSectionId(null);
    }
  }, [regProgramId, regBatchYear, availableSections]);

  const activeSection = availableSections.find(s => s.id === regSectionId);

  // Compute live preview of generated roll number format
  const previewRollNumber = (() => {
    if (!activeProgram) return 'CB.SC.U4CSE25001';
    const campus = activeProgram.campus_code || 'CB';
    const school = activeProgram.school_code || 'SC';
    const prefix = activeProgram.program_level_prefix || 'U4';
    const dept = (activeProgram.department_code || 'CSE').padEnd(3, 'X').slice(0, 3).toUpperCase();
    const batch2 = String(regBatchYear).slice(-2);
    const secDigit = activeSection !== undefined ? activeSection.section_digit : 0;
    const nextSeq = activeSection ? String(Math.min(activeSection.capacity, activeSection.current_count + 1)).padStart(2, '0') : '01';
    return `${campus}.${school}.${prefix}${dept}${batch2}${secDigit}${nextSeq}`;
  })();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim() || !password.trim()) {
      setError('Please enter both roll number and password.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const loggedUser = await login(rollNumber.trim(), password.trim());
      if (loggedUser.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPassword.trim() || !regProgramId) {
      setError('Please provide your name, password, and select an academic program.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await apiFetch<{
        message: string;
        roll_number: string;
        student: any;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim() || null,
          password: regPassword.trim(),
          gender: regGender,
          academic_year: regAcademicYear,
          program_id: regProgramId,
          admission_batch_year: regBatchYear,
          section_id: regSectionId,
        }),
      });

      setRegisteredResult({
        roll_number: res.roll_number,
        name: res.student.name,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (roll: string, pass: string, targetRole: 'student' | 'admin') => {
    setAuthMode('login');
    setRoleTab(targetRole);
    setRollNumber(roll);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-[#edf0f7] relative overflow-hidden text-slate-800">
      
      <div className="w-full max-w-lg">
        
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#bf0c4e] flex items-center justify-center mx-auto mb-3 shadow-lg text-white">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Stay<span className="text-[#bf0c4e]">Wise</span>
          </h2>
          <p className="text-xs text-slate-700 mt-1 font-semibold">
            Smart Hostel Booking & Automated Room Allocation System
          </p>
        </div>

        {/* Auth Mode Toggle: Sign In vs Student Registration */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-200/80 border border-slate-300 mb-6">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setError(null); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              authMode === 'login'
                ? 'bg-[#bf0c4e] text-white shadow-md'
                : 'text-slate-800 hover:text-slate-900 font-bold'
            }`}
          >
            <Lock className="w-4 h-4" />
            Sign In Portal
          </button>

          <button
            type="button"
            onClick={() => { setAuthMode('register'); setError(null); setRegisteredResult(null); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              authMode === 'register'
                ? 'bg-[#bf0c4e] text-white shadow-md'
                : 'text-slate-800 hover:text-slate-900 font-bold'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Student Registration
            <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] bg-white/25 text-white font-mono uppercase">
              Auto Roll No
            </span>
          </button>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md">
          
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* TAB 1: SIGN IN MODE */}
          {authMode === 'login' && (
            <div>
              {/* Role Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 border border-slate-200 mb-6">
                <button
                  type="button"
                  onClick={() => { setRoleTab('student'); setError(null); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    roleTab === 'student'
                      ? 'bg-[#bf0c4e] text-white shadow'
                      : 'text-slate-800 hover:text-slate-900 font-bold'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => { setRoleTab('admin'); setError(null); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    roleTab === 'admin'
                      ? 'bg-[#bf0c4e] text-white shadow'
                      : 'text-slate-800 hover:text-slate-900 font-bold'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Administrator
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    {roleTab === 'student' ? 'Student Roll Number' : 'Admin Username'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder={roleTab === 'student' ? 'e.g. CB.SC.U4CSE24001' : 'e.g. ADMIN'}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pl-11 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:border-[#bf0c4e] focus:ring-1 focus:ring-[#bf0c4e] transition-colors font-mono"
                      required
                    />
                    <User className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pl-11 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:border-[#bf0c4e] focus:ring-1 focus:ring-[#bf0c4e] transition-colors"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#bf0c4e] hover:bg-[#9f0a41] text-white font-bold text-xs shadow-md shadow-[#bf0c4e]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {submitting ? 'Authenticating...' : 'Sign In to StayWise'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Demo Quick Fill */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5 text-center">
                  Quick Demo Credentials
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('CB.SC.U4CSE24001', 'student123', 'student')}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left hover:border-[#bf0c4e] transition-colors"
                  >
                    <div className="font-bold text-[#bf0c4e] font-mono text-[11px]">CB.SC.U4CSE24001</div>
                    <div className="text-[10px] text-slate-700 font-semibold">Female Student • 3rd Year (Ananya)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('CB.SC.U4CSE24003', 'student123', 'student')}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left hover:border-[#bf0c4e] transition-colors"
                  >
                    <div className="font-bold text-[#bf0c4e] font-mono text-[11px]">CB.SC.U4CSE24003</div>
                    <div className="text-[10px] text-slate-700 font-semibold">Male Student • 3rd Year (Aarav)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('ADMIN', 'admin123', 'admin')}
                    className="col-span-2 p-2 rounded-xl bg-slate-50 border border-[#bf0c4e]/40 text-center hover:bg-[#fdf2f6] transition-colors"
                  >
                    <div className="font-bold text-[#bf0c4e]">ADMIN / admin123</div>
                    <div className="text-[10px] text-slate-700 font-semibold">Administrator Console</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENT REGISTRATION */}
          {authMode === 'register' && (
            <div>
              {registeredResult ? (
                <div className="text-center py-4 space-y-5 animate-in zoom-in-95">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-300">
                    <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                      Registration Successful
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Welcome, {registeredResult.name}!
                    </h3>
                    <p className="text-xs text-slate-700 font-medium mt-1">
                      Your official StayWise roll number has been atomically generated and registered.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border-2 border-[#bf0c4e]/30 max-w-sm mx-auto">
                    <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                      Your Generated Roll Number
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-extrabold text-[#bf0c4e] tracking-wider">
                      {registeredResult.roll_number}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setRoleTab('student');
                      setRegisteredResult(null);
                    }}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#bf0c4e] hover:bg-[#9f0a41] text-white font-bold text-xs shadow-md shadow-[#bf0c4e]/20 transition-all flex items-center justify-center gap-2"
                  >
                    Proceed to Sign In
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-[#bf0c4e] uppercase tracking-wider block mb-1">
                      New Student Onboarding
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Create Your Profile & Generate Roll Number
                    </h3>
                  </div>

                  {/* Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#bf0c4e] font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. student@college.edu"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#bf0c4e] font-medium"
                      />
                    </div>
                  </div>

                  {/* Gender & Academic Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Gender (Hostel Category) *
                      </label>
                      <select
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value as any)}
                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#bf0c4e] shadow-sm cursor-pointer"
                      >
                        <option value="female" className="bg-white text-slate-900 font-semibold">Female (Girls' Hostel)</option>
                        <option value="male" className="bg-white text-slate-900 font-semibold">Male (Boys' Hostel)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Academic Year *
                      </label>
                      <select
                        value={regAcademicYear}
                        onChange={(e) => setRegAcademicYear(Number(e.target.value))}
                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#bf0c4e] shadow-sm cursor-pointer"
                      >
                        <option value={1} className="bg-white text-slate-900 font-semibold">1st Year</option>
                        <option value={2} className="bg-white text-slate-900 font-semibold">2nd Year</option>
                        <option value={3} className="bg-white text-slate-900 font-semibold">3rd Year</option>
                        <option value={4} className="bg-white text-slate-900 font-semibold">4th Year</option>
                      </select>
                    </div>
                  </div>

                  {/* Program Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">
                      Academic Degree & Program *
                    </label>
                    <select
                      value={regProgramId || ''}
                      onChange={(e) => setRegProgramId(Number(e.target.value))}
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#bf0c4e] shadow-sm cursor-pointer"
                      required
                    >
                      {academicOptions?.programs.map((p) => (
                        <option key={p.id} value={p.id} className="bg-white text-slate-900 font-semibold">
                          [{p.program_level_prefix}] {p.program_name} ({p.department_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Batch Year & Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Admission Batch Year *
                      </label>
                      <select
                        value={regBatchYear}
                        onChange={(e) => setRegBatchYear(Number(e.target.value))}
                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#bf0c4e] shadow-sm cursor-pointer"
                      >
                        {academicOptions?.batches.map(b => (
                          <option key={b} value={b} className="bg-white text-slate-900 font-semibold">Batch {b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Assigned Section *
                      </label>
                      <select
                        value={regSectionId || ''}
                        onChange={(e) => setRegSectionId(Number(e.target.value))}
                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#bf0c4e] shadow-sm cursor-pointer disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed"
                        disabled={availableSections.length === 0}
                      >
                        {availableSections.map(s => (
                          <option key={s.id} value={s.id} className="bg-white text-slate-900 font-semibold">
                            Section {s.section_letter} (Digit {s.section_digit}) — {s.current_count}/{s.capacity} seats
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">
                      Set Password *
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#bf0c4e] font-medium"
                      required
                    />
                  </div>

                  {/* Live Roll Number Preview Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#bf0c4e]/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#bf0c4e] uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Live Roll Number Preview
                      </span>
                      <span className="text-[10px] text-slate-700 font-mono font-bold">
                        Atomic Sequence
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center shadow-inner">
                      <span className="text-base sm:text-lg font-mono font-extrabold text-[#bf0c4e] tracking-widest">
                        {previewRollNumber}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-700 leading-relaxed font-medium">
                      Format Breakdown: <strong className="text-slate-900">{activeProgram?.campus_code || 'CB'}</strong> (Campus) • <strong className="text-slate-900">{activeProgram?.school_code || 'SC'}</strong> (School) • <strong className="text-slate-900">{activeProgram?.program_level_prefix || 'U4'}</strong> (Program) • <strong className="text-slate-900">{activeProgram?.department_code || 'CSE'}</strong> (Dept) • <strong className="text-slate-900">{String(regBatchYear).slice(-2)}</strong> (Batch) • <strong className="text-slate-900">{activeSection?.section_digit ?? 0}</strong> (Sec {activeSection?.section_letter ?? 'A'})
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#bf0c4e] hover:bg-[#9f0a41] text-white font-bold text-xs shadow-md shadow-[#bf0c4e]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? 'Allocating Roll Number...' : 'Complete Registration & Generate Roll Number'}
                    <Sparkles className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
