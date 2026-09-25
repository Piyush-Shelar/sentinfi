import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AccountLockedBanner from './components/AccountLockedBanner';

import ClientLogin from './pages/client/Login';
import ClientSignup from './pages/client/Signup';
import ClientDashboard from './pages/client/Dashboard';
import ClientUpload from './pages/client/Upload';
import ClientDocuments from './pages/client/Documents';
import ClientSecurityScore from './pages/client/SecurityScore';

import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminClients from './pages/admin/Clients';
import AdminClientDetail from './pages/admin/ClientDetail';
import AdminAlerts from './pages/admin/Alerts';
import AdminSettings from './pages/admin/Settings';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AccountLockedBanner />
        <Routes>
          <Route path="/" element={<Navigate to="/client/login" replace />} />

          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/signup" element={<ClientSignup />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/client/dashboard" element={<ProtectedRoute requiredRole="client"><ClientDashboard /></ProtectedRoute>} />
          <Route path="/client/upload"    element={<ProtectedRoute requiredRole="client"><ClientUpload /></ProtectedRoute>} />
          <Route path="/client/documents" element={<ProtectedRoute requiredRole="client"><ClientDocuments /></ProtectedRoute>} />
          <Route path="/client/security"  element={<ProtectedRoute requiredRole="client"><ClientSecurityScore /></ProtectedRoute>} />

          <Route path="/admin/dashboard"     element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/clients"       element={<ProtectedRoute requiredRole="admin"><AdminClients /></ProtectedRoute>} />
          <Route path="/admin/clients/:id"   element={<ProtectedRoute requiredRole="admin"><AdminClientDetail /></ProtectedRoute>} />
          <Route path="/admin/alerts"        element={<ProtectedRoute requiredRole="admin"><AdminAlerts /></ProtectedRoute>} />
          <Route path="/admin/settings"      element={<ProtectedRoute requiredRole="admin"><AdminSettings /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/client/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
