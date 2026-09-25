import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, TrendingUp, ChevronRight, Lightbulb, CheckCircle,
  RefreshCw, AlertCircle, Bug, AlertTriangle, Lock,
  KeyRound, ScanLine, Fingerprint, Zap
} from 'lucide-react';
import ClientNavbar from '../../components/ClientNavbar';
import ScoreGauge from '../../components/ScoreGauge';
import { useAuth } from '../../context/AuthContext';

function barColor(v) {
  if (v >= 80) return 'bg-teal-500';
  if (v >= 60) return 'bg-amber-400';
  return 'bg-red-500';
}

function textColor(v) {
  if (v >= 80) return 'text-teal-600';
  if (v >= 60) return 'text-amber-500';
  return 'text-red-600';
}

const FACTOR_DEFS = [
  {
    key: 'encryption',
    name: 'Encryption Posture',
    weight: 0.30,
    Icon: Lock,
    description: (s, totalDocs) =>
      s === 100
        ? 'All documents are encrypted with AES-256-GCM and RSA-2048 OAEP key encapsulation.'
        : totalDocs === 0
          ? 'No documents uploaded yet. Score reaches 100 when your first encrypted document is stored.'
          : `${s}% of your documents have full cryptographic coverage.`,
    suggestion: (s) =>
      s < 100 ? 'Upload documents through the secure vault to ensure all files receive AES-256-GCM encryption.' : null,
  },
  {
    key: 'passwordHygiene',
    name: 'Password Hygiene',
    weight: 0.25,
    Icon: KeyRound,
    description: (s) =>
      s >= 100
        ? 'Your account credentials meet all security benchmarks.'
        : 'Your password hygiene score can be improved.',
    suggestion: (s) =>
      s < 85 ? 'Use a passphrase of 16+ characters and rotate your password every 90 days.' : null,
  },
  {
    key: 'tamperHistory',
    name: 'Document Integrity',
    weight: 0.20,
    Icon: ScanLine,
    description: (s) =>
      s === 100
        ? 'No SHA-256 baseline mismatches or GCM authentication tag failures recorded.'
        : `Integrity events detected — score penalised by ${100 - s} points.`,
    suggestion: (s) =>
      s < 100 ? 'Re-upload affected documents. Tamper detection evidence has been logged.' : null,
    warningTag: (s) => s < 100 ? 'Tamper attempt detected' : null,
  },
  {
    key: 'accessAnomaly',
    name: 'Access Anomalies',
    weight: 0.15,
    Icon: Fingerprint,
    description: (s) =>
      s === 100
        ? 'No unusual authentication events or session anomalies in the last 30 days.'
        : 'Anomalous access patterns detected. Score reduced accordingly.',
    suggestion: (s) =>
      s < 100 ? 'Review your recent login history and enable two-factor authentication.' : null,
    warningTag: (s) => s < 100 ? 'Anomalous sessions detected' : null,
  },
  {
    key: 'honeypot',
    name: 'Honeypot Tripwires (H)',
    weight: 0.10,
    Icon: Bug,
    description: (s) =>
      s === 100
        ? 'No decoy assets accessed. Zero-knowledge bait is live and armed in your vault.'
        : 'A synthetic decoy document was accessed. Automated containment was triggered.',
    suggestion: (s) =>
      s === 0 ? 'A security incident has been flagged. Contact your compliance officer immediately.' : null,
    warningTag: (s) => s === 0 ? 'Decoy triggered — Account locked' : null,
    tampered: (s) => s === 0,
  },
];

