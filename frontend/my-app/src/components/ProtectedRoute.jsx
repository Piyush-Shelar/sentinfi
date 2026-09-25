import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-900 rounded-full animate-spin-slow" />
      </div>
    );
  }

  if (!user) {
    const loginPath = requiredRole === 'admin' ? '/admin/login' : '/client/login';
    return <Navigate to={loginPath} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    const fallback = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
