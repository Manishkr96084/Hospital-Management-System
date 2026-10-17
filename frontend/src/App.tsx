import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { EMRPage } from './pages/EMRPage';
import { LaboratoryPage } from './pages/LaboratoryPage';
import { PharmacyPage } from './pages/PharmacyPage';
import { BedMapPage } from './pages/BedMapPage';
import { AdmissionsPage } from './pages/AdmissionsPage';
import { BillingPage } from './pages/BillingPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

// Enterprise Pages
import { OPDQueuePage } from './pages/OPDQueuePage';
import { EmergencyDepartmentPage } from './pages/EmergencyDepartmentPage';
import { NursingDashboardPage } from './pages/NursingDashboardPage';
import { MARPage } from './pages/MARPage';
import { DoctorRoundsPage } from './pages/DoctorRoundsPage';
import { InsuranceClaimsPage } from './pages/InsuranceClaimsPage';
import { HospitalStructurePage } from './pages/HospitalStructurePage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white text-sm font-semibold">
        Verifying Medivanta AI session...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Authenticated Management Platform Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                
                {/* Enterprise Modules */}
                <Route path="/opd" element={<OPDQueuePage />} />
                <Route path="/emergency" element={<EmergencyDepartmentPage />} />
                <Route path="/nursing" element={<NursingDashboardPage />} />
                <Route path="/mar" element={<MARPage />} />
                <Route path="/rounds" element={<DoctorRoundsPage />} />
                <Route path="/insurance" element={<InsuranceClaimsPage />} />
                <Route path="/branches" element={<HospitalStructurePage />} />

                {/* Core Clinical Modules */}
                <Route path="/patients" element={<PatientsPage />} />
                <Route path="/patients/:id" element={<PatientDetailPage />} />
                <Route path="/doctors" element={<DoctorsPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/emr" element={<EMRPage />} />
                <Route path="/laboratory" element={<LaboratoryPage />} />
                <Route path="/pharmacy" element={<PharmacyPage />} />
                <Route path="/beds" element={<BedMapPage />} />
                <Route path="/admissions" element={<AdmissionsPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/ai-assistant" element={<AIAssistantPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
