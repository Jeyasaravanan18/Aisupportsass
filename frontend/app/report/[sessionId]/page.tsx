'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2, AlertCircle, ArrowLeft, Plus } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ReportView from '@/components/ReportView';
import type { PerformanceReport } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router        = useRouter();
  const [report, setReport]   = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!sessionId) return;
    axios.get<PerformanceReport>(`${API}/report/${sessionId}`)
      .then(({ data }) => setReport(data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to generate report.'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#ffffff' }}>
      <Sidebar agentName={report?.agent_name || 'Agent Avatar'} onNewSession={() => router.push('/session')} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-4 px-6 flex-shrink-0"
          style={{ height: 60, background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
          <h1 className="font-bold text-lg text-gray-900 tracking-tight">Session Report</h1>
          <div className="flex-1" />
          <button
            onClick={() => router.push('/session')}
            className="px-3 py-1.5 rounded border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Session
          </button>
          <button
            onClick={() => router.push('/session')}
            className="px-3 py-1.5 rounded border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
             <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
          </div>
        </header>

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-gray-800 font-semibold mb-1">Generating Performance Report…</p>
              <p className="text-gray-400 text-sm">AI is analyzing your full session. This may take a moment.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-semibold mb-1">Report Generation Failed</p>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
            <button onClick={() => router.push('/session')}
              className="px-4 py-2 rounded text-sm font-semibold" style={{ background: '#111827', color: '#fff' }}>
              Back to Session
            </button>
          </div>
        )}

        {!loading && !error && report && (
          <ReportView report={report} onNewSession={() => router.push('/session')} />
        )}
      </div>
    </div>
  );
}