function FactorCard({ def, score, totalDocs, index }) {
  const bar = barColor(score);
  const txt = textColor(score);
  const desc = def.description(score, totalDocs);
  const suggestion = def.suggestion(score);
  const warningTag = def.warningTag?.(score);
  const isTampered = def.tampered?.(score);

  return (
    <div
      className="bg-white rounded-2xl border border-border shadow-card p-5 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.07}s`, opacity: 0 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <def.Icon size={15} className="text-navy-700" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <h3 className="font-bold text-navy-900 text-sm">{def.name}</h3>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                {Math.round(def.weight * 100)}%
              </span>
              {warningTag && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <AlertTriangle size={9} /> {warningTag}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
          </div>
        </div>
        <span className={`text-xl font-bold ${txt} ml-3 flex-shrink-0`}>{score}</span>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Score</span>
          <span className="text-xs text-gray-400">{score} / 100</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${bar}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {isTampered ? (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle size={13} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700 leading-relaxed font-medium">{suggestion}</p>
        </div>
      ) : suggestion ? (
        <div className="flex items-start gap-2 p-3 bg-gold-50 border border-gold-100 rounded-xl">
          <Lightbulb size={13} className="text-gold-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-700 leading-relaxed">{suggestion}</p>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-teal-600">
          <CheckCircle size={13} />
          <span>This area is optimal — no action needed.</span>
        </div>
      )}
    </div>
  );
}

export default function SecurityScore() {
  const { accessToken, handleLockedResponse } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard/dashboard-summary', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (handleLockedResponse(data)) return;
      if (!res.ok) { setError(data.error || 'Failed to load score'); return; }
      setSummary(data);
    } catch {
      setError('Unable to reach server.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, handleLockedResponse]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const securityHealth = summary?.securityHealth;
  const totalDocs = summary?.totalDocuments ?? 0;
  const overallScore = securityHealth?.compositeScore ?? 0;
  const factors = securityHealth?.factors ?? {};
  const status = securityHealth?.status ?? 'OPTIMAL';
  const honeypotStatus = summary?.honeypotStatus;
  const honeypotTriggered = honeypotStatus?.triggered || false;
  const honeypotEvents = honeypotStatus?.events || [];

  const statusConfig = {
    OPTIMAL:  { label: 'OPTIMAL',  cls: 'bg-teal-500/20 border-teal-400/30 text-teal-300' },
    WARNING:  { label: 'CAUTION',  cls: 'bg-amber-500/20 border-amber-400/30 text-amber-300' },
    CRITICAL: { label: 'CRITICAL', cls: 'bg-red-500/20 border-red-400/30 text-red-300' },
  };
  const sBadge = statusConfig[status] || statusConfig.OPTIMAL;

  const improvements = FACTOR_DEFS.filter(d => {
    const s = factors[d.key]?.score ?? 100;
    return d.suggestion(s) !== null && !d.tampered?.(s);
  });

  return (
    <div className="min-h-screen bg-surface">
      <ClientNavbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8 animate-fade-in-up flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Security Score</h1>
            <p className="text-gray-500 text-sm mt-1">Real-time 5-factor security health computed from your live vault telemetry</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl border border-border bg-white hover:bg-gray-50 text-gray-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <AlertCircle size={16} className="flex-shrink-0" /> {error}
          </div>
        )}

        {honeypotTriggered && (
          <div className="mb-6 flex items-start gap-3 px-5 py-4 bg-red-50 border-2 border-red-400 rounded-2xl animate-fade-in-up">
            <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800 mb-1">Security Incident — Honeypot Tripwire Triggered</p>
              <p className="text-xs text-red-700 leading-relaxed">
                An unauthorized access attempt on a protected decoy asset was detected. Your H factor has been set to 0
                and your account has been flagged for compliance review.
              </p>
              {honeypotEvents.length > 0 && (
                <div className="mt-3 space-y-2">
                  {honeypotEvents.map(evt => (
                    <div key={evt.id} className="text-xs bg-white border border-red-200 rounded-lg px-3 py-2 text-red-800">
                      <span className="font-semibold">{new Date(evt.timestamp).toLocaleString('en-IN')}</span>
                      {evt.ipAddress && <span className="ml-2 font-mono text-red-500">IP: {evt.ipAddress}</span>}
                      {evt.details?.message && <span className="ml-2">{evt.details.message}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {loading && !summary ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-900 rounded-full animate-spin-slow" />
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 mb-6 text-white shadow-lg animate-fade-in-up stagger-1">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="flex-shrink-0">
                  <ScoreGauge score={overallScore} size={180} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className={`inline-flex items-center gap-2 border rounded-full px-3 py-1 mb-3 ${sBadge.cls}`}>
                    <TrendingUp size={13} />
                    <span className="text-sm font-semibold">{sBadge.label}</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Overall Security Health</h2>
                  <p className="text-navy-100/70 text-sm leading-relaxed mb-1">
                    Computed in real-time across 5 weighted factors from your live vault telemetry.
                  </p>
                  <p className="text-navy-100/40 text-xs font-mono">
                    Score = 0.30·E + 0.25·P + 0.20·T + 0.15·A + 0.10·H
                  </p>
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {FACTOR_DEFS.map(def => {
                      const s = factors[def.key]?.score ?? 100;
                      return (
                        <div key={def.key} className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                          <div className="flex items-center gap-1.5 mb-1">
                            <def.Icon size={11} className="text-white/40" />
                            <div className="text-xs text-navy-100/50 truncate">{def.name}</div>
                          </div>
                          <div className={`text-base font-bold ${
                            s >= 80 ? 'text-teal-400' : s >= 60 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {s}
                            <span className="text-xs text-white/30 font-normal">/100</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 bg-white rounded-2xl border border-border shadow-card p-5 animate-fade-in-up stagger-2">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={15} className="text-navy-700" />
                <h3 className="font-bold text-navy-900 text-sm">Score Engine</h3>
                <span className="ml-auto text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  LIVE DB QUERIES
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {FACTOR_DEFS.map(def => {
                  const s = factors[def.key]?.score ?? 100;
                  const bar = barColor(s);
                  return (
                    <div key={def.key} className="text-center">
                      <div className={`text-sm font-bold ${textColor(s)} mb-1`}>{s}</div>
                      <div className="h-12 bg-gray-100 rounded-lg overflow-hidden relative flex flex-col justify-end">
                        <div
                          className={`${bar} rounded-b-lg transition-all duration-1000`}
                          style={{ height: `${s}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-gray-400 mt-1 leading-tight font-mono">
                        {def.key.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-[9px] text-gray-400">{Math.round(def.weight * 100)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {improvements.length > 0 && (
              <div className="bg-gold-50 border border-gold-100 rounded-2xl p-5 mb-6 animate-fade-in-up stagger-2">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={18} className="text-gold-500" />
                  <h3 className="font-bold text-navy-900">Improve Your Score</h3>
                </div>
                <div className="space-y-2">
                  {improvements.map(def => {
                    const s = factors[def.key]?.score ?? 100;
                    return (
                      <div key={def.key} className="flex items-start gap-3">
                        <ChevronRight size={14} className="text-gold-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-navy-800">{def.name}: </span>
                          <span className="text-sm text-gray-600">{def.suggestion(s)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Factor Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FACTOR_DEFS.map((def, idx) => (
                  <FactorCard
                    key={def.key}
                    def={def}
                    score={factors[def.key]?.score ?? 100}
                    totalDocs={totalDocs}
                    index={idx}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 bg-white rounded-2xl border border-border shadow-card p-6 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} className="text-navy-700" />
                <h3 className="font-bold text-navy-900">Security Best Practices</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { title: 'Enable 2FA', desc: 'Two-factor authentication adds a second layer of identity verification.' },
                  { title: 'Rotate Password', desc: 'Change your password every 90 days using a password manager.' },
                  { title: 'Review Access Logs', desc: 'Check who viewed your documents regularly for any unauthorized access.' },
                ].map(tip => (
                  <div key={tip.title} className="bg-surface rounded-xl p-4 border border-border">
                    <h4 className="text-sm font-semibold text-navy-900 mb-1">{tip.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{tip.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
