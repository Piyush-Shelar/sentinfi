import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, ShieldCheck, Lock, UserCheck, AlertTriangle, Loader, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ShareModal({ doc, onClose, onGranted }) {
  const { accessToken } = useAuth();
  const [advisors, setAdvisors] = useState([]);
  const [loadingAdvisors, setLoadingAdvisors] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState('select');
  const [errorMsg, setErrorMsg] = useState('');

  const existingGrantIds = new Set(
    (doc?.accessGrants || []).map(g => g.advisorId?.toString())
  );

  const fetchAdvisors = useCallback(async () => {
    if (!accessToken) return;
    setLoadingAdvisors(true);
    try {
      const res = await fetch('/api/advisors', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) setAdvisors(data);
    } catch {
      /* silent */
    } finally {
      setLoadingAdvisors(false);
    }
  }, [accessToken]);

  useEffect(() => { fetchAdvisors(); }, [fetchAdvisors]);

  const filtered = advisors.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleGrant = async () => {
    if (!selected) return;
    setPhase('encrypting');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/documents/${doc._id}/grant-access`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ advisorId: selected.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Grant failed');
        setPhase('select');
        return;
      }
      setPhase('success');
      setTimeout(() => {
        onGranted?.();
        onClose();
      }, 2200);
    } catch {
      setErrorMsg('Unable to reach server.');
      setPhase('select');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={phase === 'select' ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-lg animate-scale-in">

        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center">
              <Lock size={18} className="text-navy-700" />
            </div>
            <div>
              <h2 className="font-bold text-navy-900 text-sm">Share with Advisor</h2>
              <p className="text-xs text-gray-500 truncate max-w-[260px]">{doc?.originalFilename}</p>
            </div>
          </div>
          {phase === 'select' && (
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          )}
        </div>

        <div className="p-5">
          {phase === 'select' && (
            <>
              <div className="mb-4">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm text-navy-900 focus:outline-none focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 transition-all"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
                {loadingAdvisors ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-4 border-navy-200 border-t-navy-900 rounded-full animate-spin-slow" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <UserCheck size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No advisors found.</p>
                  </div>
                ) : (
                  filtered.map(advisor => {
                    const alreadyGranted = existingGrantIds.has(advisor.id?.toString());
                    const isSelected = selected?.id?.toString() === advisor.id?.toString();
                    return (
                      <button
                        key={advisor.id}
                        disabled={alreadyGranted}
                        onClick={() => !alreadyGranted && setSelected(advisor)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          alreadyGranted
                            ? 'opacity-50 cursor-not-allowed border-border bg-gray-50'
                            : isSelected
                            ? 'border-navy-900 bg-navy-50'
                            : 'border-border hover:border-navy-400 hover:bg-surface'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-navy-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {advisor.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-navy-900 truncate">{advisor.name}</p>
                          <p className="text-xs text-gray-500 truncate">{advisor.email}</p>
                        </div>
                        {alreadyGranted ? (
                          <span className="text-xs text-teal-600 font-semibold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex-shrink-0">
                            Shared
                          </span>
                        ) : isSelected ? (
                          <CheckCircle size={18} className="text-navy-900 flex-shrink-0" />
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>

              {selected && (
                <div className="mb-4 p-3 bg-navy-900 rounded-xl text-xs text-navy-100/80 leading-relaxed">
                  <p className="font-semibold text-teal-400 mb-1">How this works</p>
                  The document's ephemeral AES-256 session key will be re-encapsulated using
                  <span className="font-mono text-white"> {selected.name}'s </span>
                  RSA-2048 public key. Only they can unwrap it with their private key.
                  You can revoke access at any time.
                </div>
              )}

              <button
                onClick={handleGrant}
                disabled={!selected}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-navy-900 hover:bg-navy-800 text-white transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Lock size={15} />
                Encrypt Key Envelope & Share
              </button>
            </>
          )}

          {phase === 'encrypting' && (
            <div className="flex flex-col items-center py-10 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full border-4 border-navy-100 border-t-navy-700 animate-spin-slow mb-5" />
              <h3 className="text-base font-bold text-navy-900 mb-2">Encapsulating Key...</h3>
              <div className="space-y-2 w-full max-w-xs">
                {[
                  'Recovering AES-256 session key from vault...',
                  'Wrapping with advisor RSA-2048 public key...',
                  'Storing grant envelope securely...',
                ].map((msg, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-500 justify-center">
                    <Loader size={13} className="text-teal-500 animate-spin flex-shrink-0" />
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase === 'success' && (
            <div className="flex flex-col items-center py-10 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
                <ShieldCheck size={32} className="text-teal-600" />
              </div>
              <h3 className="text-base font-bold text-navy-900 mb-1">Access Granted</h3>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                AES-256 session key encapsulated with{' '}
                <span className="font-semibold text-navy-800">{selected?.name}'s</span> RSA-2048 public key.
                They can now view and decrypt this document.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
