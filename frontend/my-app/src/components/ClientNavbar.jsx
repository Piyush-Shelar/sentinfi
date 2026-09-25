import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, FileText, Upload, BarChart2, LogOut, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/client/dashboard', label: 'Dashboard', icon: BarChart2 },
  { to: '/client/documents', label: 'My Documents', icon: FileText },
  { to: '/client/upload', label: 'Upload', icon: Upload },
  { to: '/client/security', label: 'Security Score', icon: Shield },
];

export default function ClientNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.name ? user.name.split(' ')[0] : 'Client';
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('') : '?';

  return (
    <nav className="bg-navy-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/client/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center group-hover:bg-teal-500 transition-colors">
              <Shield size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Sentin<span className="text-teal-400">Fi</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-white/10 text-white'
                      : 'text-navy-100 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full"></span>
            </button>
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/20">
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <div className="text-sm">
                <div className="font-medium leading-tight">{displayName}</div>
                <div className="text-navy-100 text-xs">Client</div>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/client/login'); }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-navy-100 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-navy-900 animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active ? 'bg-white/10 text-white' : 'text-navy-100 hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
            <button
              onClick={() => { logout(); navigate('/client/login'); }}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-navy-100 hover:bg-white/5 mt-2"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
