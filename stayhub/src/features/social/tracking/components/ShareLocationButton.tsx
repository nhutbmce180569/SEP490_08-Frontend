import React from "react";
import { Share2, Loader2 } from "lucide-react";
import { useShareLocation } from "../hooks/useLocationTracking";
import { useToast } from "../../../../contexts/ToastContext";
import { useTranslation } from "../../../../contexts/LocaleContext";

export const ShareLocationButton: React.FC = () => {
  const { t } = useTranslation();
  const { mutate: shareLocation, isPending } = useShareLocation();
  const { success, error } = useToast();

  const handleShare = () => {
    shareLocation(undefined, {
      onSuccess: (token) => {
        const shareLink = `${window.location.origin}/track/${token}`;
        navigator.clipboard.writeText(shareLink);
        success(t("social.shareLinkCopied"));
      },
      onError: () => {
        error(t("social.shareLinkFailed"));
      },
    });
  };

  return (
    <button
      onClick={handleShare}
      disabled={isPending}
      className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,104,224,0.3)] transition-all hover:scale-105 hover:bg-brand-hover active:scale-95 disabled:pointer-events-none disabled:opacity-70"
    >
      {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />}
      <span>{t("social.shareLocationBtn")}</span>
    </button>
  );
};
