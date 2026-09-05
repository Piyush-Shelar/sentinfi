import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Clock, Activity, Upload, Eye, AlertCircle,
  ShieldCheck, TrendingUp, ArrowUpRight
} from 'lucide-react';
import ClientNavbar from '../../components/ClientNavbar';
import ScoreGauge from '../../components/ScoreGauge';
import { loggedInClient, mockActivityFeed, mockDocuments } from '../../data/mockData';

const clientDocs = mockDocuments.filter(d => d.clientId === 'c001');

function StatCard({ icon: Icon, label, value, sub, color, linkTo }) {
  return (
    <Link
      to={linkTo || '#'}
      className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 group border border-border"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
        <ArrowUpRight size={16} className="text-gray-300 group-hover:text-navy-700 transition-colors" />
      </div>
      <div className="text-2xl font-bold text-navy-900">{value}</div>
      <div className="text-sm font-medium text-gray-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </Link>
  );
}

function ActivityIcon({ type }) {
  const map = {
    upload:   { Icon: Upload,     bg: 'bg-navy-50',   color: 'text-navy-700' },
    view:     { Icon: Eye,        bg: 'bg-gold-50',   color: 'text-gold-500' },
    verified: { Icon: ShieldCheck,bg: 'bg-teal-50',   color: 'text-teal-600' },
    alert:    { Icon: AlertCircle,bg: 'bg-amber-50',  color: 'text-amber-600' },
  };
  const { Icon, bg, color } = map[type] || map.upload;
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
      <Icon size={15} className={color} />
    </div>
  );
}

function formatRelative(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ClientDashboard() {
  const pending = clientDocs.filter(d => d.status === 'Pending' || d.status === 'Under Review').length;

  return (
    <div className="min-h-screen bg-surface">
      <ClientNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Good afternoon,</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mt-0.5">
                {loggedInClient.name} 👋
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Your vault is secure. Last activity {formatRelative(loggedInClient.lastActivity)}.
              </p>
            </div>
            <Link
              to="/client/upload"
              className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Upload size={16} />
              Upload Document
            </Link>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Score + Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Security health card */}
            <div className="bg-white rounded-2xl shadow-card border border-border p-6 animate-fade-in-up stagger-1">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Gauge */}
                <div className="flex-shrink-0">
                  <ScoreGauge score={loggedInClient.securityScore} size={160} />
                </div>
                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                    <TrendingUp size={16} className="text-teal-600" />
                    <span className="text-sm font-semibold text-teal-600">+4 points this month</span>
                  </div>
                  <h2 className="text-lg font-bold text-navy-900">Security Health Score</h2>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                    Your score reflects your encryption level, password hygiene, document integrity, 
                    access patterns, and honeypot status. A higher score means better protection.
                  </p>
                  <Link
                    to="/client/security"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-navy-900 mt-3 transition-colors"
                  >
                    View full breakdown
                    <ArrowUpRight size={14} />
                  </Link>
                  {/* Factor mini bars */}
                  <div className="mt-4 space-y-2">
                    {[
                      { label: 'Encryption', val: 95 },
                      { label: 'Password', val: 60 },
                      { label: 'Integrity', val: 100 },
                    ].map(f => (
                      <div key={f.label} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-20 text-right">{f.label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-1000 ${
                              f.val >= 71 ? 'bg-teal-500' : f.val >= 40 ? 'bg-gold-400' : 'bg-amber-500'
                            }`}
                            style={{ width: `${f.val}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-navy-700 w-8">{f.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="animate-fade-in-up stagger-2">
                <StatCard
                  icon={FileText}
                  label="Documents Uploaded"
                  value={clientDocs.length}
                  sub="Across all categories"
                  color="bg-navy-50 text-navy-700"
                  linkTo="/client/documents"
                />
              </div>
              <div className="animate-fade-in-up stagger-3">
                <StatCard
                  icon={Clock}
                  label="Pending Review"
                  value={pending}
                  sub="Awaiting advisor action"
                  color="bg-gold-50 text-gold-500"
                  linkTo="/client/documents"
                />
              </div>
              <div className="animate-fade-in-up stagger-4">
                <StatCard
                  icon={Activity}
                  label="Last Activity"
                  value="1d"
                  sub="Sep 4, 2026 at 2:32 PM"
                  color="bg-teal-50 text-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Right: Activity Feed */}
          <div className="bg-white rounded-2xl shadow-card border border-border p-6 animate-fade-in-up stagger-2">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-navy-900">Recent Activity</h3>
              <span className="text-xs text-gray-400">Last 30 days</span>
            </div>
            <div className="space-y-4">
              {mockActivityFeed.map((item, idx) => (
                <div key={item.id} className="flex gap-3">
                  <ActivityIcon type={item.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-navy-800 leading-snug">{item.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelative(item.timestamp)}</p>
                  </div>
                  {idx < mockActivityFeed.length - 1 && (
                    <div className="absolute ml-4 mt-8 w-px h-4 bg-gray-100" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="mt-6 bg-white rounded-2xl shadow-card border border-border p-6 animate-fade-in-up stagger-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-navy-900">Recent Documents</h3>
            <Link to="/client/documents" className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 border-b border-border">
                  <th className="text-left pb-3 pr-4">Document</th>
                  <th className="text-left pb-3 pr-4 hidden sm:table-cell">Type</th>
                  <th className="text-left pb-3 pr-4 hidden md:table-cell">Uploaded</th>
                  <th className="text-left pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clientDocs.slice(0, 4).map(doc => (
                  <tr key={doc.id} className="group hover:bg-surface transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                          <FileText size={14} className="text-navy-700" />
                        </div>
                        <span className="text-sm font-medium text-navy-900 truncate max-w-[140px]">{doc.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-500">{doc.type}</span>
                    </td>
                    <td className="py-3 pr-4 hidden md:table-cell">
                      <span className="text-sm text-gray-500">
                        {new Date(doc.uploadDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        doc.status === 'Verified' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                        doc.status === 'Flagged'  ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        'bg-gold-50 text-gold-500 border border-gold-200'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
