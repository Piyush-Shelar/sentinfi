import React, { useState, useEffect, useCallback } from 'react';
import { FileText, ShieldCheck, Lock, Search, Inbox, AlertTriangle } from 'lucide-react';
import { AdminSidebar, AdminTopbar } from '../../components/AdminLayout';
import DocumentBadge from '../../components/DocumentBadge';
import VerifyAndViewModal from '../../components/VerifyAndViewModal';
import TamperAlertModal from '../../components/TamperAlertModal';
import { useAuth } from '../../context/AuthContext';

export default function AdminDocuments() {
  const { accessToken } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  const [verifyDoc, setVerifyDoc] = useState(null);
  const [tamperPayload, setTamperPayload] = useState(null);

  const fetchDocuments = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/all-documents', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleVerify = async (doc) => {
    if (doc.isAuthorized) {
      setVerifyDoc(doc);
    } else {
      // Simulate tamper path by calling verify directly
      try {
        const res = await fetch(`/api/documents/${doc._id}/verify-and-view?_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();
        
        if (data.tamperDetected) {
          setTamperPayload(data);
        } else if (!res.ok) {
          alert('Error: ' + data.error);
        }
      } catch (err) {
        alert('Network error during verification attempt.');
      }
    }
  };

  const filtered = documents.filter(d => 
    d.originalFilename.toLowerCase().includes(search.toLowerCase()) ||
    d.clientId?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-surface font-sans">
      <div className="hidden lg:block">
        <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>
      {mobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileSidebar(false)} />
          <div className="relative z-50 h-full w-64 bg-navy-950 flex flex-col">
            <AdminSidebar collapsed={false} onToggle={() => {}} />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopbar onMobileSidebarToggle={() => setMobileSidebar(true)} />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
        
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Client Documents Feed</h1>
            <p className="text-sm text-gray-500 mt-1">
              Global ledger of all client-uploaded documents and vault access grants.
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by filename or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/10 transition-shadow"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading ledger...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Inbox size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold text-gray-500">No documents found in ledger.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-3 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Document</th>
                    <th className="py-3 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client</th>
                    <th className="py-3 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type / Size</th>
                    <th className="py-3 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Access Status</th>
                    <th className="py-3 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(doc => (
                    <tr key={doc._id} className="hover:bg-surface transition-colors group">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
                            <FileText size={16} className="text-navy-700" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-navy-900 truncate max-w-[200px]">{doc.originalFilename}</p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-[150px]" title={doc.sha256Hash}>
                              {doc.sha256Hash?.substring(0, 12)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-sm font-semibold text-navy-900">{doc.clientId?.name}</p>
                        <p className="text-xs text-gray-500">{doc.clientId?.email}</p>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-1.5 items-start">
                          <DocumentBadge type={doc.documentType} />
                          <span className="text-xs text-gray-500">{doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : ''}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        {doc.isAuthorized ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            <ShieldCheck size={12} /> Authorized by Client
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Lock size={12} /> Access Restricted (No Grant)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {doc.isAuthorized ? (
                          <button
                            onClick={() => handleVerify(doc)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 px-3 py-1.5 rounded-lg transition-all"
                          >
                            Verify &amp; View Document
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerify(doc)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 bg-white border border-navy-200 hover:bg-navy-50 px-3 py-1.5 rounded-lg transition-all"
                          >
                            Test Cryptographic Integrity
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {verifyDoc && (
        <VerifyAndViewModal
          doc={verifyDoc}
          onClose={() => setVerifyDoc(null)}
        />
      )}

      {tamperPayload && (
        <TamperAlertModal
          errorPayload={tamperPayload}
          onClose={() => setTamperPayload(null)}
        />
      )}
        </main>
      </div>
    </div>
  );
}
