import type { AppKind } from '@wepo/core';
import { FileText, Presentation, Table2, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export function AppIcon({ kind, className, size = 22 }: { kind: AppKind; className?: string; size?: number }) {
  const Icon = iconFor(kind);
  return <Icon className={cn(className)} size={size} strokeWidth={1.9} aria-hidden />;
}

export function iconFor(kind: AppKind): LucideIcon {
  switch (kind) {
    case 'word':
      return FileText;
    case 'sheets':
      return Table2;
    case 'slides':
      return Presentation;
  }
}

export function AppIconTile({ kind, size = 'md' }: { kind: AppKind; size?: 'sm' | 'md' | 'lg' }) {
  const color =
    kind === 'word'
      ? 'bg-blue-600 text-white shadow-blue-600/20'
      : kind === 'sheets'
        ? 'bg-emerald-600 text-white shadow-emerald-600/20'
        : 'bg-orange-500 text-white shadow-orange-500/20';
  const dimensions = size === 'lg' ? 'h-14 w-14 rounded-2xl' : size === 'sm' ? 'h-9 w-9 rounded-xl' : 'h-11 w-11 rounded-xl';
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center shadow-lg', color, dimensions)}>
      <AppIcon kind={kind} size={size === 'lg' ? 26 : size === 'sm' ? 17 : 21} />
    </span>
  );
}
