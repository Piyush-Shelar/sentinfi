import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function TamperAlertModal({ errorPayload, onClose }) {
  if (!errorPayload) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in border-t-8 border-red-600">
        
        <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <AlertTriangle size={24} className="flex-shrink-0" />
            <h2 className="text-xl font-bold tracking-wide">CRITICAL ALERT: CRYPTOGRAPHIC TAMPER DETECTED</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-red-700 rounded-lg transition-colors text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-800 font-medium leading-relaxed">
              The vault cryptographic integrity check has failed. The document envelope key cannot be verified against this advisor identity, indicating unauthorized tampering or file corruption.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Baseline Digest (Stored at Ingestion)</p>
              <div className="bg-green-50 border-2 border-green-400 rounded-lg p-3">
                <p className="font-mono text-sm text-green-800 break-all">{errorPayload.storedHash}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Computed Digest (Runtime Attempt)</p>
              <div className="bg-red-50 border-2 border-red-400 rounded-lg p-3">
                <p className="font-mono text-sm text-red-800 break-all line-through decoration-red-500/50 decoration-2">{errorPayload.computedHash}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
              TAMPER DETECTED — ACCESS TERMINATED
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Security incident logged to immutable audit ledger with severity CRITICAL.
            </span>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-xl text-sm transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
