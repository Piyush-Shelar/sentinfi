import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Mail, User, ChevronRight, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'client',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || 'Signup failed');
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        navigate(form.role === 'admin' ? '/admin/login' : '/client/login');
      }, 1500);
    } catch {
      setServerError('Unable to connect to server. Please try again.');
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
          <p className="text-navy-100/60 text-sm mt-1">Create your secure vault account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-modal p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-navy-900">Create account</h2>
            <p className="text-gray-500 text-sm mt-1">Start protecting your financial documents</p>
          </div>

          {success && (
            <div className="flex items-center gap-2.5 p-3 bg-teal-50 border border-teal-200 rounded-xl mb-4">
              <CheckCircle size={16} className="text-teal-600 flex-shrink-0" />
              <p className="text-sm text-teal-700 font-medium">Account created! Redirecting to login…</p>
            </div>
          )}

          {serverError && (
            <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange('name')}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm text-navy-900 placeholder-gray-400 focus:ring-2 focus:ring-navy-900/10 transition-all ${errors.name ? 'border-amber-400 focus:border-amber-500' : 'border-border focus:border-navy-900'}`}
                  placeholder="Your full name"
                />
              </div>
              {errors.name && <p className="text-xs text-amber-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm text-navy-900 placeholder-gray-400 focus:ring-2 focus:ring-navy-900/10 transition-all ${errors.email ? 'border-amber-400 focus:border-amber-500' : 'border-border focus:border-navy-900'}`}
                  placeholder="you@email.com"
                />
              </div>
              {errors.email && <p className="text-xs text-amber-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Account type</label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={handleChange('role')}
                  className="w-full appearance-none border border-border rounded-xl px-4 py-2.5 text-sm text-navy-900 bg-white focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 transition-all pr-10"
                >
                  <option value="client">Client</option>
                  <option value="admin">Advisor</option>
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm text-navy-900 placeholder-gray-400 focus:ring-2 focus:ring-navy-900/10 transition-all ${errors.password ? 'border-amber-400 focus:border-amber-500' : 'border-border focus:border-navy-900'}`}
                  placeholder="Min. 8 characters"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-amber-600 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={handleChange('confirm')}
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm text-navy-900 placeholder-gray-400 focus:ring-2 focus:ring-navy-900/10 transition-all ${errors.confirm ? 'border-amber-400 focus:border-amber-500' : 'border-border focus:border-navy-900'}`}
                  placeholder="Re-enter password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirm && <p className="text-xs text-amber-600 mt-1">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Creating account…
                </>
              ) : (
                <>Create Account <ChevronRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/client/login" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6 flex items-center justify-center gap-2 text-navy-100/40 text-xs">
          <Lock size={11} />
          <span>End-to-end encrypted · AES-256 · Zero-knowledge architecture</span>
        </div>
      </div>
    </div>
  );
}
