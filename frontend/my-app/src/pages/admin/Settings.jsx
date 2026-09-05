import React, { useState } from 'react';
import { Settings, Bell, Lock, User, Shield, Save } from 'lucide-react';
import { AdminSidebar, AdminTopbar } from '../../components/AdminLayout';
import { loggedInAdmin } from '../../data/mockData';

export default function AdminSettings() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <div className="hidden lg:block flex-shrink-0">
        <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>
      {mobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebar(false)} />
          <div className="relative z-10 flex-shrink-0">
            <AdminSidebar collapsed={false} onToggle={() => setMobileSidebar(false)} />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopbar onMobileSidebarToggle={() => setMobileSidebar(true)} />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto w-full">
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-2xl font-bold text-navy-900">Settings</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your advisor account and preferences</p>
          </div>

          {/* Profile */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-6 mb-5 animate-fade-in-up stagger-1">
            <div className="flex items-center gap-2 mb-5">
              <User size={16} className="text-navy-700" />
              <h2 className="font-bold text-navy-900">Profile</h2>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-navy-900 flex items-center justify-center text-xl font-bold text-white">
                {loggedInAdmin.avatar}
              </div>
              <div>
                <p className="font-semibold text-navy-900">{loggedInAdmin.name}</p>
                <p className="text-sm text-gray-500">{loggedInAdmin.role}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Full Name', value: loggedInAdmin.name },
                { label: 'Email', value: loggedInAdmin.email },
                { label: 'Role', value: loggedInAdmin.role },
                { label: 'Organization', value: 'SentinFi Advisory LLP' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
                  <input defaultValue={f.value} className="w-full border border-border rounded-xl px-3 py-2 text-sm text-navy-900 focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 transition-all" />
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-6 mb-5 animate-fade-in-up stagger-2">
            <div className="flex items-center gap-2 mb-5">
              <Lock size={16} className="text-navy-700" />
              <h2 className="font-bold text-navy-900">Security</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Two-Factor Authentication', desc: 'Require OTP on every login', enabled: true },
                { label: 'Login Notifications', desc: 'Email alert on new sign-in', enabled: true },
                { label: 'Session Timeout', desc: 'Auto-logout after 30 min of inactivity', enabled: false },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{s.label}</p>
                    <p className="text-xs text-gray-500">{s.desc}</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${s.enabled ? 'bg-teal-500' : 'bg-gray-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-all ${s.enabled ? 'left-5' : 'left-1'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-6 mb-6 animate-fade-in-up stagger-3">
            <div className="flex items-center gap-2 mb-5">
              <Bell size={16} className="text-navy-700" />
              <h2 className="font-bold text-navy-900">Notifications</h2>
            </div>
            <div className="space-y-3">
              {['Critical alerts (email + SMS)', 'New document uploads', 'Weekly security digest', 'Tamper detection events'].map(n => (
                <label key={n} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-navy-900" />
                  <span className="text-sm text-navy-800">{n}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md ${
              saved ? 'bg-teal-600 text-white' : 'bg-navy-900 hover:bg-navy-800 text-white'
            }`}
          >
            {saved ? <><Shield size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
          </button>
        </main>
      </div>
    </div>
  );
}
