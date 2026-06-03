import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../../contexts/LocaleContext';

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isOpen,
  message,
}) => {
  const { t } = useTranslation();
  const resolvedMessage = message ?? t('common.processing');
  if (!isOpen) return null;

  return createPortal(
    <div className="glass-overlay fixed inset-0 z-[99998] flex items-center justify-center p-4 transition-opacity">
      <div className="glass-modal flex flex-col items-center gap-4 px-8 py-6">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm font-semibold text-slate-700">{resolvedMessage}</p>
      </div>
    </div>,
    document.body,
  );
};
