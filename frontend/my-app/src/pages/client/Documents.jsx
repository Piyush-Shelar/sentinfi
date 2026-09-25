import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Lock, ShieldCheck, AlertTriangle, X, Info, Hash,
  Calendar, HardDrive, Eye, Inbox, RefreshCw, Share2, UserCheck,
  XCircle, Users, ScanLine
} from 'lucide-react';
import ClientNavbar from '../../components/ClientNavbar';
import SecurityBadge from '../../components/SecurityBadge';
import ShareModal from '../../components/ShareModal';
import VerifyAndViewModal from '../../components/VerifyAndViewModal';
import { useAuth } from '../../context/AuthContext';

function RevokeConfirmModal({ grantInfo, docId, onClose, onRevoked, accessToken }) {
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState('');

  const handleRevoke = async () => {
    setRevoking(true);
    setError('');
    try {
      const res = await fetch(`/api/documents/${docId}/revoke-access`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ advisorId: grantInfo.advisorId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Revoke failed'); return; }
      onRevoked();
      onClose();
    } catch {
      setError('Unable to reach server.');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-sm animate-scale-in p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <XCircle size={24} className="text-amber-600" />
        </div>
        <h3 className="font-bold text-navy-900 mb-2">Revoke Advisor Access</h3>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          <span className="font-semibold text-navy-800">{grantInfo.advisorName}</span> will immediately
          lose the ability to decrypt this document. You can re-grant access later.
        </p>
        {error && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">{error}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-gray-600 hover:bg-surface transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleRevoke}
            disabled={revoking}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {revoking ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
            ) : (
              <>
                <XCircle size={14} /> Revoke Access
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentDetailModal({ doc, onClose, onShareClick }) {
  if (!doc) return null;
  const uploadedDate = doc.createdAt
    ? new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const fileSizeLabel = doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '—';
  const activeGrants = doc.accessGrants || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center">
              <FileText size={18} className="text-navy-700" />
            </div>
            <div>
              <h2 className="font-bold text-navy-900 text-sm">{doc.originalFilename}</h2>
              <p className="text-xs text-gray-500">{doc.documentType}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <SecurityBadge status="Verified" size="md" />
            {activeGrants.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 border border-teal-200 text-teal-700">
                <Users size={11} /> {activeGrants.length} advisor{activeGrants.length > 1 ? 's' : ''} with access
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Calendar,    label: 'Upload Date', value: uploadedDate },
              { icon: HardDrive,   label: 'File Size',   value: fileSizeLabel },
              { icon: Lock,        label: 'Encryption',  value: 'AES-256-GCM' },
              { icon: ShieldCheck, label: 'Key Wrap',    value: 'RSA-2048 OAEP' },
            ].map(item => (
              <div key={item.label} className="bg-surface rounded-xl p-3 border border-border">
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon size={13} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{item.label}</span>
                </div>
                <p className="text-sm font-semibold text-navy-900">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-surface rounded-xl p-3 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Hash size={13} className="text-gray-400" />
              <span className="text-xs text-gray-500">Document Hash (SHA-256)</span>
            </div>
            <p className="text-xs font-mono text-navy-700 break-all">{doc.sha256Hash || '—'}</p>
          </div>

          {activeGrants.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-surface border-b border-border flex items-center gap-2">
                <UserCheck size={13} className="text-navy-700" />
                <span className="text-xs font-semibold text-navy-700">Shared With</span>
              </div>
              <div className="divide-y divide-gray-50">
                {activeGrants.map(g => (
                  <div key={g.advisorId} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="w-7 h-7 rounded-lg bg-navy-900 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {g.advisorName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-navy-900 truncate">{g.advisorName}</p>
                      <p className="text-[11px] text-gray-400 truncate">{g.advisorEmail}</p>
                    </div>
                    <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex-shrink-0">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-navy-50 rounded-xl border border-navy-100">
            <Info size={15} className="text-navy-700 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-navy-700 leading-relaxed">
              Document content is not decrypted in this view. Sharing grants the advisor their own
              RSA-wrapped copy of the AES session key — your master key is never exposed.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { onClose(); onShareClick(doc); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-navy-900 text-navy-900 font-semibold text-sm hover:bg-navy-50 transition-all"
            >
              <Share2 size={15} /> Share with Advisor
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-navy-900 hover:bg-navy-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientDocuments() {
  const { accessToken } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [shareDoc, setShareDoc] = useState(null);
  const [verifyDoc, setVerifyDoc] = useState(null);
  const [revokeInfo, setRevokeInfo] = useState(null);
  const [filterType, setFilterType] = useState('All');
  const [view, setView] = useState('table');

  const fetchDocs = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/documents/my-documents', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to load documents'); return; }
      setDocs(data);
    } catch {
      setError('Unable to reach server.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const typeOptions = ['All', ...new Set(docs.map(d => d.documentType))];
  const filtered = filterType === 'All' ? docs : docs.filter(d => d.documentType === filterType);

  const openShare = (doc) => {
    setSelectedDoc(null);
    setShareDoc(doc);
  };

  const openVerify = (doc) => {
    setSelectedDoc(null);
    setVerifyDoc(doc);
  };

  return (
    <div className="min-h-screen bg-surface">
      <ClientNavbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in-up flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">My Documents</h1>
            <p className="text-gray-500 text-sm mt-1">All files stored in your encrypted vault</p>
          </div>
          <button
            onClick={fetchDocs}
            disabled={loading}
            className="p-2 rounded-xl border border-border bg-white hover:bg-gray-50 text-gray-500 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <AlertTriangle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 animate-fade-in-up stagger-1">
          <div className="flex gap-2 flex-wrap">
            {typeOptions.map(s => (
              <button
                key={s}
                onClick={() => setFilterType(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  filterType === s
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'border-border text-gray-600 hover:border-navy-400 hover:text-navy-700 bg-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="sm:ml-auto flex gap-2">
            {['table', 'grid'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  view === v ? 'bg-navy-900 text-white border-navy-900' : 'border-border text-gray-600 bg-white hover:border-navy-400'
                }`}
              >
                {v === 'table' ? '≡ Table' : '⊞ Grid'}
              </button>
            ))}
          </div>
        </div>

        {loading && docs.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-900 rounded-full animate-spin-slow" />
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-border shadow-card text-gray-400">
            <Inbox size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-semibold text-gray-500">No documents vaulted yet.</p>
            <p className="text-xs mt-1">Upload your first document to initialize cryptographic protection.</p>
          </div>
        ) : (
          <>
            {view === 'table' && (
              <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden animate-fade-in-up stagger-2">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface border-b border-border">
                      <tr className="text-xs font-semibold text-gray-500">
                        <th className="text-left py-3.5 px-5">Document</th>
                        <th className="text-left py-3.5 px-4 hidden sm:table-cell">Type</th>
                        <th className="text-left py-3.5 px-4 hidden md:table-cell">Uploaded</th>
                        <th className="text-left py-3.5 px-4">Encryption</th>
                        <th className="text-left py-3.5 px-4">Shared</th>
                        <th className="py-3.5 px-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map(doc => {
                        const grants = doc.accessGrants || [];
                        return (
                          <tr
                            key={doc._id}
                            className="hover:bg-surface transition-colors group"
                          >
                            <td className="py-3.5 px-5 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
                                  <FileText size={15} className="text-navy-700" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-navy-900 truncate max-w-[150px]">{doc.originalFilename}</p>
                                  <p className="text-xs text-gray-400">{doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 hidden sm:table-cell cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                              <span className="text-sm text-gray-600">{doc.documentType}</span>
                            </td>
                            <td className="py-3.5 px-4 hidden md:table-cell cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                              <span className="text-sm text-gray-600">
                                {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                              <div className="flex items-center gap-1.5">
                                <Lock size={12} className="text-teal-600" />
                                <span className="text-xs font-medium text-teal-700">AES-256-GCM</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              {grants.length > 0 ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {grants.map(g => (
                                    <span
                                      key={g.advisorId}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full group/grant"
                                    >
                                      <UserCheck size={10} />
                                      {g.advisorName?.split(' ')[0]}
                                      <button
                                        title="Revoke access"
                                        onClick={e => { e.stopPropagation(); setRevokeInfo({ ...g, docId: doc._id }); }}
                                        className="ml-1 text-teal-400 hover:text-amber-600 transition-colors"
                                      >
                                        <X size={10} />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openVerify(doc)}
                                  className="flex items-center gap-1 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 px-2.5 py-1.5 rounded-lg transition-all"
                                >
                                  <ScanLine size={12} /> Verify &amp; View
                                </button>
                                <button
                                  onClick={() => openShare(doc)}
                                  className="flex items-center gap-1 text-xs font-semibold text-teal-600"
                                >
                                  <Share2 size={13} /> Share
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div className="py-16 text-center text-gray-400">
                      <FileText size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No documents match this filter.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {view === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up stagger-2">
                {filtered.map(doc => {
                  const grants = doc.accessGrants || [];
                  return (
                    <div
                      key={doc._id}
                      className="bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all duration-200 p-5"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center">
                          <FileText size={18} className="text-navy-700" />
                        </div>
                        <SecurityBadge status="Verified" />
                      </div>
                      <h3
                        className="text-sm font-semibold text-navy-900 truncate mb-1 cursor-pointer hover:text-navy-700"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        {doc.originalFilename}
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">
                        {doc.documentType} · {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : ''}
                      </p>
                      {grants.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {grants.map(g => (
                            <span key={g.advisorId} className="inline-flex items-center gap-1 text-[11px] font-semibold bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full">
                              <UserCheck size={10} /> {g.advisorName?.split(' ')[0]}
                              <button
                                onClick={() => setRevokeInfo({ ...g, docId: doc._id })}
                                className="ml-0.5 text-teal-400 hover:text-amber-600 transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openVerify(doc)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg py-1.5 transition-all"
                        >
                          <ScanLine size={12} /> Verify &amp; View
                        </button>
                        <button
                          onClick={() => openShare(doc)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-teal-700 border border-teal-200 bg-teal-50 hover:bg-teal-100 rounded-lg py-1.5 transition-all"
                        >
                          <Share2 size={12} /> Share
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {selectedDoc && (
        <DocumentDetailModal
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onShareClick={openShare}
          onVerifyClick={openVerify}
        />
      )}

      {shareDoc && (
        <ShareModal
          doc={shareDoc}
          onClose={() => setShareDoc(null)}
          onGranted={fetchDocs}
        />
      )}

      {verifyDoc && (
        <VerifyAndViewModal
          doc={verifyDoc}
          onClose={() => setVerifyDoc(null)}
        />
      )}

      {revokeInfo && (
        <RevokeConfirmModal
          grantInfo={revokeInfo}
          docId={revokeInfo.docId}
          accessToken={accessToken}
          onClose={() => setRevokeInfo(null)}
          onRevoked={fetchDocs}
        />
      )}
    </div>
  );
}
