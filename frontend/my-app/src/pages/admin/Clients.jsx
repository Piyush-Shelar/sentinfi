import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Shield, Settings } from 'lucide-react';
import { AdminSidebar, AdminTopbar } from '../../components/AdminLayout';
import { mockClients } from '../../data/mockData';
import ScoreGauge from '../../components/ScoreGauge';
import { ChevronRight, Search } from 'lucide-react';

export default function AdminClients() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filtered = mockClients
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'score') return b.securityScore - a.securityScore;
      if (sortBy === 'docs') return b.documentCount - a.documentCount;
      return a.name.localeCompare(b.name);
    });

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
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-2xl font-bold text-navy-900">Clients</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and review your client portfolio</p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5 animate-fade-in-up stagger-1">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-sm text-navy-900 placeholder-gray-400 focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 bg-white transition-all"
              />
            </div>
            <div className="flex gap-2">
              {[['name', 'Name'], ['score', 'Score'], ['docs', 'Docs']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setSortBy(val)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    sortBy === val ? 'bg-navy-900 text-white border-navy-900' : 'border-border text-gray-600 bg-white hover:border-navy-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Client cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in-up stagger-2">
            {filtered.map((client, idx) => (
              <Link
                key={client.id}
                to={`/admin/clients/${client.id}`}
                className="bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all duration-200 p-5 group"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {client.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-navy-900 text-sm">{client.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[150px]">{client.email}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-navy-700 transition-colors mt-1" />
                </div>

                {/* Score bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Security Score</span>
                    <span className={`text-sm font-bold ${
                      client.securityScore >= 71 ? 'text-teal-600' :
                      client.securityScore >= 40 ? 'text-gold-500' : 'text-amber-600'
                    }`}>{client.securityScore}/100</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        client.securityScore >= 71 ? 'bg-teal-500' :
                        client.securityScore >= 40 ? 'bg-gold-400' : 'bg-amber-500'
                      }`}
                      style={{ width: `${client.securityScore}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-surface rounded-lg p-2 border border-border">
                    <p className="text-sm font-bold text-navy-900">{client.documentCount}</p>
                    <p className="text-[10px] text-gray-400">Docs</p>
                  </div>
                  <div className="bg-surface rounded-lg p-2 border border-border">
                    <p className={`text-sm font-bold ${client.pendingCount > 0 ? 'text-gold-500' : 'text-teal-600'}`}>{client.pendingCount}</p>
                    <p className="text-[10px] text-gray-400">Pending</p>
                  </div>
                  <div className="bg-surface rounded-lg p-2 border border-border">
                    <p className="text-[10px] text-gray-400 leading-tight mt-1">Since {new Date(client.joinDate).getFullYear()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
