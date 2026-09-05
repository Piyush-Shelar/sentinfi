import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, FileText, AlertTriangle, TrendingUp, Search,
  ArrowUpRight, ChevronRight, Shield, Clock
} from 'lucide-react';
import { AdminSidebar, AdminTopbar } from '../../components/AdminLayout';
import ScoreGauge from '../../components/ScoreGauge';
import SecurityBadge from '../../components/SecurityBadge';
import { mockClients, mockAlerts } from '../../data/mockData';

function KpiCard({ icon: Icon, label, value, sub, accent, delta }) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-5 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon size={20} />
        </div>
        {delta && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            delta > 0 ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {delta > 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-navy-900">{value}</div>
      <div className="text-sm text-gray-600 font-medium mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function formatRelative(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const severityColors = {
  Critical: 'bg-amber-600',
  High:     'bg-amber-500',
  Medium:   'bg-gold-500',
  Low:      'bg-gray-400',
};

export default function AdminDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [search, setSearch] = useState('');

  const avgScore = Math.round(mockClients.reduce((a, c) => a + c.securityScore, 0) / mockClients.length);
  const pendingTotal = mockClients.reduce((a, c) => a + c.pendingCount, 0);
  const activeAlerts = mockAlerts.filter(a => a.status === 'Open' || a.status === 'Investigating').length;

  const filteredClients = mockClients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebar(false)} />
          <div className="relative z-10 flex-shrink-0">
            <AdminSidebar collapsed={false} onToggle={() => setMobileSidebar(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopbar onMobileSidebarToggle={() => setMobileSidebar(true)} />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Page header */}
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Overview of your client portfolio and alerts</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="animate-fade-in-up stagger-1">
              <KpiCard icon={Users} label="Total Clients" value={mockClients.length} sub="Active accounts" accent="bg-navy-50 text-navy-700" delta={12} />
            </div>
            <div className="animate-fade-in-up stagger-2">
              <KpiCard icon={FileText} label="Pending Review" value={pendingTotal} sub="Docs awaiting review" accent="bg-gold-50 text-gold-500" delta={-3} />
            </div>
            <div className="animate-fade-in-up stagger-3">
              <KpiCard icon={AlertTriangle} label="Active Alerts" value={activeAlerts} sub="Open + investigating" accent="bg-amber-50 text-amber-600" />
            </div>
            <div className="animate-fade-in-up stagger-4">
              <KpiCard icon={TrendingUp} label="Avg Security Score" value={avgScore} sub="Across all clients" accent="bg-teal-50 text-teal-600" delta={4} />
            </div>
          </div>

          {/* Two columns: clients + alerts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Client List */}
            <div className="xl:col-span-2 animate-fade-in-up stagger-2">
              <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="font-bold text-navy-900">Clients</h2>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 border border-border rounded-lg text-xs text-navy-900 placeholder-gray-400 focus:border-navy-900 focus:ring-1 focus:ring-navy-900/10 w-44 transition-all"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface border-b border-border">
                      <tr className="text-xs font-semibold text-gray-500">
                        <th className="text-left py-3 px-5">Client</th>
                        <th className="text-left py-3 px-4 hidden sm:table-cell">Documents</th>
                        <th className="text-left py-3 px-4">Score</th>
                        <th className="text-left py-3 px-4 hidden md:table-cell">Last Active</th>
                        <th className="py-3 px-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredClients.map(client => (
                        <tr key={client.id} className="hover:bg-surface transition-colors group">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {client.avatar}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-navy-900">{client.name}</p>
                                <p className="text-xs text-gray-400">{client.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 hidden sm:table-cell">
                            <div className="text-sm font-medium text-navy-800">{client.documentCount}</div>
                            {client.pendingCount > 0 && (
                              <div className="text-xs text-gold-500">{client.pendingCount} pending</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                                <div
                                  className={`h-full rounded-full ${
                                    client.securityScore >= 71 ? 'bg-teal-500' :
                                    client.securityScore >= 40 ? 'bg-gold-400' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${client.securityScore}%` }}
                                />
                              </div>
                              <span className={`text-sm font-bold ${
                                client.securityScore >= 71 ? 'text-teal-600' :
                                client.securityScore >= 40 ? 'text-gold-500' : 'text-amber-600'
                              }`}>
                                {client.securityScore}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 hidden md:table-cell">
                            <span className="text-sm text-gray-500">{formatRelative(client.lastActivity)}</span>
                          </td>
                          <td className="py-3.5 px-5">
                            <Link
                              to={`/admin/clients/${client.id}`}
                              className="flex items-center gap-1 text-xs font-semibold text-navy-700 opacity-0 group-hover:opacity-100 transition-opacity hover:text-navy-900"
                            >
                              View <ChevronRight size={13} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Alerts panel */}
            <div className="animate-fade-in-up stagger-3">
              <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden h-full">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <h2 className="font-bold text-navy-900">Recent Alerts</h2>
                  </div>
                  <Link to="/admin/alerts" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                    View all <ArrowUpRight size={12} />
                  </Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {mockAlerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="p-4 hover:bg-surface transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${severityColors[alert.severity]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-bold ${
                              alert.severity === 'Critical' ? 'text-amber-600' :
                              alert.severity === 'High' ? 'text-amber-500' : 'text-gray-600'
                            }`}>
                              {alert.severity}
                            </span>
                            <span className="text-xs text-gray-400">{formatRelative(alert.timestamp)}</span>
                          </div>
                          <p className="text-xs font-medium text-navy-800 mt-0.5">{alert.type}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{alert.clientName}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
