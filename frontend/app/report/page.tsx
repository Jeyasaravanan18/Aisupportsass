'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileText, Search } from 'lucide-react';

export default function ReportIndex() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');

  const openReport = () => {
    const trimmed = sessionId.trim();
    if (!trimmed) return;
    router.push(`/report/${trimmed}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)' }}>
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Session Reports</h1>
            <p className="text-sm text-slate-500">Open a completed coaching session by ID.</p>
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-700 mb-2">Session ID</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={sessionId}
              onChange={e => setSessionId(e.target.value)}
              placeholder="Paste a session UUID"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-sky-400"
            />
          </div>
          <button
            onClick={openReport}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
          >
            Open <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
          If you just finished a session, open the report from the session screen after the final turn.
        </div>
      </div>
    </div>
  );
}
