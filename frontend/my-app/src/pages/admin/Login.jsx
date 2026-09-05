import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Eye, EyeOff, Lock, Mail, ChevronRight, UserCog } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: 'rajesh.patel@sentinfi.io', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate('/admin/dashboard'), 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-[#1a2055] to-navy-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-teal-600/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-navy-700/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-navy-600/10 blur-3xl" />
        {/* Grid lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="w-full max-w-md animate-scale-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-800 border border-teal-600/30 shadow-lg mb-4 relative">
            <ShieldAlert size={30} strokeWidth={2} className="text-teal-400" />
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center">
              <UserCog size={11} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Sentin<span className="text-teal-400">Fi</span>
          </h1>
          <p className="text-navy-100/50 text-sm mt-1">Advisor Console</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-modal p-8">
          {/* Advisor badge */}
          <div className="flex items-center gap-2.5 mb-6 pb-6 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center flex-shrink-0">
              <UserCog size={16} className="text-teal-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Advisor Login</div>
              <div className="text-xs text-gray-500">Restricted access — authorized personnel only</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Advisor Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-navy-900 placeholder-gray-400 focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-navy-800">Password</label>
                <button type="button" className="text-xs text-teal-600 hover:text-teal-700 font-medium">Forgot?</button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 border border-border rounded-xl text-sm text-navy-900 placeholder-gray-400 focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* MFA note */}
            <div className="flex items-center gap-2 p-3 bg-navy-50 rounded-xl border border-navy-100">
              <ShieldAlert size={14} className="text-navy-700 flex-shrink-0" />
              <span className="text-xs text-navy-700">Multi-factor authentication required on next step</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Authenticating...
                </>
              ) : (
                <>Advisor Sign In <ChevronRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        {/* Client link */}
        <div className="text-center mt-4">
          <Link to="/client/login" className="text-navy-100/40 hover:text-navy-100/70 text-xs transition-colors">
            ← Client login
          </Link>
        </div>

        <div className="text-center mt-3 flex items-center justify-center gap-2 text-navy-100/30 text-xs">
          <Lock size={11} />
          <span>SOC 2 Type II · ISO 27001 · Zero-knowledge</span>
        </div>
      </div>
    </div>
  );
}
