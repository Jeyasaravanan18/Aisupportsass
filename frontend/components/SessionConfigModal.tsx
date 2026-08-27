'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, FileText, ChevronRight, Upload, CheckCircle2, AlertCircle, FileSearch } from 'lucide-react';
import axios from 'axios';
import type { SessionConfig, SessionCreateResponse, InteractionMode } from '@/types';

interface Props {
  onSessionCreated: (sessionId: string, config: SessionConfig) => void;
}

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

const SAMPLE_SCENARIOS = [
  { label: 'Billing Dispute',       scenario: 'Customer was charged twice for the same subscription and is demanding an immediate refund.' },
  { label: 'Password Reset',        scenario: 'Customer cannot reset their password and has been locked out of their account for 2 days.' },
  { label: 'App Not Loading',       scenario: "Customer's app keeps crashing on startup since the last update and they have an urgent project deadline." },
  { label: 'Cancellation Request',  scenario: 'Customer wants to cancel their annual subscription and demands a pro-rated refund.' },
  { label: 'Feature Not Working',   scenario: 'Customer paid for the Pro plan but the export feature is not available in their dashboard.' },
];

const MODES = [
  { key: 'simulator', icon: Bot,      label: 'Simulator Mode', desc: 'AI generates realistic customer messages automatically based on your scenario.' },
  { key: 'manual',    icon: User,     label: 'Manual Mode',    desc: 'You paste incoming customer messages turn by turn for real-time coaching.' },
  { key: 'replay',    icon: FileText, label: 'Replay Mode',    desc: 'Upload or paste a past support transcript to replay and analyze message by message.' },
] as const;

