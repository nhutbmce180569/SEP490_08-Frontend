import React, { useState, useContext } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { MessageCircle, Phone, X, ExternalLink, Headphones, Clock, MessageSquare, ShieldCheck } from "lucide-react";
import { useTranslation } from "../../contexts/LocaleContext";
import { useChatNotification } from "../../features/social/chat/component/ChatNotificationContext";
import { useQuery } from "@tanstack/react-query";
import { chatService } from "../../features/social/chat/services/chatService";
import { AuthContext } from "../../contexts/AuthContext";

// Custom Zalo Logo Icon component
const ZaloLogoIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24 4C12.95 4 4 12.06 4 22C4 26.68 5.81 30.95 8.84 34.23L6.54 42.14C6.28 43.03 7.17 43.83 8.04 43.46L16.48 39.87C18.82 40.86 21.36 41.4 24 41.4C35.05 41.4 44 33.34 44 23.4C44 13.46 35.05 4 24 4Z"
      fill="#0068FF"
    />
    <path
      d="M14.5 17.5H23.5L14.5 28.5H24.5"
      stroke="white"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M27.5 22.5C27.5 20.3 29.3 18.5 31.5 18.5C33.7 18.5 35.5 20.3 35.5 22.5V28.5H27.5V22.5Z"
      stroke="white"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FloatingContactWidget: React.FC = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { isPopoverOpen, setIsPopoverOpen } = useChatNotification();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isZaloModalOpen, setIsZaloModalOpen] = useState(false);

  const { data: chatRooms = [] } = useQuery({
    queryKey: ["chatRooms"],
    queryFn: chatService.getChatRooms,
    enabled: !!user,
    refetchInterval: 10000,
  });

  const unreadChatCount = chatRooms.reduce((acc: number, r: any) => acc + (r.unreadCount || 0), 0);

  // Chỉ hiển thị ở trang chủ Home (pathname === "/")
  if (pathname !== "/") return null;

  return (
    <>
      {/* Floating Widget Stack (Fixed Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
        {/* 1. CHAT NỔI ĐỘC LẬP (Nằm phía trên, chỉ hiển thị khi đã đăng nhập) */}
        {user && (
          <div className="group relative flex items-center justify-center">
            {/* Tooltip */}
            <div className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 scale-95 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 z-50">
              <div className="relative whitespace-nowrap rounded-xl bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md border border-slate-700/50">
                {t("contact.chatTooltip")}
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900/90" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              className={`relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 hover:scale-110 cursor-pointer ${
                isPopoverOpen
                  ? "bg-brand ring-4 ring-brand/30 shadow-brand/40"
                  : "bg-indigo-600 shadow-indigo-600/35 hover:shadow-indigo-600/50"
              }`}
              aria-label={t("contact.chatTooltip")}
            >
              {unreadChatCount > 0 && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-30 animate-ping pointer-events-none" />
              )}
              <MessageCircle size={24} className="stroke-[2.2] relative z-10" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 z-20 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white ring-2 ring-white shadow-md animate-pulse">
                  {unreadChatCount > 99 ? "99+" : unreadChatCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* 2. CỤM NÚT LIÊN HỆ NỔI (Có thể thu gọn / sổ ngang) */}
        {!isExpanded ? (
          /* COLLAPSED STATE: Nút tròn Phone duy nhất (Emerald Green 56px) */
          <div className="group relative flex items-center justify-center">
            {/* Tooltip */}
            <div className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 scale-95 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 z-50">
              <div className="relative whitespace-nowrap rounded-xl bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md border border-slate-700/50">
                {t("contact.hotlineSubtitle")}
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900/90" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/40 transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-emerald-500/60 cursor-pointer"
              aria-label="Open contact options"
            >
              {/* Pulsing ring effect */}
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 animate-ping pointer-events-none" />
              <Phone size={24} className="fill-white stroke-none relative z-10 transition-transform duration-300 group-hover:rotate-12" />
            </button>
          </div>
        ) : (
          /* EXPANDED STATE: Sổ ngang các nút liên hệ (Facebook, Zalo, Hotline, Close X) */
          <div className="flex items-center gap-3 animate-in slide-in-from-right-5 fade-in duration-300">
            {/* Facebook Button */}
            <div className="group relative flex items-center">
              <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 scale-95 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 z-50">
                <div className="relative whitespace-nowrap rounded-xl bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md border border-slate-700/50">
                  {t("contact.facebookTooltip")}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFacebookModalOpen(true)}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-lg shadow-blue-500/35 transition-all duration-300 hover:scale-110 cursor-pointer"
                aria-label={t("contact.facebookTooltip")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="relative z-10"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </button>
            </div>

            {/* Zalo Button */}
            <div className="group relative flex items-center">
              <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 scale-95 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 z-50">
                <div className="relative whitespace-nowrap rounded-xl bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md border border-slate-700/50">
                  {t("contact.zaloTooltip")}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsZaloModalOpen(true)}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#0068FF] shadow-lg shadow-slate-300/60 border border-slate-100 transition-all duration-300 hover:scale-110 cursor-pointer"
                aria-label={t("contact.zaloTooltip")}
              >
                <ZaloLogoIcon className="h-7 w-7" />
              </button>
            </div>

            {/* Phone / Hotline Button */}
            <div className="group relative flex items-center">
              <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 scale-95 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 z-50">
                <div className="relative whitespace-nowrap rounded-xl bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md border border-slate-700/50">
                  {t("contact.phoneTooltip")}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPhoneModalOpen(true)}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/35 transition-all duration-300 hover:scale-110 cursor-pointer"
                aria-label={t("contact.phoneTooltip")}
              >
                <Phone size={24} className="fill-white stroke-none relative z-10" />
              </button>
            </div>

            {/* Close ('X') Button */}
            <div className="group relative flex items-center">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-lg shadow-slate-300/60 border border-slate-100 transition-all duration-300 hover:scale-110 hover:bg-slate-50 cursor-pointer"
                aria-label="Close contact menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                  <X size={18} strokeWidth={3} />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FACEBOOK MODAL POPUP */}
      {isFacebookModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => e.target === e.currentTarget && setIsFacebookModalOpen(false)}
          >
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white">
                <button
                  type="button"
                  onClick={() => setIsFacebookModalOpen(false)}
                  className="absolute top-4 right-4 rounded-full bg-white/20 p-1.5 text-white transition-colors hover:bg-white/30 cursor-pointer"
                >
                  <X size={18} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">{t("contact.facebookTitle")}</h3>
                    <p className="text-xs text-blue-100 font-medium">{t("contact.facebookSubtitle")}</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{t("contact.officialFanpage")}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {t("contact.officialFanpageDesc")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquare size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{t("contact.messengerSupport")}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {t("contact.messengerSupportDesc")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2.5 pt-1">
                  <a
                    href="https://facebook.com/stayhub.official"
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-extrabold text-white shadow-md shadow-blue-600/30 transition-all hover:bg-blue-700 hover:shadow-lg"
                  >
                    <span>{t("contact.visitFacebook")}</span>
                    <ExternalLink size={14} />
                  </a>
                  <a
                    href="https://m.me/stayhub.official"
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-extrabold text-blue-700 transition-all hover:bg-blue-100"
                  >
                    <MessageSquare size={14} />
                    <span>{t("contact.sendMessenger")}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ZALO MODAL POPUP */}
      {isZaloModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => e.target === e.currentTarget && setIsZaloModalOpen(false)}
          >
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-6 text-white">
                <button
                  type="button"
                  onClick={() => setIsZaloModalOpen(false)}
                  className="absolute top-4 right-4 rounded-full bg-white/20 p-1.5 text-white transition-colors hover:bg-white/30 cursor-pointer"
                >
                  <X size={18} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0068FF] shadow-md font-black text-sm">
                    <ZaloLogoIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">{t("contact.zaloTitle")}</h3>
                    <p className="text-xs text-sky-100 font-medium">{t("contact.zaloSubtitle")}</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={18} className="text-[#0068FF] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">StayHub Zalo Official Account</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {t("contact.zaloDesc")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-xs font-bold text-slate-600">Hotline Zalo / SĐT:</span>
                    <span className="text-sm font-black text-[#0068FF]">0908 123 456</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-1">
                  <a
                    href="https://zalo.me/0908123456"
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-4 py-3 text-xs font-extrabold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 hover:shadow-lg"
                  >
                    <span>{t("contact.visitZalo")}</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* PHONE / HOTLINE MODAL POPUP */}
      {isPhoneModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => e.target === e.currentTarget && setIsPhoneModalOpen(false)}
          >
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6 text-white">
                <button
                  type="button"
                  onClick={() => setIsPhoneModalOpen(false)}
                  className="absolute top-4 right-4 rounded-full bg-white/20 p-1.5 text-white transition-colors hover:bg-white/30 cursor-pointer"
                >
                  <X size={18} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-md">
                    <Phone size={24} className="fill-emerald-600 stroke-none" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">{t("contact.hotlineTitle")}</h3>
                    <p className="text-xs text-emerald-100 font-medium">{t("contact.hotlineSubtitle")}</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Option 1: Hotline tổng đài */}
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <Headphones size={20} />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-400">{t("contact.cskhHotline")}</div>
                      <div className="text-base font-black text-slate-800">1900 6868</div>
                    </div>
                  </div>
                  <a
                    href="tel:19006868"
                    className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 transition-all"
                  >
                    {t("contact.callNow")}
                  </a>
                </div>

                {/* Option 2: Hotline tư vấn tour */}
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                      <Phone size={18} />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-400">{t("contact.quickBookingHotline")}</div>
                      <div className="text-base font-black text-slate-800">0908 123 456</div>
                    </div>
                  </div>
                  <a
                    href="tel:0908123456"
                    className="rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-teal-700 transition-all"
                  >
                    {t("contact.callNow")}
                  </a>
                </div>

                {/* Working hours notice */}
                <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-2.5 text-xs text-amber-800">
                  <Clock size={16} className="text-amber-600 shrink-0" />
                  <span className="font-semibold text-[11px]">
                    {t("contact.workingHours")}
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
