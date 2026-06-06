import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { PATH } from "../../../config/routes/route";
import { AuthLayout } from "../components/AuthLayout";
import { AuthFormField } from "../components/AuthFormField";
import { useTranslation } from "../../../contexts/LocaleContext";
import {
  getOtpCooldownStorageKey,
  usePersistentCountdown,
} from "../hooks/usePersistentCountdown";

const OTP_COOLDOWN_SECONDS = 60;

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const { handleForgotPasswordSubmit, isSubmitting } = useForgotPassword();
  const navigate = useNavigate();
  const {
    isActive: isCooldownActive,
    startCountdown,
  } = usePersistentCountdown(
    getOtpCooldownStorageKey(email),
    OTP_COOLDOWN_SECONDS,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await handleForgotPasswordSubmit({ email });
    if (result.success) {
      startCountdown();
      navigate(PATH.PUBLIC.RESET_PASSWORD, { state: { email } });
    } else if (result.retryAfterSeconds) {
      startCountdown(result.retryAfterSeconds);
    }
  };

  return (
    <AuthLayout
      title={t("auth.forgotTitle")}
      subtitle={t("auth.forgotSubtitleLong")}
      heroTitle={t("auth.forgotHeroTitle")}
      heroSubtitle={t("auth.forgotHeroDesc")}
      imageSeed="stayhub-forgot"
      footer={
        <div className="mt-8 text-center">
          <Link
            to={PATH.PUBLIC.LOGIN}
            className="text-sm font-semibold text-slate-500 transition-colors hover:text-brand !no-underline"
          >
            &larr; {t("auth.backToLogin")}
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthFormField
          label={t("errors.emailAddress")}
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("errors.emailPlaceholder")}
          required
        />

        <ActionButton
          type="submit"
          variant="primary"
          disabled={isSubmitting || !email || isCooldownActive}
          className="group !mt-6 !h-[50px] !w-full gap-2 text-[15px]"
        >
          {isSubmitting ? t("errors.sending") : t("errors.sendResetCode")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </ActionButton>
      </form>
    </AuthLayout>
  );
}
