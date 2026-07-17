import React, { useState } from "react";
import { Share2, Loader2, Send } from "lucide-react";
import { useShareLocation } from "../hooks/useLocationTracking";
import { useToast } from "../../../../contexts/ToastContext";
import { useTranslation } from "../../../../contexts/LocaleContext";
import { ShareTargetModal } from "../../chat/component/ShareTargetModal";

interface ShareLocationButtonProps {
  onShareStart?: () => void;
}

export const ShareLocationButton: React.FC<ShareLocationButtonProps> = ({ onShareStart }) => {
  const { t } = useTranslation();
  const { mutate: shareLocation, isPending } = useShareLocation();
  const { success, error } = useToast();

  const [showChatSelect, setShowChatSelect] = useState(false);
  const [locationToken, setLocationToken] = useState<string | null>(null);

  const handleShare = () => {
    shareLocation(undefined, {
      onSuccess: (token) => {
        setLocationToken(token);
        const shareLink = `${window.location.origin}/track/${token}`;
        navigator.clipboard.writeText(shareLink);
        success(t("social.shareLinkCopied"));
        onShareStart?.();
      },
      onError: () => {
        error(t("social.shareLinkFailed"));
      },
    });
  };

  const handleOpenSendChat = () => {
    if (locationToken) {
      setShowChatSelect(true);
      onShareStart?.();
      return;
    }

    shareLocation(undefined, {
      onSuccess: (token) => {
        setLocationToken(token);
        setShowChatSelect(true);
        onShareStart?.();
      },
      onError: () => {
        error(t("social.shareLinkFailed"));
      },
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Nút 1: Copy Link */}
      <button
        onClick={handleShare}
        disabled={isPending}
        className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,104,224,0.3)] transition-all hover:scale-105 hover:bg-brand-hover active:scale-95 disabled:pointer-events-none disabled:opacity-70 cursor-pointer"
      >
        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />}
        <span>{t("social.shareLocationBtn")}</span>
      </button>

      {/* Nút 2: Gửi tin nhắn qua Chat */}
      <button
        onClick={handleOpenSendChat}
        disabled={isPending}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white shadow-[0_4px_12px_rgba(15,23,42,0.15)] transition-all hover:scale-105 hover:bg-slate-800 active:scale-95 disabled:pointer-events-none disabled:opacity-70 cursor-pointer"
        title="Gửi vị trí qua Tin nhắn"
      >
        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4 -rotate-45" />}
      </button>

      {showChatSelect && locationToken && (
        <ShareTargetModal
          onClose={() => setShowChatSelect(false)}
          shareContent={`📍 Vị trí hiện tại của tôi: [LocationShare:${JSON.stringify({ token: locationToken })}]`}
          successMessage="Đã chia sẻ vị trí của bạn qua tin nhắn!"
        />
      )}
    </div>
  );
};
