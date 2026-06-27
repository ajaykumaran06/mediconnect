import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/authStore';

// Public pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import SignupPage from './pages/public/SignupPage';
import DoctorSignupPage from './pages/public/DoctorSignupPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard';
import BookAppointmentPage from './pages/patient/BookAppointmentPage';
import MedicalHistoryPage from './pages/patient/MedicalHistoryPage';
import PrescriptionsPage from './pages/patient/PrescriptionsPage';
import SymptomCheckerPage from './pages/patient/SymptomCheckerPage';
import ProfilePage from './pages/patient/ProfilePage';

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AppointmentManagementPage from './pages/doctor/AppointmentManagementPage';
import CreatePrescriptionPage from './pages/doctor/CreatePrescriptionPage';
import PatientHistoryPage from './pages/doctor/PatientHistoryPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminDoctorsPage from './pages/admin/AdminDoctorsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false },
  },
});

const DASHBOARDS = { patient: '/patient', doctor: '/doctor', admin: '/admin' };

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role))
    return <Navigate to={DASHBOARDS[user?.role] || '/'} replace />;
  return children;
}

function GuestRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) return <Navigate to={DASHBOARDS[user?.role] || '/'} replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', fontSize: '14px', fontWeight: 500 } }} />
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
          <Route path="/signup/doctor" element={<GuestRoute><DoctorSignupPage /></GuestRoute>} />
          <Route path="/symptoms" element={<SymptomCheckerPage />} />

          {/* Patient */}
          <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
          <Route path="/patient/book" element={<ProtectedRoute allowedRoles={['patient']}><BookAppointmentPage /></ProtectedRoute>} />
          <Route path="/patient/history" element={<ProtectedRoute allowedRoles={['patient']}><MedicalHistoryPage /></ProtectedRoute>} />
          <Route path="/patient/prescriptions" element={<ProtectedRoute allowedRoles={['patient']}><PrescriptionsPage /></ProtectedRoute>} />
          <Route path="/patient/symptoms" element={<SymptomCheckerPage />} />
          <Route path="/patient/profile" element={<ProtectedRoute allowedRoles={['patient']}><ProfilePage /></ProtectedRoute>} />

          {/* Doctor */}
          <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/appointments" element={<ProtectedRoute allowedRoles={['doctor']}><AppointmentManagementPage /></ProtectedRoute>} />
          <Route path="/doctor/prescriptions/new" element={<ProtectedRoute allowedRoles={['doctor']}><CreatePrescriptionPage /></ProtectedRoute>} />
          <Route path="/doctor/patients/:patientId" element={<ProtectedRoute allowedRoles={['doctor']}><PatientHistoryPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={['admin']}><AdminDoctorsPage /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
