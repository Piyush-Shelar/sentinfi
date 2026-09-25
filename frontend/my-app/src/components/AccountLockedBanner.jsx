import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AccountLockedBanner() {
  const { accountLocked, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (accountLocked) {
      const t = setTimeout(() => {
        logout(false);
        navigate('/login');
      }, 8000);
      return () => clearTimeout(t);
    }
  }, [accountLocked, logout, navigate]);

  if (!accountLocked) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 text-center animate-scale-in border-2 border-amber-500">
        <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-400 flex items-center justify-center mx-auto mb-5">
          <ShieldOff size={36} className="text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-navy-900 mb-2">Account Suspended</h2>
        <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-left">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">Security Violation Detected</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Automated intrusion detection systems have flagged unauthorized activity on your account.
              Access has been suspended as a precautionary measure. Your session tokens have been invalidated.
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          Contact your compliance officer or SentinFi support to appeal this decision.
          You will be redirected to the login page automatically.
        </p>
        <button
          onClick={() => { logout(false); navigate('/login'); }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-xl text-sm transition-all"
        >
          Return to Login <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
