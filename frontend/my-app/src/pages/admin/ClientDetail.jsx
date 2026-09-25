import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, ChevronLeft, AlertTriangle, Lock, Inbox, RefreshCw, ScanLine } from 'lucide-react';
import { AdminSidebar, AdminTopbar } from '../../components/AdminLayout';
import ScoreGauge from '../../components/ScoreGauge';
import SecurityBadge from '../../components/SecurityBadge';
import VerifyAndViewModal from '../../components/VerifyAndViewModal';
import { useAuth } from '../../context/AuthContext';

export default function ClientDetail() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [verifyDoc, setVerifyDoc] = useState(null);
  const [client, setClient] = useState(null);
  const [clientDocs, setClientDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard/advisor-dashboard-summary', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to load client data'); return; }

      const found = (data.assignedClients || []).find(c => c.id?.toString() === id);
      setClient(found || null);
      const docs = (data.documents || []).filter(d => d.clientId?.toString() === id);
      setClientDocs(docs);
    } catch {
      setError('Unable to reach server.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const initials = client?.name?.split(' ').map(w => w[0]).slice(0, 2).join('') || '?';
  const score = 70;

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

          <div className="flex items-center justify-between mb-6">
            <Link to="/admin/clients" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 transition-colors">
              <ChevronLeft size={16} /> Back to Clients
            </Link>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl border border-border bg-white hover:bg-gray-50 text-gray-500 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <AlertTriangle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {loading && !client ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-900 rounded-full animate-spin-slow" />
            </div>
          ) : !client ? (
            <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400 bg-white rounded-2xl border border-border shadow-card">
              <Inbox size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-semibold text-gray-500">Client not found.</p>
              <p className="text-xs mt-1">This client may not have shared any documents with you yet.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-border shadow-card p-6 mb-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-navy-900 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-navy-900">{client.name}</h1>
                    <p className="text-gray-500 text-sm">{client.email}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="text-xs text-gray-500 bg-surface border border-border px-2.5 py-1 rounded-full">
                        Client since {client.joinDate ? new Date(client.joinDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
                      </span>
                      <span className="text-xs text-gray-500 bg-surface border border-border px-2.5 py-1 rounded-full">
                        {clientDocs.length} document{clientDocs.length !== 1 ? 's' : ''} shared
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <ScoreGauge score={score} size={120} />
                  </div>
                </div>
              </div>

              <div className="animate-fade-in-up stagger-1">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Shared Documents
                </h2>
                <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
                  {clientDocs.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                      <Inbox size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-semibold text-gray-500">No documents shared yet.</p>
                      <p className="text-xs mt-1">Documents will appear here once the client grants you access.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {clientDocs.map(doc => (
                        <div
                          key={doc._id}
                          className="flex items-center gap-4 p-4 hover:bg-surface transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
                            <FileText size={16} className="text-navy-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-navy-900 truncate">{doc.originalFilename}</p>
                            <p className="text-xs text-gray-500">
                              {doc.documentType} · {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : ''} · {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1 text-xs text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                              <Lock size={10} /> AES-256-GCM
                            </div>
                            <SecurityBadge status="Verified" />
                          </div>
                          <button
                            onClick={() => setVerifyDoc(doc)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 px-3 py-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                          >
                            <ScanLine size={13} /> Verify &amp; View
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {verifyDoc && (
        <VerifyAndViewModal
          doc={verifyDoc}
          onClose={() => setVerifyDoc(null)}
        />
      )}
    </div>
  );
}
