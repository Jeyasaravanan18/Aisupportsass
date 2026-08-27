'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Clock, AlertTriangle, Plus } from 'lucide-react';

import Sidebar from '@/components/Sidebar';
import SessionConfigModal from '@/components/SessionConfigModal';
import ConversationPanel from '@/components/ConversationPanel';
import CoachingPanel from '@/components/CoachingPanel';
import KnowledgePanel from '@/components/KnowledgePanel';
import EscalationAlert from '@/components/EscalationAlert';
import AgentInput from '@/components/AgentInput';

import type { SessionConfig, TurnResult, ConversationMessage, KnowledgeArticle } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function SessionPage() {
  const router = useRouter();

  const [showConfig, setShowConfig]       = useState(true);
  const [sessionId, setSessionId]         = useState<string | null>(null);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);

  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState('');
  const [turnResult, setTurnResult]     = useState<TurnResult | null>(null);
  const [history, setHistory]           = useState<ConversationMessage[]>([]);
  const [articles, setArticles]         = useState<KnowledgeArticle[]>([]);
  const [showEscalation, setShowEscalation] = useState(false);
  const [hasMoreReplay, setHasMoreReplay]   = useState(true);

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sessionId && !showConfig) {
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionId, showConfig]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const sentimentLabel = turnResult?.intent_sentiment.sentiment_label ?? null;
  const downloadText = (filename: string, content: string, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportTranscript = () => {
    const lines = history.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`);
    const summary = turnResult
      ? [
          '',
          `Sentiment: ${turnResult.intent_sentiment.sentiment_label} (${turnResult.intent_sentiment.sentiment_score.toFixed(2)})`,
          `Escalation risk: ${turnResult.escalation.risk_score}/100`,
          `Suggested response: ${turnResult.coaching.suggested_response}`,
        ]
      : [];
    downloadText(
      `session-${sessionId ?? 'draft'}-transcript.txt`,
      [...lines, ...summary].join('\n'),
    );
  };

  const getSentimentBadge = () => {
    if (!sentimentLabel) return <span className="badge badge-blue">● Positive</span>; // default for visual testing
    if (sentimentLabel === 'positive' || sentimentLabel === 'very_positive')
      return <span className="badge badge-blue">● Positive</span>;
    if (sentimentLabel === 'negative' || sentimentLabel === 'very_negative')
      return <span className="badge badge-red">● Negative</span>;
    return <span className="badge badge-green">● Neutral</span>;
  };

  const handleSessionCreated = (sid: string, config: SessionConfig) => {
    setSessionId(sid); setSessionConfig(config); setShowConfig(false);
    setHistory([]); setTurnResult(null); setArticles([]); setElapsed(0); setHasMoreReplay(true); setError('');
  };

  const processTurn = useCallback(async (customerMessage?: string) => {
    if (!sessionId || isLoading) return;
    setIsLoading(true); setError('');
    try {
      const payload: Record<string, any> = { session_id: sessionId };
      if (customerMessage) payload.agent_message = customerMessage;
      const { data } = await axios.post<TurnResult>(`${API}/turn`, payload);
      setTurnResult(data);
      setHistory(data.conversation_history);
      setArticles(data.knowledge_articles);
      if (sessionConfig?.mode === 'replay') {
        const info = await axios.get(`${API}/sessions/${sessionId}`);
        setHasMoreReplay(info.data.replay_index < info.data.replay_messages_total);
      }
      if (data.escalation.should_alert) setShowEscalation(true);
    } catch (err: any) {
      const msg = err.response?.data?.detail;
      if (msg?.includes('exhausted')) {
        setHasMoreReplay(false);
        setError('Replay transcript exhausted. View the post-session report.');
      } else {
        setError(msg || 'Failed to process turn. Check backend connection.');
      }
    } finally { setIsLoading(false); }
  }, [sessionId, isLoading, sessionConfig]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#ffffff' }}>
      {showConfig && <SessionConfigModal onSessionCreated={handleSessionCreated} />}
      <Sidebar agentName={sessionConfig?.agent_name || 'Agent Avatar'} onNewSession={() => setShowConfig(true)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-4 px-6 flex-shrink-0"
          style={{ height: 60, background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
          <h1 className="font-bold text-lg text-gray-900 tracking-tight">Live Intelligence</h1>
          <div className="flex-1" />
          <button
            onClick={() => setShowConfig(true)}
            className="px-3 py-1.5 rounded border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
          {sessionId && turnResult && (
            <button
              onClick={() => router.push(`/report/${sessionId}`)}
              className="px-3 py-1.5 rounded border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View Report
            </button>
          )}
          <button onClick={handleExportTranscript} className="px-3 py-1.5 rounded border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Export Transcript
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
             <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
          </div>
        </header>

        {/* Status Bar */}
        <div className="flex items-center px-6 py-2 flex-shrink-0" style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-sm font-medium text-gray-600">Active Session</span>
          </div>
          <span className="mx-4 text-gray-300">|</span>
          <span className="text-sm text-gray-500">Customer ID: #{sessionId ? sessionId.slice(-4).toUpperCase() : '8821'}</span>
          <div className="flex-1" />
          {getSentimentBadge()}
          <div className="flex items-center gap-1.5 ml-4 text-sm font-medium text-gray-700">
            <Clock className="w-4 h-4 text-gray-400" />
            {formatTime(elapsed)}
          </div>
        </div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-6 py-2 text-sm flex-shrink-0 bg-red-50 text-red-700 border-b border-red-200">
              <AlertTriangle className="w-4 h-4" />
              {error}
              <button onClick={() => setError('')} className="ml-auto text-xs hover:underline">Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Transcript Area */}
          <div className="flex flex-col flex-1 min-w-0" style={{ borderRight: '1px solid #e5e7eb' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Live Transcript</h2>
              <button
                onClick={handleExportTranscript}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1"
              >
                ↓ Export
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConversationPanel history={history} isLoading={isLoading} mode={sessionConfig?.mode || 'simulator'} />
            </div>
            <AgentInput mode={sessionConfig?.mode || 'simulator'} isLoading={isLoading} onNextTurn={processTurn} hasMoreReplay={hasMoreReplay} />
          </div>

          {/* AI Co-Pilot Area */}
          <div className="w-[380px] flex flex-col flex-shrink-0 bg-gray-50 overflow-hidden">
            <div className="flex-1 min-h-0 border-b border-gray-200">
              <CoachingPanel turnResult={turnResult} isLoading={isLoading} articles={articles} />
            </div>
            <div className="flex-1 min-h-0">
              <KnowledgePanel articles={articles} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </div>

      {showEscalation && turnResult && (
        <EscalationAlert
          riskScore={turnResult.escalation.risk_score}
          reasoning={turnResult.escalation.reasoning}
          strategy={turnResult.escalation.strategy}
          onDismiss={() => setShowEscalation(false)}
        />
      )}
    </div>
  );
}
