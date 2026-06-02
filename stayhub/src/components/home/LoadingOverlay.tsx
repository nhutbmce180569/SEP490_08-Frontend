import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isOpen,
  message = 'Processing...',
}) => {
  if (!isOpen) return null;

  return (
    <div className="glass-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity">
      <div className="glass-modal flex flex-col items-center gap-4 px-8 py-6">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm font-semibold text-slate-700">{message}</p>
      </div>
    </div>
  );
};