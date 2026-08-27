'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Cpu, BarChart2, Settings, Plus } from 'lucide-react';
import Image from 'next/image';

interface SidebarProps {
  agentName?: string;
  onNewSession?: () => void;
}

const NAV = [
  { icon: BarChart2,       label: 'Performance', href: '/report' },
  { icon: LayoutDashboard, label: 'Dashboard',   href: '/session' },
  { icon: Cpu,             label: 'Simulator',   href: '/session' },
  { icon: Settings,        label: 'Settings',    href: '/session' },
];

export default function Sidebar({ agentName = 'Agent Avatar', onNewSession }: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '#') return false;
    if (href === '/report' && pathname.startsWith('/report')) return true;
    if (href === '/session' && pathname === '/session') return true;
    return false;
  };

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-screen overflow-y-auto"
      style={{ width: 220, background: '#ffffff', borderRight: '1px solid #e5e7eb' }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-6">
        <h1 className="font-bold text-gray-900 text-lg leading-tight tracking-tight">CoachAI Pro</h1>
        <div className="text-xs text-gray-500 mt-0.5">Enterprise Tier</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 flex flex-col gap-1">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = isActive(href);
          return (
            <button
              key={label}
              onClick={() => href !== '#' && router.push(href)}
              className="w-full text-left flex items-center gap-3 px-5 py-2.5 transition-colors relative"
              style={active ? { background: '#f3f4f6' } : {}}
            >
              {active && <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: '#1e3a8a' }} />}
              <Icon className="w-4 h-4" style={{ color: active ? '#111827' : '#6b7280' }} />
              <span className="text-sm font-medium" style={{ color: active ? '#111827' : '#4b5563' }}>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* New Session Button & Avatar */}
      <div className="p-5 flex flex-col gap-5">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-white text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#000000' }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Training Session
        </button>

        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
               <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{agentName}</div>
            <div className="text-xs text-gray-500">Online</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
