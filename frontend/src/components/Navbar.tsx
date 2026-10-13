import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, User as UserIcon, LogOut, Bell, ShieldCheck, Home, LayoutDashboard, ChevronRight } from 'lucide-react';
import { Notification } from '../types';
import { apiFetch } from '../api/client';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const res = await apiFetch<{ notifications: Notification[] }>('/student/notifications');
      setNotifications(res.notifications);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markRead = async () => {
    try {
      await apiFetch('/student/notifications/read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      // ignore
    }
  };

  const handleNotifClick = () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs && unreadCount > 0) {
      markRead();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderBreadcrumbs = () => {
    if (location.pathname === '/') {
      return (
        <span className="text-slate-900 font-bold">Home</span>
      );
    }
    if (location.pathname === '/student-dashboard') {
      return (
        <>
          <Link to="/" className="text-[#bf0c4e] hover:text-[#9f0a41] hover:underline font-semibold">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 stroke-[2.5]" />
          <span className="text-slate-900 font-bold">Hostel Dashboard</span>
        </>
      );
    }
    if (location.pathname === '/booking') {
      return (
        <>
          <Link to="/" className="text-[#bf0c4e] hover:text-[#9f0a41] hover:underline font-semibold">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 stroke-[2.5]" />
          <Link to="/student-dashboard" className="text-[#bf0c4e] hover:text-[#9f0a41] hover:underline font-semibold">Hostel Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 stroke-[2.5]" />
          <span className="text-slate-900 font-bold">Booking Wizard</span>
        </>
      );
    }
    if (location.pathname === '/admin-dashboard') {
      return (
        <>
          <Link to="/" className="text-[#bf0c4e] hover:text-[#9f0a41] hover:underline font-semibold">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 stroke-[2.5]" />
          <span className="text-slate-900 font-bold">Administrator Console</span>
        </>
      );
    }
    if (location.pathname === '/login') {
      return (
        <>
          <Link to="/" className="text-[#bf0c4e] hover:text-[#9f0a41] hover:underline font-semibold">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 stroke-[2.5]" />
          <span className="text-slate-900 font-bold">Sign In Portal</span>
        </>
      );
    }
    return (
      <>
        <Link to="/" className="text-[#bf0c4e] hover:text-[#9f0a41] hover:underline font-semibold">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-500 stroke-[2.5]" />
        <span className="text-slate-900 font-bold">{location.pathname.replace('/', '')}</span>
      </>
    );
  };

  return (
    <header className="sticky top-0 z-40 shadow-sm transition-all">
      {/* Primary Maroon Header Bar */}
      <div className="bg-[#bf0c4e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          
          {/* Brand Logo & Portal Title */}
          <Link
            to={user ? (user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard') : '/'}
            className="flex items-center gap-2 group"
          >
            <span className="text-base sm:text-lg font-bold tracking-tight text-white hover:text-pink-100 transition-colors">
              StayWise Hostel Portal
            </span>
            <span className="hidden md:inline-block ml-2 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white/90">
              Amrita
            </span>
          </Link>

          {/* Navigation Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {!user ? (
              <Link
                to="/"
                className={`text-xs font-semibold px-2.5 py-1.5 rounded transition-colors ${
                  location.pathname === '/' ? 'bg-white/20 text-white' : 'text-white/85 hover:text-white hover:bg-white/10'
                }`}
              >
                Home
              </Link>
            ) : null}

            {user && user.role === 'student' && (
              <>
                <Link
                  to="/student-dashboard"
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors ${
                    location.pathname === '/student-dashboard' ? 'bg-white/20 text-white' : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>

                <Link
                  to="/booking"
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded transition-colors ${
                    location.pathname === '/booking' ? 'bg-white/20 text-white' : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Booking Wizard
                </Link>
              </>
            )}

            {user && user.role === 'admin' && (
              <Link
                to="/admin-dashboard"
                className={`text-xs font-semibold px-2.5 py-1.5 rounded flex items-center gap-1 transition-all ${
                  location.pathname === '/admin-dashboard' 
                    ? 'bg-white text-[#bf0c4e] font-bold shadow' 
                    : 'bg-white/15 text-white hover:bg-white hover:text-[#bf0c4e]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Portal
              </Link>
            )}

            {!user ? (
              <Link
                to="/login"
                className="text-xs font-bold px-3 py-1.5 rounded-md bg-white text-[#bf0c4e] shadow hover:bg-pink-50 transition-all"
              >
                Sign In
              </Link>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-white/20">
                
                {/* Notification Drawer Toggle */}
                {user.role === 'student' && (
                  <div className="relative">
                    <button
                      onClick={handleNotifClick}
                      className="p-1.5 rounded-md text-white/90 hover:text-white hover:bg-white/15 transition-colors relative"
                      title="Notifications"
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-900 text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    {showNotifs && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                          <h4 className="text-xs font-bold text-[#bf0c4e] flex items-center gap-1.5">
                            <Bell className="w-4 h-4" />
                            Notifications
                          </h4>
                          <span className="text-[11px] text-slate-700 font-semibold">{notifications.length} total</span>
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                          {notifications.length === 0 ? (
                            <p className="text-xs text-center py-6 text-slate-600 font-medium">No notifications yet.</p>
                          ) : (
                            notifications.map(n => (
                              <div
                                key={n.id}
                                className={`p-3 rounded-xl border text-xs transition-colors ${
                                  !n.is_read
                                    ? 'bg-[#fdf2f6] border-pink-200 text-slate-900'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className="font-semibold text-slate-900 mb-1 flex items-center justify-between">
                                  <span>{n.title}</span>
                                  <span className="text-[10px] text-slate-600 font-medium">
                                    {new Date(n.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="leading-relaxed text-slate-700 font-medium">{n.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* User Identity Chip */}
                <div className="hidden sm:flex flex-col text-right leading-tight">
                  <span className="text-xs font-semibold text-white">{user.name}</span>
                  <span className="text-[10px] text-pink-200 font-mono uppercase">
                    {user.role === 'admin' ? 'ADMIN' : user.roll_number}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-bar: Clean White Breadcrumbs Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
            {renderBreadcrumbs()}
          </div>

          <div className="text-xs text-slate-700 font-medium hidden sm:block">
            {user ? (
              <span>Logged in as: <strong className="text-[#bf0c4e] font-mono font-bold">{user.roll_number || user.role}</strong></span>
            ) : (
              <span className="text-slate-800 font-medium">Amrita Vishwa Vidyapeetham • Campus Accommodation</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
