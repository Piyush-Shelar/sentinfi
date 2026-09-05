import React from 'react';
import { Shield, TrendingUp, ChevronRight, Lightbulb, CheckCircle } from 'lucide-react';
import ClientNavbar from '../../components/ClientNavbar';
import ScoreGauge from '../../components/ScoreGauge';
import { loggedInClient, mockScoreFactors } from '../../data/mockData';

function getBarColor(score) {
  if (score >= 71) return 'bg-teal-500';
  if (score >= 40) return 'bg-gold-400';
  return 'bg-amber-500';
}

function getTextColor(score) {
  if (score >= 71) return 'text-teal-600';
  if (score >= 40) return 'text-gold-500';
  return 'text-amber-600';
}

function FactorBar({ factor, index }) {
  const barColor = getBarColor(factor.score);
  const textColor = getTextColor(factor.score);

  return (
    <div
      className="bg-white rounded-2xl border border-border shadow-card p-5 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.08}s`, opacity: 0 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-navy-900 text-sm">{factor.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{factor.description}</p>
        </div>
        <span className={`text-lg font-bold ${textColor} ml-4 flex-shrink-0`}>
          {factor.score}
        </span>
      </div>

      {/* Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Score</span>
          <span className="text-xs text-gray-400">{factor.score}/{factor.maxScore}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
            style={{ width: `${factor.score}%` }}
          />
        </div>
      </div>

      {/* Suggestion */}
      {factor.suggestion && (
        <div className="flex items-start gap-2 p-3 bg-gold-50 border border-gold-100 rounded-xl">
          <Lightbulb size={14} className="text-gold-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-700 leading-relaxed">{factor.suggestion}</p>
        </div>
      )}

      {!factor.suggestion && (
        <div className="flex items-center gap-1.5 text-xs text-teal-600">
          <CheckCircle size={13} />
          <span>This area looks great — no action needed.</span>
        </div>
      )}
    </div>
  );
}

export default function SecurityScore() {
  const overallScore = loggedInClient.securityScore;

  const improvements = mockScoreFactors.filter(f => f.suggestion);

  return (
    <div className="min-h-screen bg-surface">
      <ClientNavbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-navy-900">Security Score</h1>
          <p className="text-gray-500 text-sm mt-1">A comprehensive breakdown of your vault's security health</p>
        </div>

        {/* Top card: overview */}
        <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 mb-6 text-white shadow-lg animate-fade-in-up stagger-1">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Gauge */}
            <div className="flex-shrink-0">
              <ScoreGauge score={overallScore} size={180} />
            </div>
            {/* Text */}
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 rounded-full px-3 py-1 mb-3">
                <TrendingUp size={14} className="text-teal-400" />
                <span className="text-sm font-medium text-teal-300">+4 points this month</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Overall Security Health</h2>
              <p className="text-navy-100/70 text-sm leading-relaxed">
                Your security score is calculated across 5 factors. Each factor contributes 20 points 
                to your maximum score of 100. Improving weak areas can significantly raise your overall score.
              </p>

              {/* Radar summary */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mockScoreFactors.map(f => (
                  <div key={f.name} className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <div className="text-xs text-navy-100/50 mb-1 truncate">{f.name}</div>
                    <div className={`text-base font-bold ${
                      f.score >= 71 ? 'text-teal-400' : f.score >= 40 ? 'text-gold-400' : 'text-amber-400'
                    }`}>
                      {f.score}
                      <span className="text-xs text-white/30 font-normal">/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Improvement panel */}
        {improvements.length > 0 && (
          <div className="bg-gold-50 border border-gold-100 rounded-2xl p-5 mb-6 animate-fade-in-up stagger-2">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={18} className="text-gold-500" />
              <h3 className="font-bold text-navy-900">Improve Your Score</h3>
            </div>
            <div className="space-y-2">
              {improvements.map(f => (
                <div key={f.name} className="flex items-start gap-3">
                  <ChevronRight size={14} className="text-gold-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-navy-800">{f.name}: </span>
                    <span className="text-sm text-gray-600">{f.suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Factor breakdown */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Factor Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockScoreFactors.map((factor, idx) => (
              <FactorBar key={factor.name} factor={factor} index={idx} />
            ))}
          </div>
        </div>

        {/* Security tips */}
        <div className="mt-6 bg-white rounded-2xl border border-border shadow-card p-6 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-navy-700" />
            <h3 className="font-bold text-navy-900">Security Best Practices</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Enable 2FA', desc: 'Two-factor authentication adds a second layer of identity verification.' },
              { title: 'Rotate Password', desc: 'Change your password every 6 months using a password manager.' },
              { title: 'Review Access Logs', desc: 'Check who viewed your documents regularly for any unauthorized access.' },
            ].map(tip => (
              <div key={tip.title} className="bg-surface rounded-xl p-4 border border-border">
                <h4 className="text-sm font-semibold text-navy-900 mb-1">{tip.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
