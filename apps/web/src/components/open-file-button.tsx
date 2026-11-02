import { useRef, type ReactNode } from 'react';
import { EDITOR_ACCEPT, type AppKind } from '@wepo/core';
import { useDocumentLauncher } from '../hooks/use-document-launcher';
import { Button, type ButtonProps } from './ui/button';
import { cn } from '../lib/utils';

const ALL_ACCEPT =
  '.docx,.xlsx,.csv,.pptx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/csv';

export interface OpenFileButtonProps extends Omit<ButtonProps, 'onClick'> {
  app?: AppKind;
  children?: ReactNode;
  onBusyChange?: (busy: boolean) => void;
  inputLabel?: string;
  className?: string;
}

export function OpenFileButton({ app, children, onBusyChange, inputLabel, variant, size, className, ...props }: OpenFileButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { openFile, busy } = useDocumentLauncher();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    onBusyChange?.(true);
    await openFile(file, app);
    onBusyChange?.(false);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={app ? EDITOR_ACCEPT[app] : ALL_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        aria-label={inputLabel ?? 'Choose a document file'}
        onChange={handleChange}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        loading={busy}
        className={cn(className)}
        onClick={() => inputRef.current?.click()}
        {...props}
      >
        {children}
      </Button>
    </>
  );
}
