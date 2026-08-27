'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, AlertTriangle, BookOpen, ExternalLink, Hash } from 'lucide-react';
import type { TurnResult, KnowledgeArticle } from '@/types';

interface Props {
  turnResult: TurnResult | null;
  isLoading: boolean;
  articles: KnowledgeArticle[];
}

// ── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ value, color, size = 100 }: { value: number; color: string; size?: number }) {
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative flex items-center justify-center mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={10} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-2xl font-bold text-gray-900">{value}%</span>
      </div>
    </div>
  );
}

// ── Knowledge article card ─────────────────────────────────────────────────
function KBCard({ article, index }: { article: KnowledgeArticle; index: number }) {
  const tag = article.title.split(' ')[0] || 'Doc';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
      className="p-3 bg-white border border-gray-200 rounded-lg"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-xs font-medium px-1.5 py-0.5 rounded text-blue-600 bg-blue-50">
          {tag}
        </span>
        <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
      </div>
      <h4 className="text-sm font-bold text-gray-800 leading-snug mb-1">{article.title}</h4>
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{article.excerpt}</p>
    </motion.div>
  );
}

export default function CoachingPanel({ turnResult, isLoading, articles }: Props) {
  if (isLoading) {
    return (
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
             <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="font-bold text-gray-900">AI Co-Pilot</span>
        </div>
        <div className="w-full h-32 bg-gray-100 rounded-xl animate-pulse" />
        <div className="w-full h-40 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!turnResult) {
    return (
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
             <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="font-bold text-gray-900">AI Co-Pilot</span>
        </div>
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-800 mb-2">Waiting for the first turn</p>
          <ul className="space-y-2 text-xs text-gray-500 leading-relaxed">
            <li>Intent, sentiment, and frustration score will update after each customer message.</li>
            <li>Suggested replies will include tone feedback and improvement tips.</li>
            <li>Escalation risk and knowledge articles will surface in real time.</li>
          </ul>
        </div>
      </div>
    );
  }

  const { coaching, escalation } = turnResult;
  const toneScore = coaching.tone_score ?? 0;
  const toneScoreDisplay = Math.round((toneScore / 10) * 100);
  const riskScore = escalation.risk_score ?? 0;
  const riskColor = riskScore >= 70 ? '#ef4444' : riskScore >= 40 ? '#f97316' : '#22c55e'; // orange for mid

  return (
    <div className="p-5 flex flex-col gap-5 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <span className="font-bold text-gray-900 text-lg tracking-tight">AI Co-Pilot</span>
      </div>

      {/* Suggested Response */}
      <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #bae6fd' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-blue-600">Suggested Response</span>
          </div>
          <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded text-xs font-semibold text-blue-600 border border-blue-100">
            <Hash className="w-3 h-3" /> Tone: {toneScoreDisplay}
          </div>
        </div>
        <p className="text-sm text-gray-800 leading-relaxed font-medium">
          "{coaching.suggested_response}"
        </p>
      </div>

      {/* Escalation Risk */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center gap-1.5 mb-4">
          <AlertTriangle className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Escalation Risk</span>
        </div>
        <DonutChart value={riskScore} color={riskColor} />
      </div>

      {/* Knowledge Retrieval */}
      {articles.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5 px-1">
            <BookOpen className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Knowledge Retrieval (RAG)</span>
          </div>
          {articles.map((a, i) => <KBCard key={a.article_id} article={a} index={i} />)}
        </div>
      )}
    </div>
  );
}
