import type { ReactNode } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { FacebookLoginButton } from "./FacebookLoginButton";

const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "1007115094738-i4re3khhtf8hlvnv1a5u57680il4p6ba.apps.googleusercontent.com";

type SocialAuthButtonsProps = {
  dividerLabel?: string;
};

/** Hai nút social dùng chung class — cùng chiều cao, bo góc, border */
export const SOCIAL_AUTH_BUTTON_CLASS =
  "inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 outline-none";

export function SocialAuthButtons({
  dividerLabel = "Or continue with",
}: SocialAuthButtonsProps) {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="shrink-0 text-sm font-medium text-slate-400">{dividerLabel}</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GoogleLoginButton />
        <FacebookLoginButton />
      </div>
    </GoogleOAuthProvider>
  );
}

export function SocialAuthButtonShell({ children }: { children: ReactNode }) {
  return <div className="flex w-full min-w-0 flex-col gap-1">{children}</div>;
}
