import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Client pages
import ClientLogin from './pages/client/Login';
import ClientDashboard from './pages/client/Dashboard';
import ClientUpload from './pages/client/Upload';
import ClientDocuments from './pages/client/Documents';
import ClientSecurityScore from './pages/client/SecurityScore';

// Admin pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminClients from './pages/admin/Clients';
import AdminClientDetail from './pages/admin/ClientDetail';
import AdminAlerts from './pages/admin/Alerts';
import AdminSettings from './pages/admin/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/client/login" replace />} />

        {/* Client portal */}
        <Route path="/client/login"     element={<ClientLogin />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/client/upload"    element={<ClientUpload />} />
        <Route path="/client/documents" element={<ClientDocuments />} />
        <Route path="/client/security"  element={<ClientSecurityScore />} />

        {/* Admin portal */}
        <Route path="/admin/login"          element={<AdminLogin />} />
        <Route path="/admin/dashboard"      element={<AdminDashboard />} />
        <Route path="/admin/clients"        element={<AdminClients />} />
        <Route path="/admin/clients/:id"    element={<AdminClientDetail />} />
        <Route path="/admin/alerts"         element={<AdminAlerts />} />
        <Route path="/admin/settings"       element={<AdminSettings />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/client/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
