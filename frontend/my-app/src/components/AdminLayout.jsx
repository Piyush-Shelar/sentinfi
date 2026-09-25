import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield, LayoutDashboard, Users, AlertTriangle, Settings,
  LogOut, Menu, X, Bell, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/clients', label: 'Clients', icon: Users },
  { to: '/admin/alerts', label: 'Security Alerts', icon: AlertTriangle, badge: 3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const adminName = user?.name || 'Advisor';
  const adminInitials = adminName.split(' ').map(w => w[0]).slice(0, 2).join('');

  return (
    <aside
      className={`bg-navy-950 text-white flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 border-b border-white/10 ${collapsed ? 'justify-center px-0' : 'px-5 gap-3'}`}>
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
          <Shield size={18} strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="text-xl font-bold tracking-tight whitespace-nowrap">
            Sentin<span className="text-teal-400">Fi</span>
          </span>
        )}
      </div>

      {/* Admin badge */}
      {!collapsed && (
        <div className="px-5 py-3 border-b border-white/10">
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-widest">Advisor Portal</span>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {sidebarLinks.map(({ to, label, icon: Icon, badge }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                active
                  ? 'bg-teal-600/20 text-teal-400 border border-teal-600/30'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
              {badge && !collapsed && (
                <span className="ml-auto bg-amber-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
              {badge && collapsed && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user + logout */}
      <div className="border-t border-white/10 p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-navy-700 border-2 border-teal-600/50 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {adminInitials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{adminName}</div>
              <div className="text-xs text-white/40 truncate">Advisor</div>
            </div>
          </div>
        )}
        <button
          onClick={() => { logout(); navigate('/admin/login'); }}
          title={collapsed ? 'Sign Out' : undefined}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
        <button
          onClick={onToggle}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-white/30 hover:bg-white/5 hover:text-white/60 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}

export function AdminTopbar({ onMobileSidebarToggle }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const adminName = user?.name || 'Advisor';
  const adminInitials = adminName.split(' ').map(w => w[0]).slice(0, 2).join('');
  return (
    <header className="bg-white border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-card">
      <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={onMobileSidebarToggle}>
        <Menu size={20} className="text-navy-700" />
      </button>
      <div className="flex items-center gap-2 lg:hidden">
        <Shield size={18} className="text-teal-600" />
        <span className="font-bold text-navy-900">SentinFi</span>
      </div>
      <div className="hidden lg:block">
        <span className="text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Advisor Portal
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={18} className="text-navy-700" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center text-xs font-bold text-white">
            {adminInitials}
          </div>
          <div className="hidden sm:block text-sm">
            <div className="font-medium text-navy-900 leading-tight">{adminName}</div>
            <div className="text-gray-400 text-xs">Advisor</div>
          </div>
        </div>
      </div>
    </header>
  );
}
