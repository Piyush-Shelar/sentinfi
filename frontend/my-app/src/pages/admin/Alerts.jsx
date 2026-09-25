import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, ShieldAlert, ChevronRight, Filter, Clock,
  RefreshCw, Inbox, Bug, UserX, FileText, Lock, ShieldOff, UnlockKeyhole
} from 'lucide-react';
import { AdminSidebar, AdminTopbar } from '../../components/AdminLayout';
import { useAuth } from '../../context/AuthContext';

const SEVERITY_CONFIG = {
  CRITICAL: { dot: 'bg-amber-600', text: 'text-amber-700', bg: 'bg-amber-50',    border: 'border-l-amber-500', badge: 'bg-amber-600 text-white' },
  HIGH:     { dot: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50/60', border: 'border-l-amber-400', badge: 'bg-amber-400 text-white' },
  MEDIUM:   { dot: 'bg-yellow-500',text: 'text-yellow-700',bg: 'bg-yellow-50',   border: 'border-l-yellow-400',badge: 'bg-yellow-500 text-white' },
  LOW:      { dot: 'bg-gray-400',  text: 'text-gray-600',  bg: 'bg-gray-50',     border: 'border-l-gray-300', badge: 'bg-gray-400 text-white' },
};

const EVENT_ICON = {
  HONEYPOT_TRIGGERED: Bug,
  TAMPER_DETECTED:    AlertTriangle,
  AUTH_FAILURE:       Lock,
  ACCESS_ANOMALY:     ShieldAlert,
};

const EVENT_LABEL = {
  HONEYPOT_TRIGGERED: 'Honeypot Tripwire Triggered',
  TAMPER_DETECTED:    'Document Tamper Detected',
  AUTH_FAILURE:       'Authentication Failure',
  ACCESS_ANOMALY:     'Unauthorized Access Anomaly',
};

function formatTs(ts) {
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatRelative(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function AlertRow({ event, onUnlock, unlocking }) {
  const sev = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.LOW;
  const Icon = EVENT_ICON[event.eventType] || AlertTriangle;
  const label = EVENT_LABEL[event.eventType] || event.eventType;

  return (
    <div className={`p-5 border-l-4 ${sev.border} ${sev.bg} bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${sev.badge} flex-shrink-0 self-start`}>
          <Icon size={11} />
          {event.severity}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-navy-900 mb-0.5">{label}</p>
          {event.details?.message && (
            <p className="text-sm text-gray-600 leading-relaxed mb-2">{event.details.message}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            {event.actor?.name && (
              <span className="flex items-center gap-1">
                <UserX size={11} /> Actor: <span className="font-medium text-navy-800">{event.actor.name}</span>
              </span>
            )}
            {event.client?.name && event.client.name !== event.actor?.name && (
              <span className="flex items-center gap-1">
                Client: <span className="font-medium text-navy-800">{event.client.name}</span>
              </span>
            )}
            {event.document?.filename && (
              <span className="flex items-center gap-1">
                <FileText size={11} /> {event.document.filename}
              </span>
            )}
            {event.ipAddress && (
              <span className="font-mono">IP: {event.ipAddress}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Clock size={11} className="text-gray-400" />
            <span className="text-xs text-gray-400">{formatTs(event.timestamp)}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">{formatRelative(event.timestamp)}</span>
          </div>
        </div>
        {event.eventType === 'HONEYPOT_TRIGGERED' && event.actor?.id && (
          <button
            onClick={() => onUnlock(event.actor.id, event.actor.name)}
            disabled={unlocking === event.actor.id}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-all disabled:opacity-60 self-start"
          >
            {unlocking === event.actor.id
              ? <div className="w-3 h-3 border-2 border-teal-400/30 border-t-teal-600 rounded-full animate-spin" />
              : <UnlockKeyhole size={13} />
            }
            Unlock
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminAlerts() {
  const { accessToken } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(null);
  const [unlockMsg, setUnlockMsg] = useState('');

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (eventTypeFilter !== 'All') params.set('eventType', eventTypeFilter);
      if (severityFilter !== 'All') params.set('severity', severityFilter);

      const [evRes, sumRes] = await Promise.all([
        fetch(`/api/admin/security-events?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/admin/security-summary', { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);

      const evData = await evRes.json();
      const sumData = await sumRes.json();

      if (evRes.ok) setEvents(evData.events || []);
      if (sumRes.ok) setSummary(sumData);
      if (!evRes.ok) setError(evData.error || 'Failed to load events');
    } catch {
      setError('Unable to reach server.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, eventTypeFilter, severityFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUnlock = async (userId, userName) => {
    setUnlocking(userId);
    setUnlockMsg('');
    try {
      const res = await fetch(`/api/admin/unlock-user/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setUnlockMsg(res.ok ? data.message : data.error || 'Unlock failed');
      if (res.ok) fetchData();
    } catch {
      setUnlockMsg('Unable to reach server.');
    } finally {
      setUnlocking(null);
    }
  };

  const eventTypes = ['All', 'HONEYPOT_TRIGGERED', 'TAMPER_DETECTED', 'AUTH_FAILURE', 'ACCESS_ANOMALY'];
  const severities = ['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

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

          <div className="mb-6 animate-fade-in-up flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <ShieldAlert size={22} className="text-amber-600" />
                <h1 className="text-2xl font-bold text-navy-900">Security Alerts</h1>
              </div>
              <p className="text-gray-500 text-sm">Real-time intrusion events from honeypot detection and tamper auditing</p>
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
            <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <AlertTriangle size={16} className="flex-shrink-0" /> {error}
            </div>
          )}

          {unlockMsg && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-700">
              <UnlockKeyhole size={16} className="flex-shrink-0" /> {unlockMsg}
            </div>
          )}

          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 animate-fade-in-up stagger-1">
              {[
                { label: 'Honeypot Triggers', count: summary.honeypotCount,      color: 'bg-amber-50 border-amber-200 text-amber-700', Icon: Bug },
                { label: 'Tamper Events',     count: summary.tamperCount,        color: 'bg-amber-50/70 border-amber-100 text-amber-600', Icon: AlertTriangle },
                { label: 'Total Events',      count: summary.totalEvents,        color: 'bg-navy-50 border-navy-100 text-navy-700', Icon: ShieldAlert },
                { label: 'Locked Accounts',   count: summary.lockedAccountCount, color: 'bg-red-50 border-red-200 text-red-700', Icon: ShieldOff },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-4 ${s.color} flex items-center gap-3`}>
                  <s.Icon size={20} className="flex-shrink-0 opacity-70" />
                  <div>
                    <div className="text-xl font-bold">{s.count}</div>
                    <div className="text-xs font-semibold uppercase tracking-wide mt-0.5 opacity-80">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {summary?.lockedUsers?.length > 0 && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl animate-fade-in-up stagger-1">
              <div className="flex items-center gap-2 mb-2">
                <ShieldOff size={15} className="text-red-600" />
                <p className="text-sm font-bold text-red-700">Contained Accounts ({summary.lockedUsers.length})</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.lockedUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-2 bg-white border border-red-200 rounded-lg px-3 py-1.5">
                    <UserX size={12} className="text-red-500" />
                    <span className="text-xs font-medium text-navy-800">{u.name}</span>
                    <span className="text-xs text-gray-400">{u.email}</span>
                    <button
                      onClick={() => handleUnlock(u.id, u.name)}
                      disabled={unlocking === u.id}
                      className="text-xs text-teal-600 font-semibold hover:text-teal-800 flex items-center gap-1 ml-1"
                    >
                      <UnlockKeyhole size={11} /> Unlock
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-border shadow-card p-4 mb-5 animate-fade-in-up stagger-2">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={14} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-600">Filters</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Event Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {eventTypes.map(s => (
                    <button key={s} onClick={() => setEventTypeFilter(s)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                        eventTypeFilter === s ? 'bg-navy-900 text-white border-navy-900' : 'border-border text-gray-600 bg-white hover:border-navy-400'
                      }`}
                    >
                      {s === 'All' ? 'All' : EVENT_LABEL[s] || s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Severity</p>
                <div className="flex flex-wrap gap-1.5">
                  {severities.map(s => (
                    <button key={s} onClick={() => setSeverityFilter(s)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                        severityFilter === s ? 'bg-navy-900 text-white border-navy-900' : 'border-border text-gray-600 bg-white hover:border-navy-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {loading && events.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-900 rounded-full animate-spin-slow" />
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border shadow-card py-20 text-center text-gray-400 flex flex-col items-center animate-fade-in-up stagger-3">
              <Inbox size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-semibold text-gray-500">No security events detected.</p>
              <p className="text-xs mt-1">Honeypot tripwires are armed. Intrusion events will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in-up stagger-3">
              {events.map(event => (
                <AlertRow
                  key={event.id}
                  event={event}
                  onUnlock={handleUnlock}
                  unlocking={unlocking}
                />
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mt-6">
            Showing {events.length} event{events.length !== 1 ? 's' : ''}{summary ? ` of ${summary.totalEvents} total` : ''}
          </p>
        </main>
      </div>
    </div>
  );
}
