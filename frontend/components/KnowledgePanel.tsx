'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { KnowledgeArticle } from '@/types';

interface Props {
  articles: KnowledgeArticle[];
  isLoading: boolean;
}

function RelevanceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#6b7280';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{pct}%</span>
    </div>
  );
}

function ArticleCard({ article, index }: { article: KnowledgeArticle; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      <button
        className="w-full text-left p-4 transition-colors hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ color: '#0f766e', background: 'rgba(20,184,166,0.12)' }}>
                #{index + 1}
              </span>
              <RelevanceBadge score={article.relevance_score} />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
              {article.title}
            </h4>
          </div>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          }
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
            <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid #e5e7eb' }}>
              <p className="text-xs text-gray-500 leading-relaxed">
                {article.excerpt}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function KnowledgePanel({ articles, isLoading }: Props) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-sm font-semibold text-gray-900">Knowledge Base</span>
        {articles.length > 0 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-normal normal-case tracking-normal" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            {articles.length} results
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {isLoading && (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-20 rounded-xl" style={{ background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 37%,#f3f4f6 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        )}

        {!isLoading && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">Relevant articles will appear here</p>
            <p className="text-gray-400 text-xs mt-1">after the first customer message</p>
          </div>
        )}

        {!isLoading && articles.map((article, i) => (
          <ArticleCard key={article.article_id} article={article} index={i} />
        ))}
      </div>
    </div>
  );
}
