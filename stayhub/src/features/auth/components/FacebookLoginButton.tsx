import React from "react";
import FacebookLoginModule from "@greatsumini/react-facebook-login";
import { useToast } from "../../../contexts/ToastContext";
import { useFacebookLogin } from "../hooks/useFacebookLogin";
import { SOCIAL_AUTH_BUTTON_CLASS, SocialAuthButtonShell } from "./SocialAuthButtons";
import { useTranslation } from "../../../contexts/LocaleContext";

const FacebookLogin = (FacebookLoginModule as any).default || FacebookLoginModule;

const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || "26819798064321441";

const FACEBOOK_ICON = "https://www.svgrepo.com/show/475647/facebook-color.svg";

export const FacebookLoginButton: React.FC = () => {
  const { t } = useTranslation();
  const { error } = useToast();
  const { handleFacebookLoginSubmit, isSubmitting, serverError } = useFacebookLogin();

  return (
    <SocialAuthButtonShell>
      <FacebookLogin
        appId={FACEBOOK_APP_ID}
        onSuccess={(response: { accessToken: string }) => {
          handleFacebookLoginSubmit({ accessToken: response.accessToken });
        }}
        onFail={() => {
          error(t("errors.facebookLoginFailed"));
        }}
        onProfileSuccess={() => {}}
        render={({ onClick }: { onClick: () => void }) => (
          <button
            type="button"
            onClick={onClick}
            disabled={isSubmitting}
            className={SOCIAL_AUTH_BUTTON_CLASS}
          >
            <img src={FACEBOOK_ICON} alt="" aria-hidden className="h-5 w-5 shrink-0" />
            {t("common.facebook")}
          </button>
        )}
      />

      {isSubmitting && <p className="text-xs text-slate-500">{t("common.processing")}</p>}
      {serverError && <p className="text-xs text-rose-500">{serverError}</p>}
    </SocialAuthButtonShell>
  );
};
