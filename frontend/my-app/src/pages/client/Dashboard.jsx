import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Clock, Activity, Upload, Eye, AlertCircle,
  ShieldCheck, TrendingUp, ArrowUpRight, Inbox, RefreshCw,
  Bug, AlertTriangle, Lock, Shield, ChevronDown, ChevronUp,
  KeyRound, ScanLine, Fingerprint, Zap
} from 'lucide-react';
import ClientNavbar from '../../components/ClientNavbar';
import ScoreGauge from '../../components/ScoreGauge';
import { useAuth } from '../../context/AuthContext';

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
    upload:   { Icon: Upload,        bg: 'bg-navy-50',  color: 'text-navy-700' },
    view:     { Icon: Eye,           bg: 'bg-gold-50',  color: 'text-gold-500' },
    verified: { Icon: ShieldCheck,   bg: 'bg-teal-50',  color: 'text-teal-600' },
    alert:    { Icon: AlertTriangle, bg: 'bg-amber-50', color: 'text-amber-600' },
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

function scoreColor(val) {
  if (val >= 80) return 'text-teal-600';
  if (val >= 60) return 'text-amber-500';
  return 'text-red-600';
}

function barColor(val) {
  if (val >= 80) return 'bg-teal-500';
  if (val >= 60) return 'bg-amber-400';
  return 'bg-red-500';
}

function statusBadge(val) {
  if (val >= 80) return { label: 'Optimal', cls: 'bg-teal-50 text-teal-700 border-teal-200' };
  if (val >= 60) return { label: 'Caution', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'Critical', cls: 'bg-red-50 text-red-700 border-red-200' };
}

const FACTOR_META = [
  {
    key: 'encryption',
    label: 'Encryption Posture',
    weight: '30%',
    Icon: Lock,
    getWarning: (s) => s < 100 ? 'Some documents may lack full AES-256-GCM coverage.' : null,
  },
  {
    key: 'passwordHygiene',
    label: 'Password Hygiene',
    weight: '25%',
    Icon: KeyRound,
    getWarning: (s) => s < 70 ? 'Consider updating your password to a stronger passphrase.' : null,
  },
  {
    key: 'tamperHistory',
    label: 'Document Integrity',
    weight: '20%',
    Icon: ScanLine,
    getWarning: (s) => s < 100 ? 'Tamper attempt detected on one or more documents.' : null,
  },
  {
    key: 'accessAnomaly',
    label: 'Access Anomalies',
    weight: '15%',
    Icon: Fingerprint,
    getWarning: (s) => s < 100 ? 'Unusual authentication events detected in the last 30 days.' : null,
  },
  {
    key: 'honeypot',
    label: 'Honeypot Tripwires',
    weight: '10%',
    Icon: Bug,
    getWarning: (s) => s === 0 ? 'Decoy triggered — unauthorized actor detected and contained.' : null,
  },
];

function FactorRow({ meta, score }) {
  const warning = meta.getWarning(score);
  const bar = barColor(score);
  const txt = scoreColor(score);

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
        <meta.Icon size={14} className="text-navy-700" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-navy-800">{meta.label}</span>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{meta.weight}</span>
          {warning && (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <AlertTriangle size={9} /> {warning}
            </span>
          )}
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${bar}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      <span className={`text-sm font-bold w-8 text-right flex-shrink-0 ${txt}`}>{score}</span>
    </div>
  );
}

function ScoreBreakdownDrawer({ securityHealth }) {
  const [open, setOpen] = useState(false);
  if (!securityHealth) return null;
  const { factors, status } = securityHealth;
  const badge = statusBadge(securityHealth.compositeScore);

  return (
    <div className="mt-4 rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-navy-700" />
          <span className="text-xs font-bold text-navy-900">5-Factor Breakdown</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
        {open
          ? <ChevronUp size={14} className="text-gray-400" />
          : <ChevronDown size={14} className="text-gray-400" />
        }
      </button>
      {open && (
        <div className="px-4 py-1 bg-white">
          {FACTOR_META.map(meta => (
            <FactorRow
              key={meta.key}
              meta={meta}
              score={factors[meta.key]?.score ?? 100}
            />
          ))}
          <p className="text-[10px] text-gray-400 text-center py-2">
            Score = 0.30·E + 0.25·P + 0.20·T + 0.15·A + 0.10·H
          </p>
        </div>
      )}
    </div>
  );
}