export default function SessionConfigModal({ onSessionCreated }: Props) {
  const [mode, setMode]           = useState<InteractionMode>('simulator');
  const [agentName, setAgentName] = useState('');
  const [productContext, setProductContext] = useState('');
  const [scenario, setScenario]   = useState('');
  const [frustration, setFrustration] = useState(3);
  const [verbosity, setVerbosity] = useState<'brief'|'moderate'|'detailed'>('moderate');
  const [replayTranscript, setReplayTranscript] = useState('');
  const [replayFileName, setReplayFileName] = useState('');
  const [kbFile, setKbFile] = useState<File | null>(null);
  const [kbStatus, setKbStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [kbMessage, setKbMessage] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [step, setStep]           = useState(1);

  const parseReplayTranscript = (raw: string) => {
    const lines = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const parsed = lines.map((line, index) => {
      const match = line.match(/^(customer|agent)\s*:\s*(.+)$/i);
      return {
        index: index + 1,
        valid: Boolean(match),
        role: match?.[1].toLowerCase() ?? 'unknown',
        content: match?.[2] ?? line,
      };
    });

    const customerMessages = parsed.filter(item => item.valid && item.role === 'customer');
    const invalidLines = parsed.filter(item => !item.valid);
    return { parsed, customerMessages, invalidLines };
  };

  const handleCreate = async () => {
    if (step === 2 && !scenario.trim()) { setError('Please describe the customer scenario.'); return; }
    if (mode === 'replay' && !replayTranscript.trim()) { setError('Please paste a transcript.'); return; }
    setLoading(true); setError('');
    try {
      const payload: SessionConfig = {
        mode, agent_name: agentName || 'Agent', product_context: productContext,
        customer_scenario: scenario, persona_frustration: frustration,
        persona_verbosity: verbosity,
        replay_transcript: mode === 'replay' ? replayTranscript : undefined,
      };
      const { data } = await axios.post<SessionCreateResponse>(`${API}/sessions/create`, payload);
      onSessionCreated(data.session_id, payload);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create session. Is the backend running?');
    } finally { setLoading(false); }
  };

  const STEPS = ['Mode & Identity', 'Scenario Setup', 'Knowledge Base'];

  const inputStyle = {
    background: '#1a1d27',
    color: '#ffffff',
    border: '1px solid #374151',
  };

  const replayParsed = mode === 'replay' ? parseReplayTranscript(replayTranscript) : null;

  const handleKbUpload = async () => {
    if (!kbFile) {
      setKbStatus('error');
      setKbMessage('Choose a PDF or TXT file first.');
      return;
    }

    const form = new FormData();
    form.append('file', kbFile);

    setKbStatus('uploading');
    setKbMessage('');
    try {
      const { data } = await axios.post(`${API}/kb/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setKbStatus('done');
      setKbMessage(`Indexed ${data.chunks_indexed} chunks from ${data.filename}.`);
    } catch (err: any) {
      setKbStatus('error');
      setKbMessage(err.response?.data?.detail || 'KB upload failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--bg-modal-overlay, rgba(0,0,0,0.6))' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-modal, #1e212b)' }}
      >
        <div className="p-8 pb-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--modal-accent, #00c4b5)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Support Coach</h1>
              <p className="text-sm text-gray-400">Configure your coaching session</p>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-3 mb-8" style={{ borderBottom: '1px solid #374151', paddingBottom: '20px' }}>
            {STEPS.map((label, i) => {
              const s = i + 1;
              const isPast = step > s;
              const isActive = step === s;
              
              let circleStyle = {};
              if (isPast || (isActive && step > 1)) {
                circleStyle = { background: 'var(--modal-accent, #00c4b5)', color: '#fff', border: 'none' };
              } else if (isActive) {
                circleStyle = { background: 'transparent', color: '#fff', border: '2px solid #fff' };
              } else {
                circleStyle = { background: 'transparent', color: '#6b7280', border: '2px solid #374151' };
              }

              return (
                <div key={s} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={circleStyle}>
                      {s}
                    </div>
                    {isActive && <span className="text-sm text-gray-300 ml-1">{label}</span>}
                  </div>
                  {s < 3 && (
                    <div className="w-12 h-px" style={{ background: isPast ? 'var(--modal-accent, #00c4b5)' : '#374151' }} />
                  )}
                </div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1 */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white mb-2">Your Name (Agent)</label>
                  <input type="text" value={agentName} onChange={e => setAgentName(e.target.value)}
                    className="c-input focus:outline-none" style={inputStyle} />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white mb-2">Interaction Mode</label>
                  <div className="grid grid-cols-3 gap-4">
                    {MODES.map(({ key, icon: Icon, label, desc }) => {
                      const active = mode === key;
                      return (
                         <button key={key} onClick={() => setMode(key)}
                          className="relative p-4 rounded-xl text-left transition-all"
                          style={active 
                            ? { background: 'rgba(0,196,181,0.05)', border: '1px solid var(--modal-accent, #00c4b5)' }
                            : { background: '#1a1d27', border: '1px solid #374151' }}>
                          {active && <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--modal-accent, #00c4b5)' }} />}
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                            style={{ background: active ? 'var(--modal-accent, #00c4b5)' : '#374151' }}>
                            <Icon className="w-4 h-4" style={{ color: active ? '#fff' : '#9ca3af' }} />
                          </div>
                          <div className="text-sm font-bold mb-1" style={{ color: active ? '#fff' : '#e5e7eb' }}>{label}</div>
                          <div className="text-xs leading-relaxed" style={{ color: active ? '#9ca3af' : '#9ca3af' }}>{desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Product / Service Context</label>
                  <input type="text" value={productContext} onChange={e => setProductContext(e.target.value)}
                    placeholder="SaaS project management platform" className="c-input focus:outline-none" style={inputStyle} />
                </div>
              </motion.div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white mb-2">Customer Scenario</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {SAMPLE_SCENARIOS.map(s => (
                      <button key={s.label} onClick={() => setScenario(s.scenario)}
                        className="px-3 py-1.5 text-xs rounded-full border transition-colors"
                        style={{ borderColor: '#374151', color: '#d1d5db', background: 'transparent' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--modal-accent, #00c4b5)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = '#d1d5db'; }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <textarea value={scenario} onChange={e => setScenario(e.target.value)}
                    rows={3} placeholder="Describe the customer's problem and situation..."
                    className="c-input resize-none focus:outline-none" style={inputStyle} />
                </div>

                {mode === 'simulator' && (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-white mb-3">
                        Customer Frustration Level: <span style={{ color: 'var(--modal-accent, #00c4b5)' }}>{frustration}/5</span>
                      </label>
                      <div className="relative mb-6">
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 absolute -left-1 -bottom-6">Calm</span>
                          <input type="range" min={1} max={5} value={frustration}
                            onChange={e => setFrustration(Number(e.target.value))}
                            className="range-slider" 
                            style={{ background: `linear-gradient(90deg, var(--modal-accent, #00c4b5) ${(frustration-1)*25}%, #374151 ${(frustration-1)*25}%)` }}
                          />
                          <span className="text-xs text-gray-500 absolute -right-2 -bottom-6">Furious</span>
                        </div>
                        {/* Dots */}
                        <div className="absolute top-2 left-0 right-0 flex justify-between px-1 pointer-events-none">
                          {[1,2,3,4,5].map(n => (
                            <div key={n} className="w-1 h-1 rounded-full" style={{ background: n <= frustration ? 'var(--modal-accent, #00c4b5)' : '#4b5563' }} />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Message Verbosity</label>
                      <div className="flex gap-3">
                        {(['brief','moderate','detailed'] as const).map(v => (
                          <button key={v} onClick={() => setVerbosity(v)}
                            className="flex-1 py-2.5 rounded-lg text-sm capitalize transition-all font-semibold"
                            style={verbosity === v
                              ? { background: 'var(--modal-accent, #00c4b5)', color: '#fff', border: '1px solid transparent' }
                              : { background: '#1a1d27', color: '#d1d5db', border: '1px solid #374151' }}>
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {mode === 'replay' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Support Transcript</label>
                      <div className="mb-3 flex items-center gap-3">
                        <label
                          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#374151] bg-[#1a1d27] px-3 py-2 text-xs font-semibold text-gray-200 hover:border-[var(--modal-accent,#00c4b5)]"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Transcript
                          <input
                            type="file"
                            accept=".txt"
                            className="hidden"
                            onChange={async e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const text = await file.text();
                              setReplayTranscript(text);
                              setReplayFileName(file.name);
                            }}
                          />
                        </label>
                        {replayFileName && (
                          <span className="text-xs text-teal-300">
                            Loaded {replayFileName}
                          </span>
                        )}
                      </div>
                      <textarea
                        value={replayTranscript}
                        onChange={e => setReplayTranscript(e.target.value)}
                        rows={6}
                        placeholder={"Customer: I cannot log in\nAgent: I can help with that\nCustomer: It still says invalid password"}
                        className="c-input resize-none font-mono text-xs focus:outline-none"
                        style={inputStyle}
                      />
                      <p className="mt-2 text-xs text-gray-400">
                        Use alternating `Customer:` and `Agent:` lines. Only `Customer:` lines are replayed by the simulator.
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#374151] bg-[#151824] p-4">
                      <div className="flex items-center gap-2 mb-3 text-white">
                        <FileSearch className="w-4 h-4" />
                        <span className="text-sm font-semibold">Parsed Preview</span>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {(replayParsed?.parsed ?? []).length === 0 ? (
                          <p className="text-xs text-gray-500">Paste a transcript to preview parsed turns.</p>
                        ) : (
                          replayParsed?.parsed.map(line => (
                            <div key={line.index} className="text-xs rounded-lg px-3 py-2" style={{ background: line.valid ? '#1a1d27' : '#2a1f1f', color: '#d1d5db' }}>
                              <span className="font-semibold text-gray-300">Line {line.index}:</span>{' '}
                              {line.valid ? `${line.role.toUpperCase()} → ${line.content}` : `Unrecognized format: ${line.content}`}
                            </div>
                          ))
                        )}
                      </div>
                      {replayParsed && (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                            Customer turns: {replayParsed.customerMessages.length}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-slate-500/10 text-slate-300 border border-slate-500/20">
                            Invalid lines: {replayParsed.invalidLines.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                 <p className="text-sm font-medium text-gray-300 mb-4 leading-relaxed">
                  The system includes a built-in knowledge base. Upload custom PDFs or TXT files to make the RAG panel session-specific.
                </p>

                <div className="border-2 border-dashed border-[#374151] rounded-xl p-5 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a1d27] flex items-center justify-center">
                      <Upload className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Upload support docs</p>
                      <p className="text-xs text-gray-400">PDF or TXT. Indexed into the session knowledge base.</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={e => {
                        const file = e.target.files?.[0] ?? null;
                        setKbFile(file);
                        setKbStatus('idle');
                        setKbMessage(file ? `${file.name} selected.` : '');
                      }}
                      className="flex-1 text-xs text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--modal-accent,#00c4b5)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleKbUpload}
                      disabled={kbStatus === 'uploading'}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: 'var(--modal-accent, #00c4b5)', opacity: kbStatus === 'uploading' ? 0.7 : 1 }}
                    >
                      {kbStatus === 'uploading' ? 'Uploading...' : 'Index File'}
                    </button>
                  </div>
                  {kbMessage && (
                    <div className={`mt-3 text-xs flex items-center gap-2 ${kbStatus === 'error' ? 'text-red-300' : kbStatus === 'done' ? 'text-teal-300' : 'text-gray-300'}`}>
                      {kbStatus === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>{kbMessage}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-xl p-4" style={{ background: 'rgba(0,196,181,0.05)', border: '1px solid var(--modal-accent, #00c4b5)' }}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--modal-accent, #00c4b5)' }}>📚 Default Knowledge Base Includes:</h3>
                  <ul className="space-y-1 text-xs" style={{ color: '#d1d5db' }}>
                    <li>• Password reset and account access FAQs</li>
                    <li>• Billing, subscription, and refund policies</li>
                    <li>• Technical troubleshooting guides and escalation paths</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-8 mb-4 px-4 py-2 rounded-md text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-5 flex items-center justify-between" style={{ borderTop: '1px solid #374151' }}>
          <button onClick={() => setStep(Math.max(1, step - 1))}
            className="text-sm transition-colors"
            style={{ color: step > 1 ? '#9ca3af' : 'transparent', pointerEvents: step > 1 ? 'auto' : 'none' }}>
            Back
          </button>
          
          {step < 3 ? (
            <button onClick={() => {
              if (step === 1 && !agentName.trim()) { setError('Please enter your name.'); return; }
              setError(''); setStep(step + 1);
            }} style={{ background: 'var(--modal-accent, #00c4b5)', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }} className="flex items-center gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleCreate} disabled={loading} style={{ background: 'var(--modal-accent, #00c4b5)', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }} className="flex items-center gap-2">
              {loading ? 'Starting...' : 'Start Session'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
