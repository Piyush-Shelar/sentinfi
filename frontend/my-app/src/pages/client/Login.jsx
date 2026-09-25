import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ClientLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      if (data.user.role !== 'client') {
        setError('This portal is for clients only. Please use the Advisor login.');
        return;
      }
      login(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken });
      navigate('/client/dashboard', { replace: true });
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-teal-600/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-navy-600/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-scale-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 shadow-lg mb-4">
            <Shield size={32} strokeWidth={2} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Sentin<span className="text-teal-400">Fi</span>
          </h1>
          <p className="text-navy-100/60 text-sm mt-1">Cryptographic Document Vault</p>
        </div>

        <div className="bg-white rounded-2xl shadow-modal p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-navy-900">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to access your secure vault</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-navy-900 placeholder-gray-400 focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 transition-all"
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-navy-800">Password</label>
                <button type="button" className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  className="w-full pl-10 pr-10 py-2.5 border border-border rounded-xl text-sm text-navy-900 placeholder-gray-400 focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Authenticating…
                </>
              ) : (
                <>Sign In <ChevronRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-center text-sm text-gray-500">
              New to SentinFi?{' '}
              <Link to="/signup" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6 flex items-center justify-center gap-2 text-navy-100/40 text-xs">
          <Lock size={11} />
          <span>End-to-end encrypted · AES-256 · Zero-knowledge architecture</span>
        </div>

        <div className="text-center mt-3">
          <Link to="/admin/login" className="text-navy-100/40 hover:text-navy-100/70 text-xs transition-colors">
            Advisor login →
          </Link>
        </div>
      </div>
    </div>
  );
}
