import React, { useRef } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useGoogleLogin } from "../hooks/useGoogleLogin";
import { useToast } from "../../../contexts/ToastContext";
import { SOCIAL_AUTH_BUTTON_CLASS, SocialAuthButtonShell } from "./SocialAuthButtons";

const GOOGLE_ICON =
  "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg";

export const GoogleLoginButton: React.FC = () => {
  const hiddenRef = useRef<HTMLDivElement>(null);
  const { handleGoogleLoginSubmit, isSubmitting, serverError } = useGoogleLogin();
  const { error } = useToast();

  const triggerGoogleLogin = () => {
    const btn = hiddenRef.current?.querySelector('[role="button"]') as HTMLElement | null;
    btn?.click();
  };

  return (
    <SocialAuthButtonShell>
      {/* Nút Google ẩn — chỉ dùng để lấy idToken, UI hiển thị bằng nút custom bên dưới */}
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
            error("Google login failed. Please try again.");
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
        Google
      </button>

      {isSubmitting && <p className="text-xs text-slate-500">Processing login...</p>}
      {serverError && <p className="text-xs text-rose-500">{serverError}</p>}
    </SocialAuthButtonShell>
  );
};
