import type { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useTranslation } from "../../../contexts/LocaleContext";
import { GoogleLoginButton } from "./GoogleLoginButton";

const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "1007115094738-i4re3khhtf8hlvnv1a5u57680il4p6ba.apps.googleusercontent.com";

type SocialAuthButtonsProps = {
  dividerLabel?: string;
};

/** Hai nút social dùng chung class — cùng chiều cao, bo góc, border */
export const SOCIAL_AUTH_BUTTON_CLASS =
  "inline-flex h-[48px] w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 outline-none shadow-sm";

export function SocialAuthButtons({ dividerLabel }: SocialAuthButtonsProps) {
  const { t } = useTranslation();
  const resolvedDivider = dividerLabel ?? t("common.orContinueWith");
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span className="shrink-0 text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{resolvedDivider}</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      <div className="flex flex-col gap-3">
        <GoogleLoginButton />
      </div>
    </GoogleOAuthProvider>
  );
}

export function SocialAuthButtonShell({ children }: { children: ReactNode }) {
  return <div className="flex w-full min-w-0 flex-col gap-1">{children}</div>;
}
