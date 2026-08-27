'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Shield, ArrowRight } from 'lucide-react';

interface Props {
  riskScore: number;
  reasoning: string;
  strategy: string;
  onDismiss: () => void;
}

export default function EscalationAlert({ riskScore, reasoning, strategy, onDismiss }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onDismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl overflow-hidden"
          style={{
            background: '#fff',
            boxShadow: '0 20px 60px rgba(239,68,68,0.2), 0 0 0 1px rgba(239,68,68,0.2)',
          }}
        >
          {/* Header — dark red */}
          <div className="px-5 py-4 flex items-start justify-between"
            style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: '#fee2e2', border: '1px solid #fca5a5' }}>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="esc-ring" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">Escalation Alert</h2>
                <p className="text-xs text-red-600">Immediate action recommended</p>
              </div>
            </div>
            <button id="dismiss-escalation-btn" onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Risk Score */}
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Escalation Risk Score</span>
              <span className="text-2xl font-bold text-red-600">{riskScore}<span className="text-sm text-gray-400">/100</span></span>
            </div>
            <div className="prog-bar">
              <motion.div
                className="prog-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${riskScore}%` }}
                transition={{ duration: 0.8 }}
                style={{ background: `linear-gradient(90deg, #f59e0b ${100 - riskScore}%, #ef4444 100%)` }}
              />
            </div>
          </div>

          {/* Reasoning */}
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Why This Alert Fired</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{reasoning}</p>
          </div>

          {/* Strategy */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recommended Strategy</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#15803d' }}>{strategy}</p>
          </div>

          {/* CTA */}
          <div className="px-5 pb-5">
            <button id="escalation-acknowledge-btn" onClick={onDismiss}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: '#1e293b' }}>
              Acknowledged — Apply Strategy <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
