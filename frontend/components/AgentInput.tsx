'use client';

import { useState, KeyboardEvent } from 'react';
import { Send, SkipForward, Loader2, Bold, Link, Smile } from 'lucide-react';

interface Props {
  mode: string;
  isLoading: boolean;
  onNextTurn: (customerMessage?: string) => void;
  hasMoreReplay?: boolean;
}

export default function AgentInput({ mode, isLoading, onNextTurn, hasMoreReplay = true }: Props) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (mode === 'manual') {
      if (!message.trim() || isLoading) return;
      onNextTurn(message.trim());
      setMessage('');
    } else {
      onNextTurn();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (mode === 'simulator' || mode === 'replay') {
    const isDisabled = isLoading || (mode === 'replay' && !hasMoreReplay);
    return (
      <div className="p-3" style={{ borderTop: '1px solid #f3f4f6' }}>
        <button
          id="next-turn-btn"
          onClick={() => onNextTurn()}
          disabled={isDisabled}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all"
          style={isDisabled
            ? { background: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' }
            : { background: '#1e293b', color: '#fff' }}
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
          ) : mode === 'replay' && !hasMoreReplay ? (
            <><SkipForward className="w-4 h-4" /> Transcript Complete</>
          ) : (
            <><SkipForward className="w-4 h-4" /> {mode === 'simulator' ? 'Generate Next Customer Message' : 'Replay Next Message'}</>
          )}
        </button>
      </div>
    );
  }

  // Manual mode — matches CoachAI Pro input bar
  return (
    <div className="p-3" style={{ borderTop: '1px solid #f3f4f6' }}>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
        <textarea
          id="manual-message-input"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Type your response…"
          disabled={isLoading}
          className="w-full px-4 pt-3 pb-1 text-sm resize-none outline-none text-gray-800 placeholder-gray-400 disabled:opacity-50"
          style={{ background: 'transparent', fontFamily: 'inherit' }}
        />
        <div className="flex items-center gap-2 px-3 pb-2.5 pt-1" style={{ borderTop: '1px solid #f3f4f6' }}>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400"><Bold className="w-3.5 h-3.5" /></button>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400"><Link className="w-3.5 h-3.5" /></button>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400"><Smile className="w-3.5 h-3.5" /></button>
          <div className="flex-1" />
          <button
            id="send-message-btn"
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold transition-all disabled:opacity-40"
            style={{ background: '#1e293b' }}
          >
            {isLoading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <><Send className="w-3.5 h-3.5" /> Send</>}
          </button>
        </div>
      </div>
    </div>
  );
}
