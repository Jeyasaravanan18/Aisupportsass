'use client';

import { motion } from 'framer-motion';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Clock, CheckCircle, MessageSquare, BookOpen, Download, MessageCircle, Sparkles } from 'lucide-react';
import type { PerformanceReport, SentimentLabel } from '@/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Props {
  report: PerformanceReport;
  onNewSession: () => void;
}

const sentimentToNum: Record<SentimentLabel, number> = {
  very_negative: 1, negative: 2, neutral: 3, positive: 4, very_positive: 5,
};

function MetricCard({ icon: Icon, label, value, sub, subColor = '#16a34a' }: any) {
  return (
    <div className="bg-white p-5 border border-gray-200 rounded-sm shadow-sm flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-gray-500 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs font-medium mt-1" style={{ color: subColor }}>{sub}</div>}
    </div>
  );
}

export default function ReportView({ report, onNewSession }: Props) {
  const sentimentData = report.sentiment_journey.map(p => sentimentToNum[p.sentiment_label]);
  const labels        = report.sentiment_journey.map((_, i) => `Turn ${i + 1}`);
  const durationMin   = report.duration_seconds ? Math.floor(report.duration_seconds / 60) : 0;
  const durationSec   = report.duration_seconds ? report.duration_seconds % 60 : 0;
  const durationStr   = `${String(durationMin).padStart(2,'0')}:${String(durationSec).padStart(2,'0')}`;

  const breakdown = report.resolution_quality_breakdown as any;
  const empathy   = breakdown?.empathy_and_tone ?? 0;
  const resolution= breakdown?.issue_resolution  ?? 0;
  const clarity   = breakdown?.response_clarity  ?? 0;
  const efficiency= breakdown?.efficiency        ?? 0;

  const toneConsistency = Math.round(((empathy + clarity) / 50) * 100);
  const knowledgeAccuracy = Math.round(((resolution + efficiency) / 50) * 100);
  const isResolved = report.resolution_quality_score >= 70;
  const exportReport = () => {
    const payload = {
      ...report,
      generated_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${report.session_id}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = {
    labels,
    datasets: [{
      label: 'Sentiment',
      data: sentimentData,
      borderColor: '#38bdf8', // light blue
      backgroundColor: 'rgba(56,189,248,0.15)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: (ctx: any) => {
        // Red dot for negative points (<=2)
        return ctx.raw <= 2 ? 6 : 0;
      },
      pointBackgroundColor: (ctx: any) => ctx.raw <= 2 ? '#ef4444' : '#38bdf8',
      pointBorderColor: (ctx: any) => ctx.raw <= 2 ? '#ef4444' : '#38bdf8',
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      y: { min: 1, max: 5, display: false },
      x: { 
        ticks: { color: '#9ca3af', font: { size: 11 }, callback: (v: any) => v === 0 ? '0:00' : `${v}:00` },
        grid: { display: false } 
      },
    },
    layout: { padding: { top: 10, bottom: 10 } }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: '#f8f9fa' }}>
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-blue-50 text-blue-800 border border-blue-100 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Session Completed
          </span>
          <span className="text-xs font-medium text-gray-500">
            ID: #{report.agent_name?.replace(' ','') || '8821'} &nbsp;&middot;&nbsp; {new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
          </span>
        </div>
        <div className="flex items-end justify-between">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Session Analytics</h1>
          <div className="flex items-center gap-3">
            <button onClick={exportReport} className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Download className="w-4 h-4" /> Export Report
            </button>
            <button onClick={onNewSession} className="flex items-center gap-2 px-4 py-2 bg-black rounded text-sm font-semibold text-white hover:bg-gray-900">
              Review Transcript
            </button>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard icon={Clock} label="Duration" value={durationStr} sub="↓ 15% vs avg" />
        <MetricCard icon={CheckCircle} label="Resolution" value={isResolved ? 'Resolved' : 'Unresolved'} sub="First Contact" subColor="#6b7280" />
        <MetricCard icon={MessageSquare} label="Tone Consistency" value={`${toneConsistency}%`} sub="↑ 4% vs avg" />
        <MetricCard icon={BookOpen} label="Knowledge Accuracy" value={`${knowledgeAccuracy}%`} sub="AI Verified" subColor="#3b82f6" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        
        {/* Left Column (2/3) */}
        <div className="col-span-2 flex flex-col gap-6">
          
          {/* Chart */}
          <div className="bg-white p-6 border border-gray-200 rounded-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Customer Sentiment Timeline</h2>
              <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Positive</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Neutral</span>
              </div>
            </div>
            <div style={{ height: 220 }}>
              <Line data={chartData} options={chartOptions as any} />
            </div>
          </div>

          {/* Annotated Transcript */}
          <div className="bg-white p-6 border border-gray-200 rounded-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-gray-700" /> Annotated Transcript
            </h2>
            <div className="flex flex-col gap-5">
              {report.sentiment_journey.slice(0, 3).map((point, i) => {
                const isCustomer = i % 2 === 0;
                return (
                  <div key={i}>
                    <div className={`flex gap-3 ${isCustomer ? '' : 'flex-row-reverse'}`}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-blue-100 text-blue-700 mt-1">
                        {isCustomer ? 'C' : 'A'}
                      </div>
                      <div className={`rounded-xl px-4 py-3 max-w-[85%] text-sm leading-relaxed ${isCustomer ? 'bubble-customer' : 'bubble-agent'}`}>
                        {point.customer_message_preview}
                        <div className="mt-2 text-xs opacity-60">
                          {String(Math.floor(i * 28 / 60)).padStart(2,'0')}:{String((i * 28) % 60).padStart(2,'0')}
                        </div>
                      </div>
                    </div>
                    {!isCustomer && (
                      <div className="flex items-center gap-1.5 mt-2 ml-11">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <span className="text-xs font-medium text-teal-700">
                          CoachAI: {point.sentiment_label === 'negative' ? 'High frustration detected.' : 'Empathy suggested.'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            <div className="bg-sky-50 px-5 py-4 border-b border-sky-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-500" />
              <h2 className="text-lg font-bold text-gray-900">Session Summary</h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700 leading-relaxed mb-6">
                {report.summary}
              </p>
              
              <h3 className="text-xs font-bold text-gray-600 mb-3">Strengths</h3>
              <ul className="space-y-2 mb-6">
                {report.coaching_recommendations.length > 0 ? (
                  report.coaching_recommendations.slice(0, 2).map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 font-bold">✓</span> {r}
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-2 text-sm text-gray-700"><span className="text-green-500 font-bold">✓</span> Rapid response time.</li>
                    <li className="flex items-start gap-2 text-sm text-gray-700"><span className="text-green-500 font-bold">✓</span> Excellent tone management.</li>
                  </>
                )}
              </ul>

              <h3 className="text-xs font-bold text-gray-600 mb-3">Areas for Improvement</h3>
              <ul className="space-y-2">
                {report.top_knowledge_gaps.length > 0 ? (
                  report.top_knowledge_gaps.slice(0, 1).map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-red-500 font-bold">→</span> {g}
                    </li>
                  ))
                ) : (
                  <li className="flex items-start gap-2 text-sm text-gray-700"><span className="text-red-500 font-bold">→</span> Could offer alternative login method (SMS) earlier.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Response Accuracy</h2>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard icon={Sparkles} label="Empathy" value={`${breakdown?.empathy_and_tone ?? 0}/25`} />
              <MetricCard icon={MessageSquare} label="Resolution" value={`${breakdown?.issue_resolution ?? 0}/25`} />
              <MetricCard icon={MessageCircle} label="Clarity" value={`${breakdown?.response_clarity ?? 0}/25`} />
              <MetricCard icon={Clock} label="Efficiency" value={`${breakdown?.efficiency ?? 0}/25`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
