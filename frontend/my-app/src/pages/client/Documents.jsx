import React, { useState } from 'react';
import { FileText, Lock, ShieldCheck, AlertTriangle, X, Info, Hash, Calendar, HardDrive, Eye } from 'lucide-react';
import ClientNavbar from '../../components/ClientNavbar';
import SecurityBadge from '../../components/SecurityBadge';
import { mockDocuments } from '../../data/mockData';

const clientDocs = mockDocuments.filter(d => d.clientId === 'c001');

function DocumentDetailModal({ doc, onClose }) {
  if (!doc) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-lg animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center">
              <FileText size={18} className="text-navy-700" />
            </div>
            <div>
              <h2 className="font-bold text-navy-900 text-sm">{doc.name}</h2>
              <p className="text-xs text-gray-500">{doc.type}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Status */}
          <div className="flex flex-wrap gap-2">
            <SecurityBadge status={doc.status} size="md" />
            <SecurityBadge status={doc.tamperCheck === 'Passed' ? 'Verified' : doc.tamperCheck === 'Failed' ? 'Flagged' : 'Pending'} size="md" />
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Calendar, label: 'Upload Date', value: new Date(doc.uploadDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
              { icon: HardDrive, label: 'File Size', value: doc.size },
              { icon: Lock, label: 'Encryption', value: doc.encryptionStatus },
              { icon: ShieldCheck, label: 'Tamper Check', value: doc.tamperCheck },
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

          {/* Hash */}
          <div className="bg-surface rounded-xl p-3 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Hash size={13} className="text-gray-400" />
              <span className="text-xs text-gray-500">Document Hash (SHA-256)</span>
            </div>
            <p className="text-xs font-mono text-navy-700 break-all">{doc.hash}</p>
          </div>

          {/* Note */}
          <div className="flex items-start gap-2 p-3 bg-navy-50 rounded-xl border border-navy-100">
            <Info size={15} className="text-navy-700 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-navy-700 leading-relaxed">
              Document content is not decrypted here. This view shows metadata only.
              Your advisor decrypts documents during review using your shared key.
            </p>
          </div>
        </div>
        <div className="p-5 pt-0">
          <button onClick={onClose} className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientDocuments() {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [view, setView] = useState('table'); // 'table' | 'grid'

  const statuses = ['All', 'Verified', 'Pending', 'Under Review', 'Flagged'];
  const filtered = filterStatus === 'All' ? clientDocs : clientDocs.filter(d => d.status === filterStatus);

  return (
    <div className="min-h-screen bg-surface">
      <ClientNavbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-navy-900">My Documents</h1>
          <p className="text-gray-500 text-sm mt-1">All files stored in your encrypted vault</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 animate-fade-in-up stagger-1">
          <div className="flex gap-2 flex-wrap">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  filterStatus === s
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

        {/* Table view */}
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
                    <th className="text-left py-3.5 px-4">Status</th>
                    <th className="text-left py-3.5 px-4">Tamper</th>
                    <th className="py-3.5 px-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(doc => (
                    <tr
                      key={doc.id}
                      className="hover:bg-surface transition-colors group cursor-pointer"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
                            <FileText size={15} className="text-navy-700" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-navy-900 truncate max-w-[150px]">{doc.name}</p>
                            <p className="text-xs text-gray-400">{doc.size}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <span className="text-sm text-gray-600">{doc.type}</span>
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className="text-sm text-gray-600">
                          {new Date(doc.uploadDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Lock size={12} className="text-teal-600" />
                          <span className="text-xs font-medium text-teal-700">{doc.encryptionStatus}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <SecurityBadge status={doc.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        {doc.tamperCheck === 'Passed' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-teal-600">
                            <ShieldCheck size={13} /> Passed
                          </span>
                        ) : doc.tamperCheck === 'Failed' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold">
                            <AlertTriangle size={13} /> Failed
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <button
                          className="flex items-center gap-1 text-xs font-semibold text-navy-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); }}
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
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

        {/* Grid view */}
        {view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up stagger-2">
            {filtered.map(doc => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all duration-200 p-5 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center">
                    <FileText size={18} className="text-navy-700" />
                  </div>
                  <SecurityBadge status={doc.status} />
                </div>
                <h3 className="text-sm font-semibold text-navy-900 truncate mb-1">{doc.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{doc.type} · {doc.size}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Lock size={11} className="text-teal-600" />
                    <span className="text-xs text-teal-700 font-medium">{doc.encryptionStatus}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(doc.uploadDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedDoc && <DocumentDetailModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />}
    </div>
  );
}
