import React, { useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Phone, User } from "lucide-react";
import { useGoogleLogin } from "../hooks/useGoogleLogin";
import { useToast } from "../../../contexts/ToastContext";
import { SOCIAL_AUTH_BUTTON_CLASS, SocialAuthButtonShell } from "./SocialAuthButtons";
import { useTranslation } from "../../../contexts/LocaleContext";

const GOOGLE_ICON =
  "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg";

export const GoogleLoginButton: React.FC = () => {
  const { t } = useTranslation();
  const hiddenRef = useRef<HTMLDivElement>(null);
  const {
    handleGoogleLoginSubmit,
    handleConfirmPhoneNumber,
    handleCancelPhoneInput,
    pendingGoogleAuth,
    isSubmitting,
    serverError,
  } = useGoogleLogin();
  const { error } = useToast();

  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const triggerGoogleLogin = () => {
    setPhoneInput("");
    setPhoneError("");
    const btn = hiddenRef.current?.querySelector('[role="button"]') as HTMLElement | null;
    btn?.click();
  };

  const handleSubmitPhone = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    const trimmed = phoneInput.trim();

    if (trimmed.length > 15) {
      setPhoneError(t("errors.phoneMax15Chars") || "Số điện thoại tối đa 15 chữ số.");
      return;
    }
    if (!/^[0-9+()\- ]{8,15}$/.test(trimmed)) {
      setPhoneError(t("errors.phoneInvalid") || "Định dạng số điện thoại không hợp lệ.");
      return;
    }

    handleConfirmPhoneNumber(trimmed);
  };

  return (
    <SocialAuthButtonShell>
      {/* Nút Google ẩn — chỉ dùng để lấy idToken */}
      <div
        ref={hiddenRef}
        className="pointer-events-none fixed -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
        aria-hidden
      >
        <GoogleLogin
          type="icon"
          shape="circle"
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              handleGoogleLoginSubmit({ idToken: credentialResponse.credential });
            }
          }}
          onError={() => {
            error(t("errors.googleLoginFailed"));
          }}
        />
      </div>

      <button
        type="button"
        onClick={triggerGoogleLogin}
        disabled={isSubmitting}
        className={SOCIAL_AUTH_BUTTON_CLASS}
      >
        <img src={GOOGLE_ICON} alt="" aria-hidden className="h-5 w-5 shrink-0" />
        {t("common.google")}
      </button>

      {isSubmitting && !pendingGoogleAuth && (
        <p className="text-xs text-slate-500">{t("common.processing")}</p>
      )}
      {serverError && !pendingGoogleAuth && (
        <p className="text-xs text-rose-500">{serverError}</p>
      )}

      {/* MODAL BỔ SUNG SỐ ĐIỆN THOẠI CHO TÀI KHOẢN GOOGLE MỚI */}
      {pendingGoogleAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-left relative">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t("errors.googlePhoneModalTitle") || "Bổ sung số điện thoại"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("errors.googlePhoneModalDesc") ||
                    "Tài khoản Google của bạn là tài khoản mới. Vui lòng bổ sung số điện thoại để hoàn tất đăng ký."}
                </p>
              </div>
            </div>

            <div className="my-5 flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
              {pendingGoogleAuth.avatarUrl ? (
                <img
                  src={pendingGoogleAuth.avatarUrl}
                  alt=""
                  className="h-11 w-11 rounded-full object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/20 font-bold text-brand">
                  {pendingGoogleAuth.fullName?.charAt(0) || <User className="h-5 w-5" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">
                  {pendingGoogleAuth.fullName || "Google User"}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {pendingGoogleAuth.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitPhone} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t("auth.phoneNumber")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => {
                      if (e.target.value.length <= 15) {
                        setPhoneInput(e.target.value);
                        if (phoneError) setPhoneError("");
                      }
                    }}
                    placeholder={t("errors.phonePlaceholder") || "Nhập số điện thoại"}
                    maxLength={15}
                    className={`w-full rounded-xl border bg-slate-50/50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition dark:bg-slate-800/50 dark:text-white ${
                      phoneError
                        ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-brand focus:ring-2 focus:ring-brand/20"
                    }`}
                    required
                  />
                </div>
                {phoneError && (
                  <p className="text-xs font-medium text-rose-500">{phoneError}</p>
                )}
                {serverError && (
                  <p className="text-xs font-medium text-rose-500">{serverError}</p>
                )}
              </div>

              <div className="pt-3 flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleCancelPhoneInput}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-700/50 outline-none disabled:opacity-50"
                >
                  {t("errors.cancelBtn") || "Hủy bỏ"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-hover disabled:opacity-50 outline-none flex items-center justify-center gap-2"
                >
                  {isSubmitting
                    ? t("common.processing")
                    : t("errors.confirmAndCompleteBtn") || "Xác nhận & Hoàn tất"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SocialAuthButtonShell>
  );
};
