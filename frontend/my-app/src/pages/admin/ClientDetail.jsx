import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, ChevronLeft, ShieldCheck, AlertTriangle, Eye, Lock, Calendar, HardDrive } from 'lucide-react';
import { AdminSidebar, AdminTopbar } from '../../components/AdminLayout';
import ScoreGauge from '../../components/ScoreGauge';
import SecurityBadge from '../../components/SecurityBadge';
import { mockClients, mockDocuments } from '../../data/mockData';

// Simulated decrypt and verify + AI insights panel
function DocumentReviewPanel({ doc, onClose }) {
  const [phase, setPhase] = useState('idle'); // idle | verifying | done

  const startVerify = () => {
    setPhase('verifying');
    setTimeout(() => setPhase('done'), 2200);
  };

  const flags = doc.aiSummary?.flags || [];
  const fields = doc.aiSummary?.fields || [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 animate-fade-in overflow-y-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-4xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center">
              <FileText size={18} className="text-navy-700" />
            </div>
            <div>
              <h2 className="font-bold text-navy-900">{doc.name}</h2>
              <p className="text-xs text-gray-500">{doc.type} · {doc.size}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">✕</button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Idle state */}
          {phase === 'idle' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center mb-4">
                <Lock size={28} className="text-navy-700" />
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">Document is Encrypted</h3>
              <p className="text-sm text-gray-500 max-w-sm mb-6">
                Click below to decrypt and verify document integrity before reviewing its contents and AI insights.
              </p>
              <div className="flex flex-wrap gap-3 mb-6 justify-center">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-surface px-3 py-1.5 rounded-full border border-border">
                  <Lock size={12} className="text-teal-600" /> {doc.encryptionStatus}
                </div>
                <SecurityBadge status={doc.tamperCheck === 'Passed' ? 'Verified' : doc.tamperCheck === 'Failed' ? 'Flagged' : 'Pending'} />
                <SecurityBadge status={doc.status} />
              </div>
              <button
                onClick={startVerify}
                className="bg-navy-900 hover:bg-navy-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <ShieldCheck size={16} />
                Decrypt & Verify Integrity
              </button>
            </div>
          )}

          {/* Verifying */}
          {phase === 'verifying' && (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full border-4 border-navy-100 border-t-navy-700 animate-spin-slow mb-5" />
              <h3 className="text-lg font-bold text-navy-900 mb-2">Verifying Integrity...</h3>
              <div className="space-y-2 w-full max-w-xs">
                {['Decrypting with AES-256 key...', 'Computing SHA-256 hash...', 'Comparing with stored hash...'].map((msg, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin-slow flex-shrink-0" style={{ animationDelay: `${i * 0.2}s` }} />
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Done */}
          {phase === 'done' && (
            <div className="animate-fade-in">
              {/* Integrity result banner */}
              <div className={`flex items-center gap-3 p-4 rounded-xl mb-5 ${
                doc.tamperCheck === 'Failed'
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-teal-50 border border-teal-200'
              }`}>
                {doc.tamperCheck === 'Failed'
                  ? <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
                  : <ShieldCheck size={20} className="text-teal-600 flex-shrink-0" />
                }
                <div>
                  <p className={`text-sm font-bold ${doc.tamperCheck === 'Failed' ? 'text-amber-700' : 'text-teal-700'}`}>
                    {doc.tamperCheck === 'Failed' ? 'Integrity Check FAILED — Document may be tampered' : 'Integrity Verified — Document is authentic'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 font-mono">{doc.hash}</p>
                </div>
              </div>

              {/* Two-column: preview + insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Document Preview */}
                <div>
                  <h3 className="text-sm font-bold text-navy-900 mb-3">Document Preview</h3>
                  <div className="bg-gray-100 rounded-xl border border-border h-56 flex flex-col items-center justify-center gap-3">
                    <FileText size={32} className="text-gray-400" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">{doc.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{doc.type} · {doc.size}</p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                        <Lock size={11} /> Decrypted View
                      </div>
                      <SecurityBadge status={doc.status} />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { icon: Calendar, label: 'Uploaded', val: new Date(doc.uploadDate).toLocaleDateString('en-IN') },
                      { icon: HardDrive, label: 'Size', val: doc.size },
                      { icon: Lock, label: 'Encryption', val: doc.encryptionStatus },
                      { icon: ShieldCheck, label: 'Tamper', val: doc.tamperCheck },
                    ].map(m => (
                      <div key={m.label} className="bg-surface rounded-lg p-2.5 border border-border">
                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                          <m.icon size={11} /> {m.label}
                        </div>
                        <p className="text-xs font-semibold text-navy-900">{m.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insights */}
                <div>
                  <h3 className="text-sm font-bold text-navy-900 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-navy-900 text-white text-[10px] font-bold flex items-center justify-center">AI</span>
                    AI Insights
                  </h3>

                  {/* Flags first */}
                  {flags.length > 0 && flags.map((flag, i) => (
                    <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl mb-3 ${
                      flag.type === 'critical'
                        ? 'bg-amber-50 border border-amber-300'
                        : 'bg-gold-50 border border-gold-200'
                    }`}>
                      <AlertTriangle size={15} className={flag.type === 'critical' ? 'text-amber-600' : 'text-gold-500'} />
                      <p className="text-xs text-gray-700 leading-relaxed">{flag.message}</p>
                    </div>
                  ))}

                  {/* Extracted fields */}
                  {fields.length > 0 && (
                    <div className="bg-surface rounded-xl border border-border overflow-hidden mb-3">
                      <div className="px-3 py-2 border-b border-border bg-navy-50">
                        <p className="text-xs font-semibold text-navy-700">Extracted Key Fields</p>
                      </div>
                      <div className="divide-y divide-border">
                        {fields.map(f => (
                          <div key={f.label} className="flex items-center justify-between px-3 py-2">
                            <span className="text-xs text-gray-500">{f.label}</span>
                            <span className="text-xs font-semibold text-navy-900">{f.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* NL summary */}
                  {doc.aiSummary?.summary && (
                    <div className="bg-navy-900 rounded-xl p-3">
                      <p className="text-xs font-semibold text-teal-400 mb-1.5">Summary</p>
                      <p className="text-xs text-navy-100/80 leading-relaxed">{doc.aiSummary.summary}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const client = mockClients.find(c => c.id === id) || mockClients[0];
  const clientDocs = mockDocuments.filter(d => d.clientId === client.id);

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

          {/* Back */}
          <Link to="/admin/clients" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 mb-6 transition-colors">
            <ChevronLeft size={16} /> Back to Clients
          </Link>

          {/* Client profile header */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-6 mb-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-navy-900 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                {client.avatar}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-navy-900">{client.name}</h1>
                <p className="text-gray-500 text-sm">{client.email} · {client.phone}</p>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="text-xs text-gray-500 bg-surface border border-border px-2.5 py-1 rounded-full">
                    Client since {new Date(client.joinDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-gray-500 bg-surface border border-border px-2.5 py-1 rounded-full">
                    {client.documentCount} documents
                  </span>
                  {client.pendingCount > 0 && (
                    <span className="text-xs text-gold-500 bg-gold-50 border border-gold-200 px-2.5 py-1 rounded-full font-medium">
                      {client.pendingCount} pending review
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <ScoreGauge score={client.securityScore} size={120} />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="animate-fade-in-up stagger-1">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Documents</h2>
            <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
              {clientDocs.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <FileText size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No documents uploaded yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {clientDocs.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 p-4 hover:bg-surface transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-navy-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.type} · {doc.size} · {new Date(doc.uploadDate).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <SecurityBadge status={doc.status} />
                        {doc.tamperCheck === 'Failed' && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                            <AlertTriangle size={11} /> Tamper
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-navy-700 bg-navy-50 hover:bg-navy-100 border border-navy-200 px-3 py-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Eye size={13} /> Review
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Document Review Modal */}
      {selectedDoc && <DocumentReviewPanel doc={selectedDoc} onClose={() => setSelectedDoc(null)} />}
    </div>
  );
}
