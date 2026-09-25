import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, FileText, AlertTriangle, TrendingUp, Search,
  ArrowUpRight, ChevronRight, Shield, Inbox, RefreshCw, Clock, Bug, ShieldOff
} from 'lucide-react';
import { AdminSidebar, AdminTopbar } from '../../components/AdminLayout';
import { useAuth } from '../../context/AuthContext';

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-5 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon size={20} />
        </div>
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

function ScoreBar({ score }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full">
        <div
          className={`h-full rounded-full ${
            score >= 71 ? 'bg-teal-500' : score >= 40 ? 'bg-gold-400' : 'bg-amber-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-sm font-bold ${
        score >= 71 ? 'text-teal-600' : score >= 40 ? 'text-gold-500' : 'text-amber-600'
      }`}>
        {score}
      </span>
    </div>
  );
}

export default function AdminDashboard() {
  const { accessToken } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState(null);
  const [secSummary, setSecSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const [res, secRes] = await Promise.all([
        fetch('/api/dashboard/advisor-dashboard-summary', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/admin/security-summary', { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      const data = await res.json();
      const secData = await secRes.json();
      if (!res.ok) { setError(data.error || 'Failed to load dashboard'); return; }
      setSummary(data);
      if (secRes.ok) setSecSummary(secData);
    } catch {
      setError('Unable to reach server.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const assignedClients = summary?.assignedClients ?? [];
  const documents = summary?.documents ?? [];

  const filteredClients = assignedClients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const recentDocs = documents.slice(0, 5);

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

          <div className="mb-8 animate-fade-in-up flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">Live overview of your client portfolio</p>
            </div>
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="p-2 rounded-xl border border-border bg-white hover:bg-gray-50 text-gray-500 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <AlertTriangle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {loading && !summary && (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-900 rounded-full animate-spin-slow" />
            </div>
          )}

          {!loading && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="animate-fade-in-up stagger-1">
                  <KpiCard icon={Users}     label="Total Clients"         value={summary?.assignedClientsCount ?? 0}    sub="Registered clients"    accent="bg-navy-50 text-navy-700" />
                </div>
                <div className="animate-fade-in-up stagger-2">
                  <KpiCard icon={FileText}  label="Accessible Documents"  value={summary?.accessibleDocumentsCount ?? 0} sub="Encrypted vault records" accent="bg-gold-50 text-gold-500" />
                </div>
                <div className="animate-fade-in-up stagger-3">
                  <KpiCard icon={Bug}       label="Security Incidents"    value={secSummary?.totalEvents ?? 0}           sub="Honeypot & tamper events" accent="bg-amber-50 text-amber-600" />
                </div>
                <div className="animate-fade-in-up stagger-4">
                  <KpiCard icon={ShieldOff} label="Locked Accounts"       value={secSummary?.lockedAccountCount ?? 0}    sub="Contained by system"   accent="bg-red-50 text-red-600" />
                </div>
              </div>

              {secSummary?.honeypotCount > 0 && (
                <div className="mb-6 flex items-start gap-3 px-5 py-4 bg-amber-50 border-2 border-amber-400 rounded-2xl animate-fade-in-up">
                  <Bug size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-800">{secSummary.honeypotCount} Honeypot Tripwire{secSummary.honeypotCount !== 1 ? 's' : ''} Triggered</p>
                    <p className="text-xs text-amber-700 mt-0.5">Unauthorized actors attempted to access decoy documents. Review the <Link to="/admin/alerts" className="underline font-semibold">Security Alerts</Link> page for details and to unlock contained accounts.</p>
                  </div>
                  <Link to="/admin/alerts" className="flex-shrink-0 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-all">
                    View Alerts
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
                    {filteredClients.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
                        <Inbox size={32} className="mb-3 opacity-30" />
                        <p className="text-sm font-medium text-gray-500">No clients assigned.</p>
                        <p className="text-xs mt-1">Clients will appear here once they register and upload documents.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-surface border-b border-border">
                            <tr className="text-xs font-semibold text-gray-500">
                              <th className="text-left py-3 px-5">Client</th>
                              <th className="text-left py-3 px-4 hidden sm:table-cell">Documents</th>
                              <th className="text-left py-3 px-4 hidden md:table-cell">Joined</th>
                              <th className="py-3 px-5"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {filteredClients.map(client => {
                              const initials = client.name?.split(' ').map(w => w[0]).slice(0, 2).join('') || '?';
                              return (
                                <tr key={client.id} className="hover:bg-surface transition-colors group">
                                  <td className="py-3.5 px-5">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                        {initials}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-navy-900">{client.name}</p>
                                        <p className="text-xs text-gray-400">{client.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 hidden sm:table-cell">
                                    <div className="text-sm font-medium text-navy-800">{client.documentCount}</div>
                                  </td>
                                  <td className="py-3.5 px-4 hidden md:table-cell">
                                    <span className="text-sm text-gray-500">
                                      {client.joinDate
                                        ? new Date(client.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : '—'
                                      }
                                    </span>
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
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="animate-fade-in-up stagger-3">
                  <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden h-full">
                    <div className="flex items-center justify-between p-5 border-b border-border">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-navy-700" />
                        <h2 className="font-bold text-navy-900">Recent Uploads</h2>
                      </div>
                      <Link to="/admin/clients" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                        View all <ArrowUpRight size={12} />
                      </Link>
                    </div>
                    {recentDocs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-14 text-center text-gray-400">
                        <Inbox size={28} className="mb-3 opacity-30" />
                        <p className="text-sm text-gray-500">No client documents have been shared with you yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {recentDocs.map(doc => (
                          <div key={doc._id} className="p-4 hover:bg-surface transition-colors">
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                                <FileText size={13} className="text-navy-700" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-navy-900 truncate">{doc.originalFilename}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{doc.documentType} · {doc.clientName}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{formatRelative(doc.createdAt)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
