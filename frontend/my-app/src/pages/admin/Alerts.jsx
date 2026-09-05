import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, ChevronRight, Filter, Clock, CheckCircle, Loader } from 'lucide-react';
import { AdminSidebar, AdminTopbar } from '../../components/AdminLayout';
import { mockAlerts } from '../../data/mockData';

const SEVERITY_CONFIG = {
  Critical: { dot: 'bg-amber-600', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-600 text-white' },
  High:     { dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50/60', border: 'border-amber-100', badge: 'bg-amber-500 text-white' },
  Medium:   { dot: 'bg-gold-500',  text: 'text-gold-500',  bg: 'bg-gold-50',    border: 'border-gold-100',   badge: 'bg-gold-500 text-white' },
  Low:      { dot: 'bg-gray-400',  text: 'text-gray-600',  bg: 'bg-gray-50',    border: 'border-gray-200',   badge: 'bg-gray-400 text-white' },
};

const STATUS_CONFIG = {
  Open:          { icon: AlertTriangle, color: 'text-amber-600', label: 'Open' },
  Investigating: { icon: Loader,         color: 'text-navy-700',  label: 'Investigating' },
  Resolved:      { icon: CheckCircle,    color: 'text-teal-600',  label: 'Resolved' },
};

function formatTs(ts) {
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

function AlertRow({ alert }) {
  const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.Low;
  const statusConf = STATUS_CONFIG[alert.status] || STATUS_CONFIG.Open;
  const StatusIcon = statusConf.icon;

  return (
    <div className={`p-5 border-l-4 ${sev.border} bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 ${sev.bg}`}
      style={{ borderLeftColor: sev.dot.replace('bg-', '#').includes('amber-600') ? '#C1440E' : undefined }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        {/* Severity badge */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${sev.badge} flex-shrink-0 self-start`}>
          <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
          {alert.severity}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-bold text-navy-900">{alert.type}</span>
            <span className="text-xs text-gray-400">·</span>
            <Link
              to={`/admin/clients/${alert.clientId}`}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              {alert.clientName}
            </Link>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{alert.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={12} />
              {formatTs(alert.timestamp)}
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${statusConf.color}`}>
              <StatusIcon size={12} />
              {statusConf.label}
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="flex-shrink-0">
          <Link
            to={`/admin/clients/${alert.clientId}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-navy-900 bg-white border border-border hover:border-navy-400 px-3 py-1.5 rounded-lg transition-all"
          >
            Investigate <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminAlerts() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const statuses = ['All', 'Open', 'Investigating', 'Resolved'];
  const types = ['All', ...new Set(mockAlerts.map(a => a.type))];

  const filtered = mockAlerts.filter(a =>
    (severityFilter === 'All' || a.severity === severityFilter) &&
    (statusFilter === 'All' || a.status === statusFilter) &&
    (typeFilter === 'All' || a.type === typeFilter)
  ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const counts = {
    Critical: mockAlerts.filter(a => a.severity === 'Critical').length,
    High:     mockAlerts.filter(a => a.severity === 'High').length,
    open:     mockAlerts.filter(a => a.status === 'Open').length,
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
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="mb-6 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-1">
              <ShieldAlert size={22} className="text-amber-600" />
              <h1 className="text-2xl font-bold text-navy-900">Security Alerts</h1>
            </div>
            <p className="text-gray-500 text-sm">Chronological security events requiring your attention</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-in-up stagger-1">
            {[
              { label: 'Critical', count: counts.Critical, color: 'bg-amber-50 border-amber-200 text-amber-700' },
              { label: 'High', count: counts.High, color: 'bg-amber-50/60 border-amber-100 text-amber-600' },
              { label: 'Open', count: counts.open, color: 'bg-navy-50 border-navy-100 text-navy-700' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-3 sm:p-4 text-center ${s.color}`}>
                <div className="text-xl sm:text-2xl font-bold">{s.count}</div>
                <div className="text-xs font-semibold uppercase tracking-wide mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-4 mb-5 animate-fade-in-up stagger-2">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={14} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-600">Filters</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Severity</p>
                <div className="flex flex-wrap gap-1.5">
                  {severities.map(s => (
                    <button key={s} onClick={() => setSeverityFilter(s)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                        severityFilter === s ? 'bg-navy-900 text-white border-navy-900' : 'border-border text-gray-600 bg-white hover:border-navy-400'
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {statuses.map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                        statusFilter === s ? 'bg-navy-900 text-white border-navy-900' : 'border-border text-gray-600 bg-white hover:border-navy-400'
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {types.map(s => (
                    <button key={s} onClick={() => setTypeFilter(s)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                        typeFilter === s ? 'bg-navy-900 text-white border-navy-900' : 'border-border text-gray-600 bg-white hover:border-navy-400'
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Alert list */}
          <div className="space-y-3 animate-fade-in-up stagger-3">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-border shadow-card py-16 text-center text-gray-400">
                <ShieldAlert size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No alerts match your filters.</p>
              </div>
            ) : (
              filtered.map(alert => <AlertRow key={alert.id} alert={alert} />)
            )}
          </div>

          <p className="text-xs text-gray-400 text-center mt-6">
            Showing {filtered.length} of {mockAlerts.length} alerts
          </p>
        </main>
      </div>
    </div>
  );
}
