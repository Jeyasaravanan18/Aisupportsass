import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CoachAI Pro — Enterprise Agent Coaching Platform',
  description:
    'Real-time AI coaching for customer support agents — live sentiment analysis, RAG-powered knowledge, escalation detection, and post-session analytics.',
  keywords: ['customer support', 'AI coaching', 'real-time', 'sentiment analysis', 'RAG'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen" style={{ background: '#f2f4f7' }}>
        {children}
      </body>
    </html>
  );
}
