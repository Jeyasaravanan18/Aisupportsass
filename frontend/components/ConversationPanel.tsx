'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';
import type { ConversationMessage } from '@/types';

interface Props {
  history: ConversationMessage[];
  isLoading: boolean;
  mode: string;
}

export default function ConversationPanel({ history, isLoading, mode }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 gap-6" style={{ background: '#ffffff' }}>
      <AnimatePresence initial={false}>
        {history.length === 0 && !isLoading && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center flex-1 text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-900 text-sm font-medium">Waiting for first message…</p>
            <p className="text-gray-500 text-xs mt-1">
              {mode === 'simulator' ? 'Click "Next Turn" to generate the first customer message.'
                : mode === 'manual' ? 'Type the customer\'s message below.'
                : 'Click "Next Turn" to replay the first message.'}
            </p>
          </motion.div>
        )}

        {history.map((msg, i) => {
          const isCustomer = msg.role === 'customer';
          const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

          return (
            <motion.div
              key={`${msg.role}-${i}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              className={`flex gap-3 ${isCustomer ? 'flex-row' : 'flex-row-reverse'}`}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mt-4"
                style={isCustomer ? { background: '#e0f2fe', color: '#0369a1' } : { background: '#111827', color: '#ffffff' }}>
                {isCustomer ? 'C' : 'A'}
              </div>

              <div className={`flex flex-col max-w-[80%] ${isCustomer ? 'items-start' : 'items-end'}`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-xs font-semibold text-gray-700">{isCustomer ? 'Customer' : 'You'}</span>
                  <span className="text-xs text-gray-400">{timeStr}</span>
                </div>
                <div className={`px-4 py-3 text-sm leading-relaxed ${isCustomer ? 'bubble-customer' : 'bubble-agent'}`}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          );
        })}

        {isLoading && (
          <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-blue-50 text-blue-700 mt-4">
              C
            </div>
            <div className="flex flex-col items-start max-w-[80%]">
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-xs font-semibold text-gray-700">Customer</span>
              </div>
              <div className="bubble-customer px-4 py-3.5 flex items-center gap-1.5" style={{ borderRadius: '16px 16px 16px 4px' }}>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
