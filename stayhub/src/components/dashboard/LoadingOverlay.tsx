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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm transition-opacity">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-6 shadow-2xl">
        {/* Icon xoay (spinner) */}
        <Loader2 className="h-8 w-8 animate-spin text-[#4880ff]" />
        <p className="text-sm font-semibold text-slate-700">{message}</p>
      </div>
    </div>
  );
};