function HoneypotStatusPanel({ honeypotStatus }) {
  const triggered = honeypotStatus?.triggered || false;
  const events = honeypotStatus?.events || [];

  return (
    <div className={`rounded-2xl border p-5 ${triggered ? 'bg-amber-50 border-amber-300' : 'bg-navy-900 border-navy-800'}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${triggered ? 'bg-amber-100' : 'bg-white/10'}`}>
          <Bug size={16} className={triggered ? 'text-amber-700' : 'text-teal-400'} />
        </div>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${triggered ? 'text-amber-800' : 'text-teal-400'}`}>
            {triggered ? 'Honeypot Triggered' : 'Vault Protections Active'}
          </p>
          <p className={`text-[11px] ${triggered ? 'text-amber-700' : 'text-navy-200/60'}`}>
            {triggered
              ? `${events.length} intrusion event${events.length !== 1 ? 's' : ''} recorded`
              : 'Decoy Tripwires Active — Zero-Knowledge Bait Placed'}
          </p>
        </div>
        {!triggered && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-teal-400 bg-teal-400/10 border border-teal-400/20 px-2 py-0.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      {!triggered && (
        <div className="space-y-1.5">
          {[
            { label: 'Synthetic decoy document', desc: 'Encrypted bait placed in vault' },
            { label: 'Tripwire monitoring', desc: 'Any access attempt triggers alert' },
            { label: 'Automated containment', desc: 'Immediate session lockdown on trigger' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <Shield size={11} className="text-teal-400 flex-shrink-0" />
              <span className="text-xs text-navy-100/70">
                <span className="font-semibold text-white">{item.label}</span> — {item.desc}
              </span>
            </div>
          ))}
        </div>
      )}

      {triggered && events.length > 0 && (
        <div className="space-y-2 mt-1">
          {events.slice(0, 3).map(evt => (
            <div key={evt.id} className="bg-white rounded-xl px-3 py-2 border border-amber-200 text-xs">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-bold text-amber-800 flex items-center gap-1">
                  <AlertTriangle size={11} /> CRITICAL THREAT
                </span>
                <span className="text-gray-400">{formatRelative(evt.timestamp)}</span>
              </div>
              <p className="text-gray-600 truncate">{evt.details?.message}</p>
              {evt.ipAddress && (
                <p className="text-gray-400 mt-0.5 font-mono">IP: {evt.ipAddress}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientDashboard() {
  const { user, accessToken, handleLockedResponse } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard/dashboard-summary', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (handleLockedResponse(data)) return;
      if (!res.ok) { setError(data.error || 'Failed to load dashboard'); return; }
      setSummary(data);
    } catch {
      setError('Unable to reach server.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, handleLockedResponse]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const displayName = user?.name || 'there';
  const score = summary?.securityScore ?? 0;
  const securityHealth = summary?.securityHealth ?? null;
  const totalDocuments = summary?.totalDocuments ?? 0;
  const recentActivity = summary?.recentActivity ?? [];
  const documents = summary?.documents ?? [];
  const honeypotStatus = summary?.honeypotStatus;
  const statusBadgeData = securityHealth ? statusBadge(score) : null;

  return (
    <div className="min-h-screen bg-surface">
      <ClientNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Welcome back,</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mt-0.5">
                {displayName} 👋
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {totalDocuments === 0
                  ? 'Your vault is empty. Upload your first document to begin.'
                  : `Your vault holds ${totalDocuments} encrypted document${totalDocuments !== 1 ? 's' : ''}.`
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchSummary}
                disabled={loading}
                className="p-2 rounded-xl border border-border bg-white hover:bg-gray-50 text-gray-500 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
              <Link
                to="/client/upload"
                className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Upload size={16} />
                Upload Document
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {loading && !summary && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-900 rounded-full animate-spin-slow" />
          </div>
        )}

        {!loading && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">

                <div className="bg-white rounded-2xl shadow-card border border-border p-6 animate-fade-in-up stagger-1">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="flex-shrink-0 relative">
                      <ScoreGauge score={score} size={160} />
                      {statusBadgeData && (
                        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadgeData.cls}`}>
                          {statusBadgeData.label}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                        <TrendingUp size={16} className="text-teal-600" />
                        <span className="text-sm font-semibold text-teal-600">Live security rating</span>
                      </div>
                      <h2 className="text-lg font-bold text-navy-900">Security Health Score</h2>
                      <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                        Computed in real-time from encryption coverage, document integrity, access patterns, and honeypot status.
                      </p>
                      <Link
                        to="/client/security"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-navy-900 mt-3 transition-colors"
                      >
                        Full security report
                        <ArrowUpRight size={14} />
                      </Link>
                      <ScoreBreakdownDrawer securityHealth={securityHealth} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="animate-fade-in-up stagger-2">
                    <StatCard
                      icon={FileText}
                      label="Documents Uploaded"
                      value={totalDocuments}
                      sub="Across all categories"
                      color="bg-navy-50 text-navy-700"
                      linkTo="/client/documents"
                    />
                  </div>
                  <div className="animate-fade-in-up stagger-3">
                    <StatCard
                      icon={Clock}
                      label="Pending Review"
                      value={0}
                      sub="Awaiting advisor action"
                      color="bg-gold-50 text-gold-500"
                      linkTo="/client/documents"
                    />
                  </div>
                  <div className="animate-fade-in-up stagger-4">
                    <StatCard
                      icon={Activity}
                      label="Active Grants"
                      value={summary?.activeGrantsCount ?? 0}
                      sub="Advisors with access"
                      color="bg-teal-50 text-teal-600"
                    />
                  </div>
                </div>

                {honeypotStatus && (
                  <div className="animate-fade-in-up stagger-5">
                    <HoneypotStatusPanel honeypotStatus={honeypotStatus} />
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-card border border-border p-6 animate-fade-in-up stagger-2">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-navy-900">Recent Activity</h3>
                  <span className="text-xs text-gray-400">Last 10 events</span>
                </div>
                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                    <Inbox size={32} className="mb-3 opacity-40" />
                    <p className="text-sm font-medium">No recent security events.</p>
                    <p className="text-xs mt-1">Activity will appear here after you upload documents.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map(item => (
                      <div key={item.id} className="flex gap-3">
                        <ActivityIcon type={item.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-navy-800 leading-snug">{item.message}</p>
                          {item.ipAddress && (
                            <p className="text-xs font-mono text-gray-400 mt-0.5">IP: {item.ipAddress}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">{formatRelative(item.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 bg-white rounded-2xl shadow-card border border-border p-6 animate-fade-in-up stagger-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-navy-900">Recent Documents</h3>
                <Link to="/client/documents" className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                  View all
                </Link>
              </div>
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center text-gray-400">
                  <Inbox size={36} className="mb-3 opacity-30" />
                  <p className="text-sm font-semibold text-gray-500">No documents vaulted yet.</p>
                  <p className="text-xs mt-1 max-w-xs">
                    Upload your first document to initialize cryptographic protection.
                  </p>
                  <Link
                    to="/client/upload"
                    className="mt-4 inline-flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors"
                  >
                    <Upload size={13} /> Upload Now
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs font-semibold text-gray-500 border-b border-border">
                        <th className="text-left pb-3 pr-4">Document</th>
                        <th className="text-left pb-3 pr-4 hidden sm:table-cell">Type</th>
                        <th className="text-left pb-3 pr-4 hidden md:table-cell">Uploaded</th>
                        <th className="text-left pb-3">SHA-256</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {documents.slice(0, 5).map(doc => (
                        <tr key={doc._id} className="group hover:bg-surface transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                                <FileText size={14} className="text-navy-700" />
                              </div>
                              <span className="text-sm font-medium text-navy-900 truncate max-w-[140px]">
                                {doc.originalFilename}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 hidden sm:table-cell">
                            <span className="text-sm text-gray-500">{doc.documentType}</span>
                          </td>
                          <td className="py-3 pr-4 hidden md:table-cell">
                            <span className="text-sm text-gray-500">
                              {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="text-xs font-mono text-gray-400 inline-flex items-center gap-1">
                              <ShieldCheck size={11} className="text-teal-500" />
                              {doc.sha256Hash?.slice(0, 12)}…
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
