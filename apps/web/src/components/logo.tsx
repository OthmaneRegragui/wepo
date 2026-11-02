import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export function Logo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2.5 rounded-lg', className)} aria-label="Wepo Office home">
      <LogoMark />
      {!markOnly && (
        <span className="text-[17px] font-semibold tracking-tight text-slate-900">
          wepo<span className="text-slate-400"> office</span>
        </span>
      )}
    </Link>
  );
}

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="11" fill="#0f172a" />
      <path d="M9.5 12.5 14.7 27.5 20 16.8 25.3 27.5 30.5 12.5" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="12.5" r="2.6" fill="#3b82f6" />
      <circle cx="20" cy="16.8" r="2.6" fill="#10b981" />
      <circle cx="30.5" cy="12.5" r="2.6" fill="#f97316" />
    </svg>
  );
}
