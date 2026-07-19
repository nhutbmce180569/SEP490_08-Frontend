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
  const { success, error, warning } = useToast();

  const [showChatSelect, setShowChatSelect] = useState(false);
  const [locationToken, setLocationToken] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const ensureLocationSharingEnabled = () => {
    const isAlreadyEnabled = localStorage.getItem("share_my_location") === "true";
    localStorage.setItem("share_my_location", "true");
    onShareStart?.();
    if (!isAlreadyEnabled) {
      warning(
        t("social.shareLocationWarnTurnOn") ||
          "Đã tự động bật chia sẻ vị trí của bạn trên bản đồ để liên kết hoạt động chính xác!"
      );
    }
  };

  const handleShare = () => {
    ensureLocationSharingEnabled();
    shareLocation(undefined, {
      onSuccess: (token) => {
        setLocationToken(token);
        const shareLink = `${window.location.origin}/track/${token}`;
        navigator.clipboard.writeText(shareLink);
        success(t("social.shareLinkCopied"));
      },
      onError: () => {
        error(t("social.shareLinkFailed"));
      },
    });
  };

  const handleOpenSendChat = () => {
    ensureLocationSharingEnabled();
    if (locationToken) {
      setShowChatSelect(true);
      return;
    }

    shareLocation(undefined, {
      onSuccess: (token) => {
        setLocationToken(token);
        setShowChatSelect(true);
      },
      onError: () => {
        error(t("social.shareLinkFailed"));
      },
    });
  };

  return (
    <div className="relative">
      {/* Main Single Icon Button */}
      <button
        onClick={() => setShowDropdown((prev) => !prev)}
        disabled={isPending}
        className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand text-white shadow-[0_8px_20px_rgba(0,104,224,0.3)] transition-all hover:scale-105 hover:bg-brand-hover active:scale-95 disabled:pointer-events-none disabled:opacity-70 cursor-pointer"
        title={t("social.shareLocationBtn")}
      >
        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />}
      </button>

      {/* Backdrop for closing dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40 cursor-default" 
          onClick={() => setShowDropdown(false)} 
        />
      )}

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200/85 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => {
              handleShare();
              setShowDropdown(false);
            }}
            className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5 cursor-pointer"
          >
            <Share2 className="h-4 w-4 text-slate-500" />
            <span>{t("social.shareLocationCopy")}</span>
          </button>
          
          <button
            onClick={() => {
              handleOpenSendChat();
              setShowDropdown(false);
            }}
            className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5 cursor-pointer"
          >
            <Send className="h-4 w-4 -rotate-45 text-slate-500" />
            <span>{t("social.shareLocationChat")}</span>
          </button>
        </div>
      )}

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
