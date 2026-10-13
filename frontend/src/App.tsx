import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { BookingWizard } from './pages/BookingWizard';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

export const AppRoutes: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#edf0f7] text-slate-800 font-sans">
      <Navbar />
      <main className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/portal" element={<Navigate to="/student-dashboard" replace />} />
          <Route path="/student-portal" element={<Navigate to="/student-dashboard" replace />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/booking" element={<BookingWizard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
