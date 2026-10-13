import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hostel, Room, Application, User, AuditLog, Program, Section } from '../types';
import { apiFetch } from '../api/client';
import {
  ShieldCheck, LayoutDashboard, Users, Building2, Home, FileText, Play, History,
  CheckCircle2, Search, ToggleLeft, ToggleRight, Plus, RefreshCw, Layers,
  GraduationCap, Download, Upload, Check, Edit2, Sparkles, BookOpen, X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface AdminMetrics {
  total_students: number;
  total_applications: number;
  pending_applications: number;
  confirmed_groups: number;
  total_rooms: number;
  total_capacity: number;
  occupied_beds: number;
  available_beds: number;
  completed_allocations: number;
  pending_payments: number;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'academics' | 'hostels' | 'rooms' | 'applications' | 'allocation' | 'audit'>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Academic & Roll Number Management states
  const [programsList, setProgramsList] = useState<Program[]>([]);
  const [sectionsList, setSectionsList] = useState<Section[]>([]);
  const [academicBatchFilter, setAcademicBatchFilter] = useState<number>(2025);
  const [academicProgramFilter, setAcademicProgramFilter] = useState<number | 'all'>('all');
  const [rollSearchQuery, setRollSearchQuery] = useState('');
  const [rollSearchResults, setRollSearchResults] = useState<any[]>([]);
  const [isSearchingRoll, setIsSearchingRoll] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [newCapacityInput, setNewCapacityInput] = useState<number>(65);
  const [showNewProgramModal, setShowNewProgramModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvContentInput, setCsvContentInput] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [newProgramForm, setNewProgramForm] = useState({
    campus_code: 'CB',
    school_code: 'SC',
    program_level: 'U',
    program_duration_years: 4,
    department_code: '',
    program_name: '',
    degree_level: 'UG'
  });

  // Allocation engine state
  const [allocationPreview, setAllocationPreview] = useState<any>(null);
  const [runningAllocation, setRunningAllocation] = useState<boolean>(false);
  const [allocationMsg, setAllocationMsg] = useState<string | null>(null);

  // Search/Filters
  const [searchStudentRoll, setSearchStudentRoll] = useState('');
  const [appSearchRoll, setAppSearchRoll] = useState('');
  const [roomHostelFilter, setRoomHostelFilter] = useState<number | 'all'>('all');
  const [roomFloorFilter, setRoomFloorFilter] = useState<number | 'all'>('all');
  const [roomSearchTerm, setRoomSearchTerm] = useState('');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const mRes = await apiFetch<AdminMetrics>('/admin/overview');
      setMetrics(mRes);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTabContent = async () => {
    try {
      if (activeTab === 'students') {
        const res = await apiFetch<{ students: User[] }>('/admin/students');
        setStudents(res.students);
      } else if (activeTab === 'hostels') {
        const res = await apiFetch<{ hostels: Hostel[] }>('/admin/hostels');
        setHostels(res.hostels);
      } else if (activeTab === 'rooms') {
        if (hostels.length === 0) {
          const hRes = await apiFetch<{ hostels: Hostel[] }>('/admin/hostels');
          setHostels(hRes.hostels);
        }
        let url = '/admin/rooms';
        const params = new URLSearchParams();
        if (roomHostelFilter !== 'all') params.append('hostel_id', roomHostelFilter.toString());
        if (roomFloorFilter !== 'all') params.append('floor', roomFloorFilter.toString());
        if (params.toString()) url += `?${params.toString()}`;
        const res = await apiFetch<{ rooms: Room[] }>(url);
        setRooms(res.rooms);
      } else if (activeTab === 'applications') {
        const res = await apiFetch<{ applications: Application[] }>(`/admin/applications?roll_number=${appSearchRoll}`);
        setApplications(res.applications);
      } else if (activeTab === 'academics') {
        const pRes = await apiFetch<{ programs: Program[] }>('/admin/programs');
        setProgramsList(pRes.programs);
        let sUrl = `/admin/sections?batch_year=${academicBatchFilter}`;
        if (academicProgramFilter !== 'all') {
          sUrl += `&program_id=${academicProgramFilter}`;
        }
        const sRes = await apiFetch<{ sections: Section[] }>(sUrl);
        setSectionsList(sRes.sections);
      } else if (activeTab === 'audit') {
        const res = await apiFetch<{ audit_logs: AuditLog[] }>('/admin/audit-logs');
        setAuditLogs(res.audit_logs);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchOverview();
  }, [user, navigate]);

  useEffect(() => {
    fetchTabContent();
  }, [activeTab, appSearchRoll, roomHostelFilter, roomFloorFilter, academicBatchFilter, academicProgramFilter]);

  const handleSearchRollNumbers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!rollSearchQuery.trim()) {
      setRollSearchResults([]);
      return;
    }
    setIsSearchingRoll(true);
    try {
      const res = await apiFetch<{ results: any[] }>(`/admin/roll-numbers/search?q=${encodeURIComponent(rollSearchQuery.trim())}`);
      setRollSearchResults(res.results);
    } catch (err: any) {
      alert(err.message || 'Roll number search failed');
    } finally {
      setIsSearchingRoll(false);
    }
  };

  const handleToggleProgram = async (progId: number) => {
    try {
      await apiFetch(`/admin/programs/${progId}/toggle-status`, { method: 'POST' });
      fetchTabContent();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/programs', {
        method: 'POST',
        body: JSON.stringify(newProgramForm),
      });
      setShowNewProgramModal(false);
      setNewProgramForm({
        campus_code: 'CB',
        school_code: 'SC',
        program_level: 'U',
        program_duration_years: 4,
        department_code: '',
        program_name: '',
        degree_level: 'UG'
      });
      fetchTabContent();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveSectionCapacity = async () => {
    if (!editingSection) return;
    try {
      await apiFetch(`/admin/sections/${editingSection.id}`, {
        method: 'PUT',
        body: JSON.stringify({ capacity: newCapacityInput }),
      });
      setEditingSection(null);
      fetchTabContent();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportStudentsCSV = () => {
    const token = localStorage.getItem('staywise_token');
    const url = `/api/admin/students/export-csv${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    window.open(url, '_blank');
  };

  const handleImportStudentsCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContentInput.trim()) return;
    setImportStatus('Processing import and generating atomic roll numbers...');
    try {
      const res = await apiFetch<{ message: string; results: any }>('/admin/students/import-csv', {
        method: 'POST',
        body: JSON.stringify({ csv_content: csvContentInput }),
      });
      setImportStatus(`Success! Imported ${res.results.imported_count} students. ${res.results.errors?.length ? `(${res.results.errors.length} skipped)` : ''}`);
      fetchTabContent();
      fetchOverview();
    } catch (err: any) {
      setImportStatus(`Error: ${err.message}`);
    }
  };

  const handleToggleStudent = async (studentId: number) => {
    try {
      await apiFetch(`/admin/students/${studentId}/toggle-status`, { method: 'POST' });
      fetchTabContent();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRunAllocationPreview = async () => {
    setAllocationMsg(null);
    setRunningAllocation(true);
    try {
      const res = await apiFetch<{ preview: any }>('/admin/allocation/preview', { method: 'POST' });
      setAllocationPreview(res.preview);
    } catch (err: any) {
      setAllocationMsg(`Preview Error: ${err.message}`);
    } finally {
      setRunningAllocation(false);
    }
  };

  const handleConfirmAllocation = async () => {
    if (!window.confirm('Are you sure you want to commit room allocations? This will assign rooms and generate payment invoices.')) return;

    setAllocationMsg(null);
    setRunningAllocation(true);
    try {
      const res = await apiFetch<{ message: string; result: any }>('/admin/allocation/confirm', { method: 'POST' });
      setAllocationMsg(res.message);
      setAllocationPreview(res.result);
      fetchOverview();
    } catch (err: any) {
      setAllocationMsg(`Execution Error: ${err.message}`);
    } finally {
      setRunningAllocation(false);
    }
  };

  // Recharts color setup
  const COLORS = ['#F06CA9', '#10B981', '#F59E0B', '#6366F1'];
  const pieData = metrics ? [
    { name: 'Allocated', value: metrics.completed_allocations },
    { name: 'Pending Apps', value: metrics.pending_applications },
    { name: 'Available Beds', value: metrics.available_beds },
  ] : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#edf0f7] text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full space-y-8">
        
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-pink text-white flex items-center justify-center shadow-lg shadow-brand-pink/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-pink block">Administration Console</span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">StayWise Workspace</h1>
            </div>
          </div>

          <button
            onClick={fetchOverview}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#bf0c4e] text-xs font-semibold text-slate-700 hover:text-[#bf0c4e] transition-colors flex items-center gap-2 self-start"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Metrics
          </button>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-border/60 custom-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'academics', label: 'Academic & Roll Numbers', icon: GraduationCap },
            { id: 'hostels', label: '13 Hostels', icon: Building2 },
            { id: 'rooms', label: 'Rooms Inventory', icon: Home },
            { id: 'applications', label: 'Applications', icon: FileText },
            { id: 'allocation', label: 'Allocation Engine', icon: Play },
            { id: 'audit', label: 'Audit History', icon: History },
          ].map((tb) => {
            const Icon = tb.icon;
            const isActive = activeTab === tb.id;

            return (
              <button
                key={tb.id}
                onClick={() => setActiveTab(tb.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#bf0c4e] text-white shadow-md shadow-[#bf0c4e]/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-[#bf0c4e]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tb.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && metrics && (
          <div className="space-y-8 animate-in fade-in">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border">
                <span className="text-[11px] text-brand-textMuted uppercase font-semibold block mb-1">Total Students</span>
                <span className="text-2xl font-extrabold text-slate-900">{metrics.total_students}</span>
              </div>
              <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border">
                <span className="text-[11px] text-brand-textMuted uppercase font-semibold block mb-1">Applications</span>
                <span className="text-2xl font-extrabold text-brand-pink">{metrics.total_applications}</span>
              </div>
              <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border">
                <span className="text-[11px] text-brand-textMuted uppercase font-semibold block mb-1">Confirmed Groups</span>
                <span className="text-2xl font-extrabold text-violet-400">{metrics.confirmed_groups}</span>
              </div>
              <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border">
                <span className="text-[11px] text-brand-textMuted uppercase font-semibold block mb-1">Occupied / Total Beds</span>
                <span className="text-2xl font-extrabold text-emerald-400">{metrics.occupied_beds} / {metrics.total_capacity}</span>
              </div>
            </div>

            {/* Visual Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Capacity & Allocation Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border flex flex-col justify-center space-y-4">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Quick Allocation Action</h3>
                <p className="text-xs text-brand-textMuted leading-relaxed">
                  Run the StayWise Allocation Engine to evaluate all pending student applications, group bonds, and hostel floor preferences.
                </p>
                <button
                  onClick={() => setActiveTab('allocation')}
                  className="px-6 py-3 rounded-2xl bg-brand-pink hover:bg-brand-hoverPink text-white font-bold text-xs shadow-xl shadow-brand-pink/25 transition-all flex items-center justify-center gap-2 self-start"
                >
                  Open Allocation Workspace
                  <Play className="w-4 h-4 fill-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENTS */}
        {activeTab === 'students' && (
          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <h3 className="text-base font-bold text-slate-900">Registered Students ({students.length})</h3>
              <input
                type="text"
                value={searchStudentRoll}
                onChange={(e) => setSearchStudentRoll(e.target.value)}
                placeholder="Search Roll Number..."
                className="bg-brand-card border border-brand-border rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-brand-textMuted focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-brand-textMuted uppercase">
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Year</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {students
                    .filter(s => s.roll_number.toLowerCase().includes(searchStudentRoll.toLowerCase()))
                    .map(st => (
                      <tr key={st.id} className="hover:bg-brand-card/50">
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-pink">{st.roll_number}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{st.name}</td>
                        <td className="py-3.5 px-4 capitalize">{st.gender}</td>
                        <td className="py-3.5 px-4">Year {st.academic_year}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {st.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleStudent(st.id)}
                            className="px-3 py-1 rounded-lg bg-brand-card border border-brand-border text-slate-600 hover:text-white transition-colors"
                          >
                            {st.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: HOSTELS */}
        {activeTab === 'hostels' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Configured Hostels ({hostels.length} Hostels • 4 Floors Each • 100 Rooms/Floor)</h3>
              <span className="text-xs text-brand-textMuted">5 Girls' Hostels • 8 Boys' Hostels</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {hostels.map(h => (
                <div key={h.id} className="bg-brand-surface p-5 rounded-2xl border border-brand-border space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-card text-brand-pink border border-brand-border">
                          {h.code || 'HST'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base leading-snug">{h.name}</h4>
                      </div>
                      <span className="text-[11px] text-brand-textMuted">4 Floors • 400 Total Rooms</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${h.gender === 'female' ? 'bg-pink-500/20 text-pink-400' : 'bg-violet-500/20 text-violet-400'}`}>
                        {h.gender}
                      </span>
                      {h.code === 'KAP' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          PG Scholars Only
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-brand-textMuted leading-relaxed">{h.description}</p>
                  <div className="pt-2 border-t border-brand-border/60 text-xs space-y-1">
                    <span className="text-slate-600 font-semibold block">Configured Sharing Capacities:</span>
                    {h.sharing_configs.filter(c => c.is_available).map(c => (
                      <div key={c.id} className="flex justify-between text-brand-textMuted">
                        <span>{c.sharing_type}-Sharing:</span>
                        <span className="text-brand-pink font-mono font-bold">₹{c.fee_amount.toLocaleString()} / term</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ROOMS */}
        {activeTab === 'rooms' && (
          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border space-y-5 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Database Room Inventory ({rooms.length} Loaded)</h3>
                <p className="text-xs text-brand-textMuted">Every room is individually persisted in database with format HOSTELCODE-FLOOR-ROOMNUMBER</p>
              </div>

              {/* Room Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Hostel Selector */}
                <select
                  value={roomHostelFilter}
                  onChange={(e) => setRoomHostelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="bg-white border-2 border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#bf0c4e] cursor-pointer"
                >
                  <option value="all" className="bg-white text-slate-900 font-semibold">All Hostels</option>
                  {hostels.map(h => (
                    <option key={h.id} value={h.id} className="bg-white text-slate-900 font-semibold">{h.name} ({h.code})</option>
                  ))}
                </select>

                {/* Floor Selector */}
                <select
                  value={roomFloorFilter}
                  onChange={(e) => setRoomFloorFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="bg-white border-2 border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#bf0c4e] cursor-pointer"
                >
                  <option value="all" className="bg-white text-slate-900 font-semibold">All Floors</option>
                  <option value={1} className="bg-white text-slate-900 font-semibold">Ground Floor (G-101 to G-200)</option>
                  <option value={2} className="bg-white text-slate-900 font-semibold">1st Floor (F-200 to F-299)</option>
                  <option value={3} className="bg-white text-slate-900 font-semibold">2nd Floor (S-300 to S-399)</option>
                  <option value={4} className="bg-white text-slate-900 font-semibold">3rd Floor (T-400 to T-499)</option>
                </select>

                {/* Search Term */}
                <input
                  type="text"
                  value={roomSearchTerm}
                  onChange={(e) => setRoomSearchTerm(e.target.value)}
                  placeholder="Filter room # (e.g. G-101, MYT)..."
                  className="bg-brand-card border border-brand-border rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-brand-textMuted focus:outline-none focus:border-brand-pink w-52"
                />
              </div>
            </div>

            {/* Room Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {rooms
                .filter(r => {
                  if (!roomSearchTerm.trim()) return true;
                  const term = roomSearchTerm.toLowerCase().trim();
                  return r.room_number.toLowerCase().includes(term) || (r.room_code && r.room_code.toLowerCase().includes(term));
                })
                .map(r => {
                  const isSpecialMyt3 = r.room_code?.startsWith('MYT-') && r.floor === 1 && r.sharing_capacity === 3;
                  const floorName = r.floor === 1 ? 'Ground' : r.floor === 2 ? '1st Fl' : r.floor === 3 ? '2nd Fl' : '3rd Fl';
                  return (
                    <div
                      key={r.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                        isSpecialMyt3
                          ? 'bg-amber-50 border-amber-300 text-amber-950'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900 text-[11px]">{r.room_number}</span>
                        {isSpecialMyt3 && (
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">3-Share</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-600 font-medium">{floorName} • {r.sharing_capacity}-Share</div>
                      <div className="text-[10px] font-bold text-emerald-700">{r.occupied_beds}/{r.sharing_capacity} Occupied</div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 5: APPLICATIONS */}
        {activeTab === 'applications' && (
          <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-base font-bold text-slate-900">Submitted Applications ({applications.length})</h3>
              <input
                type="text"
                value={appSearchRoll}
                onChange={(e) => setAppSearchRoll(e.target.value)}
                placeholder="Filter Roll Number..."
                className="bg-white border-2 border-slate-300 rounded-xl px-3.5 py-1.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#bf0c4e]"
              />
            </div>

            <div className="space-y-3">
              {applications.map(ap => (
                <div key={ap.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {ap.student?.name} (<span className="text-[#bf0c4e] font-mono font-bold">{ap.student?.roll_number}</span>)
                    </div>
                    <div className="text-slate-600 font-medium">Reg #{ap.registration_number} • Mode: {ap.roommate_mode}</div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    ap.status === 'allocated' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {ap.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: ALLOCATION ENGINE */}
        {activeTab === 'allocation' && (
          <div className="bg-brand-surface p-6 sm:p-8 rounded-3xl border border-brand-border space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Play className="w-5 h-5 text-brand-pink fill-brand-pink" />
                StayWise Allocation Engine Workspace
              </h3>
              <p className="text-xs text-brand-textMuted mt-1">
                Preview allocation dry-runs before committing assignments to the production database.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleRunAllocationPreview}
                disabled={runningAllocation}
                className="px-6 py-3 rounded-xl bg-white border border-slate-300 hover:border-brand-pink/50 text-slate-700 hover:text-brand-pink font-bold text-xs transition-all flex items-center gap-2 shadow-sm"
              >
                <Search className="w-4 h-4 text-brand-pink" />
                Run Dry-Run Preview
              </button>

              <button
                onClick={handleConfirmAllocation}
                disabled={runningAllocation}
                className="px-8 py-3 rounded-xl bg-brand-pink hover:bg-brand-hoverPink text-white font-bold text-xs shadow-xl shadow-brand-pink/25 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Execute Allocation Run
              </button>
            </div>

            {allocationMsg && (
              <div className="p-4 rounded-2xl bg-brand-card border border-brand-pink/40 text-brand-pink text-xs font-semibold">
                {allocationMsg}
              </div>
            )}

            {allocationPreview && (
              <div className="space-y-6 pt-4 border-t border-brand-border">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-brand-card p-4 rounded-xl border border-brand-border">
                    <span className="text-[10px] text-brand-textMuted uppercase font-semibold">Applications Evaluated</span>
                    <div className="text-xl font-bold text-slate-900">{allocationPreview.summary.total_applications}</div>
                  </div>
                  <div className="bg-brand-card p-4 rounded-xl border border-brand-border">
                    <span className="text-[10px] text-brand-textMuted uppercase font-semibold">Projected Allocations</span>
                    <div className="text-xl font-bold text-emerald-400">{allocationPreview.summary.allocated_count}</div>
                  </div>
                  <div className="bg-brand-card p-4 rounded-xl border border-brand-border">
                    <span className="text-[10px] text-brand-textMuted uppercase font-semibold">Confirmed Groups</span>
                    <div className="text-xl font-bold text-violet-400">{allocationPreview.summary.confirmed_groups_allocated}</div>
                  </div>
                  <div className="bg-brand-card p-4 rounded-xl border border-brand-border">
                    <span className="text-[10px] text-brand-textMuted uppercase font-semibold">Unallocated / Waitlist</span>
                    <div className="text-xl font-bold text-rose-400">{allocationPreview.summary.unallocated_count}</div>
                  </div>
                </div>

                {/* Projected Allocations List */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3">Projected Room Assignments</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {allocationPreview.allocated.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-brand-card border border-brand-border/60 text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-900">{item.student_name}</span> (<span className="text-brand-pink font-mono">{item.student_roll}</span>)
                          <div className="text-brand-textMuted text-[11px]">{item.hostel_name} • Room {item.room_number} (Floor {item.floor})</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          Rank #{item.preference_rank_satisfied} Satisfied
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: ACADEMIC & ROLL NUMBERS */}
        {activeTab === 'academics' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Header & Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-brand-pink" />
                  Academic Programs & Roll Number System
                </h3>
                <p className="text-xs text-brand-textMuted mt-0.5">
                  Manage university programs, section seat capacities (60–65), atomic sequence generation, and student records.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewProgramModal(true)}
                  className="px-4 py-2 rounded-xl bg-brand-pink hover:bg-brand-hoverPink text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Program
                </button>

                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-brand-pink/50 text-slate-700 hover:text-brand-pink text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-brand-pink" />
                  Import CSV
                </button>

                <button
                  type="button"
                  onClick={handleExportStudentsCSV}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-emerald-500/50 text-slate-700 hover:text-emerald-600 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Roll Number Search Bar */}
            <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm space-y-4">
              <form onSubmit={handleSearchRollNumbers} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-grow w-full">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={rollSearchQuery}
                    onChange={(e) => setRollSearchQuery(e.target.value)}
                    placeholder="Search Roll Number (e.g. CB.SC.U4CSE24001) or student name..."
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-900 font-medium placeholder-slate-500 focus:outline-none focus:border-[#bf0c4e] focus:ring-1 focus:ring-[#bf0c4e] shadow-sm"
                  />
                  {rollSearchQuery && (
                    <button
                      type="button"
                      onClick={() => { setRollSearchQuery(''); setRollSearchResults([]); }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSearchingRoll}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#bf0c4e] hover:bg-[#9f0a41] text-white text-xs font-bold transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  {isSearchingRoll ? 'Searching...' : 'Search'}
                </button>
              </form>

              {/* Search Results Display */}
              {rollSearchResults.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200 mt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Search Results ({rollSearchResults.length} Students Found)
                    </h4>
                    <button
                      type="button"
                      onClick={() => { setRollSearchQuery(''); setRollSearchResults([]); }}
                      className="text-xs text-[#bf0c4e] hover:underline font-semibold"
                    >
                      Clear Results
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar">
                    {rollSearchResults.map((st) => (
                      <div key={st.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono font-bold text-sm text-[#bf0c4e]">{st.roll_number}</span>
                            <h5 className="font-bold text-slate-900 text-sm mt-0.5">{st.name}</h5>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${st.is_active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                            {st.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-700 font-medium">
                          <div>Program: <strong className="text-slate-900">{st.program_level_prefix || 'U4'}{st.department_code || 'CSE'}</strong></div>
                          <div>Batch: <strong className="text-slate-900">{st.admission_batch_year || '2025'}</strong></div>
                          <div>Section: <strong className="text-slate-900">{st.section_letter || 'A'} (Dig {st.section_digit ?? 0})</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sections & Capacity Management Panel */}
            <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand-pink" />
                    Sections & Enrolled Capacity
                  </h4>
                  <p className="text-xs text-brand-textMuted mt-0.5">
                    CSE Core supports 8 sections (A–H). Section capacities configurable between 60 and 65 students.
                  </p>
                </div>

                {/* Filters for batch year and program */}
                <div className="flex items-center gap-2.5">
                  <select
                    value={academicBatchFilter}
                    onChange={(e) => setAcademicBatchFilter(Number(e.target.value))}
                    className="bg-white border-2 border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#bf0c4e] cursor-pointer"
                  >
                    {[2025, 2024, 2023, 2022].map(b => (
                      <option key={b} value={b} className="bg-white text-slate-900 font-semibold">Batch {b}</option>
                    ))}
                  </select>

                  <select
                    value={academicProgramFilter}
                    onChange={(e) => setAcademicProgramFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="bg-white border-2 border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#bf0c4e] max-w-xs cursor-pointer"
                  >
                    <option value="all" className="bg-white text-slate-900 font-semibold">All Programs</option>
                    {programsList.map(p => (
                      <option key={p.id} value={p.id} className="bg-white text-slate-900 font-semibold">[{p.program_level_prefix}] {p.program_name} ({p.department_code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sections Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-brand-border text-brand-textMuted uppercase">
                      <th className="py-3 px-3">Batch</th>
                      <th className="py-3 px-3">Program</th>
                      <th className="py-3 px-3">Section</th>
                      <th className="py-3 px-3">Digit</th>
                      <th className="py-3 px-3">Enrolled / Cap</th>
                      <th className="py-3 px-3">Utilization</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40">
                    {sectionsList.map((sec) => {
                      const utilPct = Math.round((sec.current_count / sec.capacity) * 100);
                      return (
                        <tr key={sec.id} className="hover:bg-brand-card/50">
                          <td className="py-3 px-3 font-mono text-slate-600 font-bold">{sec.admission_batch_year}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900">{sec.program_name || 'Program'}</span>
                            <span className="ml-1 text-[10px] text-brand-pink font-mono">[{sec.program_level_prefix}{sec.department_code}]</span>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">Section {sec.section_letter}</td>
                          <td className="py-3 px-3 font-mono text-brand-pink">{sec.section_digit}</td>
                          <td className="py-3 px-3 font-mono">
                            <span className="text-slate-900 font-bold">{sec.current_count}</span>
                            <span className="text-brand-textMuted"> / {sec.capacity}</span>
                          </td>
                          <td className="py-3 px-3 w-36">
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${utilPct >= 100 ? 'bg-rose-500' : utilPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, utilPct)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-brand-textMuted mt-0.5 block">{utilPct}% filled</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSection(sec);
                                setNewCapacityInput(sec.capacity);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-brand-card border border-brand-border hover:border-brand-pink/50 text-slate-600 hover:text-brand-pink text-[11px] transition-colors inline-flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3 text-brand-pink" />
                              Edit Cap
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Academic Programs Catalogue Panel */}
            <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-brand-border pb-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand-pink" />
                    Academic Programs Catalogue ({programsList.length} Programs Configured)
                  </h4>
                  <p className="text-xs text-brand-textMuted mt-0.5">
                    All department codes must be exactly 3 uppercase alphabetic characters (e.g. CSE, AIE, ECE, MEC).
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-brand-border text-brand-textMuted uppercase sticky top-0 bg-brand-surface">
                      <th className="py-3 px-3">Campus/School</th>
                      <th className="py-3 px-3">Prefix</th>
                      <th className="py-3 px-3">Dept Code</th>
                      <th className="py-3 px-3">Program Name</th>
                      <th className="py-3 px-3">Level / Duration</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40">
                    {programsList.map((prog) => (
                      <tr key={prog.id} className="hover:bg-brand-card/50">
                        <td className="py-2.5 px-3 font-mono text-slate-600 font-bold">{prog.campus_code}.{prog.school_code}</td>
                        <td className="py-2.5 px-3 font-mono text-brand-pink font-bold">{prog.program_level_prefix}</td>
                        <td className="py-2.5 px-3 font-mono font-extrabold text-slate-900">{prog.department_code}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{prog.program_name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{prog.degree_level} ({prog.program_duration_years} yrs)</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${prog.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {prog.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleProgram(prog.id)}
                            className="px-2.5 py-1 rounded-lg bg-brand-card border border-brand-border text-slate-600 hover:text-brand-pink transition-colors"
                          >
                            {prog.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: ADD NEW PROGRAM */}
        {showNewProgramModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95">
              <button
                type="button"
                onClick={() => setShowNewProgramModal(false)}
                className="absolute top-4 right-4 p-2 text-brand-textMuted hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-brand-pink" />
                  Add Academic Program
                </h3>
                <p className="text-xs text-brand-textMuted mt-1">
                  Configure a new program with separate campus, school, and strictly 3-letter department code.
                </p>
              </div>

              <form onSubmit={handleCreateProgram} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Campus Code *</label>
                    <input
                      type="text"
                      value={newProgramForm.campus_code}
                      onChange={(e) => setNewProgramForm({ ...newProgramForm, campus_code: e.target.value.toUpperCase() })}
                      className="w-full bg-brand-card border border-brand-border rounded-xl px-3 py-2 text-xs text-slate-800 font-mono uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">School Code *</label>
                    <input
                      type="text"
                      value={newProgramForm.school_code}
                      onChange={(e) => setNewProgramForm({ ...newProgramForm, school_code: e.target.value.toUpperCase() })}
                      className="w-full bg-brand-card border border-brand-border rounded-xl px-3 py-2 text-xs text-slate-800 font-mono uppercase"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">Level *</label>
                    <select
                      value={newProgramForm.program_level}
                      onChange={(e) => setNewProgramForm({ ...newProgramForm, program_level: e.target.value })}
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#bf0c4e] cursor-pointer"
                    >
                      <option value="U" className="bg-white text-slate-900 font-semibold">U (Undergraduate)</option>
                      <option value="P" className="bg-white text-slate-900 font-semibold">P (Postgraduate)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (Yrs) *</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={newProgramForm.program_duration_years}
                      onChange={(e) => setNewProgramForm({ ...newProgramForm, program_duration_years: Number(e.target.value) })}
                      className="w-full bg-brand-card border border-brand-border rounded-xl px-3 py-2 text-xs text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Dept Code (3 Ltrs) *</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={newProgramForm.department_code}
                      onChange={(e) => setNewProgramForm({ ...newProgramForm, department_code: e.target.value.toUpperCase() })}
                      placeholder="e.g. CSE"
                      className="w-full bg-brand-card border border-brand-border rounded-xl px-3 py-2 text-xs text-slate-800 font-mono uppercase"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Program Full Name *</label>
                  <input
                    type="text"
                    value={newProgramForm.program_name}
                    onChange={(e) => setNewProgramForm({ ...newProgramForm, program_name: e.target.value })}
                    placeholder="e.g. B.Tech Computer Science and Engineering"
                    className="w-full bg-brand-card border border-brand-border rounded-xl px-3 py-2 text-xs text-slate-800"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewProgramModal(false)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-pink hover:bg-brand-hoverPink text-white text-xs font-bold shadow-md"
                  >
                    Save Program
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: EDIT SECTION CAPACITY */}
        {editingSection && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95">
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="absolute top-4 right-4 p-2 text-brand-textMuted hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold text-slate-900 mb-2">Edit Section Capacity</h3>
              <p className="text-xs text-brand-textMuted mb-4">
                Section {editingSection.section_letter} • Batch {editingSection.admission_batch_year} (Currently {editingSection.current_count} enrolled)
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Maximum Capacity (Standard 60–65)
                  </label>
                  <input
                    type="number"
                    min={editingSection.current_count}
                    max={120}
                    value={newCapacityInput}
                    onChange={(e) => setNewCapacityInput(Number(e.target.value))}
                    className="w-full bg-brand-card border border-brand-border rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSectionCapacity}
                    className="px-5 py-2 rounded-xl bg-brand-pink hover:bg-brand-hoverPink text-white text-xs font-bold shadow-md"
                  >
                    Save Capacity
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: CSV IMPORT */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95">
              <button
                type="button"
                onClick={() => { setShowImportModal(false); setImportStatus(null); }}
                className="absolute top-4 right-4 p-2 text-brand-textMuted hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-brand-pink" />
                Import Students CSV with Atomic Roll Numbers
              </h3>
              <p className="text-xs text-brand-textMuted mb-4">
                Paste student rows below. Format: <code className="text-brand-pink">name,email,gender,program_code,batch_year,section_letter,academic_year,password</code>
              </p>

              {importStatus && (
                <div className={`p-3 rounded-xl mb-4 text-xs font-semibold ${importStatus.startsWith('Success') ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'}`}>
                  {importStatus}
                </div>
              )}

              <form onSubmit={handleImportStudentsCSV} className="space-y-4">
                <textarea
                  rows={6}
                  value={csvContentInput}
                  onChange={(e) => setCsvContentInput(e.target.value)}
                  placeholder={`name,email,gender,program_code,batch_year,section_letter,academic_year,password\nAnanya Sen,ananya@univ.edu,female,CSE,2025,A,1,student123\nRohit Kumar,rohit@univ.edu,male,CSE,2025,B,1,student123`}
                  className="w-full bg-brand-card border border-brand-border rounded-xl p-3 text-xs text-slate-800 font-mono focus:outline-none focus:border-brand-pink"
                  required
                />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowImportModal(false); setImportStatus(null); }}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-pink hover:bg-brand-hoverPink text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Process Import
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900">System Audit Log Trail</h3>
            <div className="space-y-2">
              {auditLogs.map(lg => (
                <div key={lg.id} className="p-3.5 rounded-xl bg-brand-card border border-brand-border/60 text-xs flex justify-between">
                  <div>
                    <span className="font-bold text-brand-pink uppercase">{lg.action}</span>
                    <p className="text-slate-600 mt-0.5">{lg.details}</p>
                  </div>
                  <span className="text-[10px] text-brand-textMuted">{new Date(lg.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
