import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, KeyRound, ArrowRight } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useResetPassword } from "../hooks/useResetPassword";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { PATH } from "../../../config/routes/route";
import { AuthLayout } from "../components/AuthLayout";
import { AuthFormField } from "../components/AuthFormField";
import { useTranslation } from "../../../contexts/LocaleContext";
import { AuthContext } from "../../../contexts/AuthContext";
import {
  getOtpCooldownStorageKey,
  usePersistentCountdown,
} from "../hooks/usePersistentCountdown";

const OTP_COOLDOWN_SECONDS = 60;

export default function ResetPassword() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(PATH.PUBLIC.HOME, { replace: true });
    }
  }, [user, navigate]);

  const prefilledEmail = location.state?.email || "";

  const [formData, setFormData] = useState({
    email: prefilledEmail,
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { handleResetPasswordSubmit, isSubmitting, serverErrors } = useResetPassword();
  const { handleForgotPasswordSubmit, isSubmitting: isResending } = useForgotPassword();
  const {
    remainingSeconds: countdown,
    startCountdown,
  } = usePersistentCountdown(
    getOtpCooldownStorageKey(formData.email),
    OTP_COOLDOWN_SECONDS,
  );

  useEffect(() => {
    if (!prefilledEmail) {
      navigate(PATH.PUBLIC.FORGOT_PASSWORD);
      return;
    }

    if (serverErrors && Object.keys(serverErrors).length > 0) {
      const normalizedErrors: Record<string, string> = {};
      Object.entries(serverErrors).forEach(([key, val]) => {
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        normalizedErrors[camelKey] = Array.isArray(val) ? val[0] : String(val);
      });
      setErrors((prev) => ({ ...prev, ...normalizedErrors }));
    }
  }, [serverErrors, prefilledEmail, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: t("errors.passwordsNoMatch") }));
      return;
    }

    const { confirmPassword, ...payload } = formData;
    await handleResetPasswordSubmit(payload);
  };

  const handleResendCode = async () => {
    if (formData.email) {
      const result = await handleForgotPasswordSubmit({ email: formData.email });
      if (result.success) {
        startCountdown();
      } else if (result.retryAfterSeconds) {
        startCountdown(result.retryAfterSeconds);
      }
    }
  };

  return (
    <AuthLayout
      title={t("auth.resetTitle")}
      subtitle={t("auth.resetSubtitleLong")}
      heroTitle={t("auth.resetHeroTitle")}
      heroSubtitle={t("auth.resetHeroDesc")}
      imageSeed="stayhub-reset"
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
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthFormField
          label={t("errors.emailAddress")}
          name="email"
          type="email"
          icon={Mail}
          value={formData.email}
          readOnly
          placeholder={t("errors.emailPlaceholder")}
          error={errors.email}
          required
        />

        <AuthFormField
          label={t("auth.verificationCode")}
          name="code"
          type="text"
          icon={KeyRound}
          value={formData.code}
          onChange={handleChange}
          placeholder={t("auth.enterResetCode")}
          error={errors.code}
          labelExtra={
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending || isSubmitting || countdown > 0}
              className="text-xs font-bold text-brand outline-none transition-colors hover:text-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isResending
                ? t("auth.resending")
                : countdown > 0
                  ? t("auth.resendCodeCountdown", { count: countdown })
                  : t("auth.resendCode")}
            </button>
          }
          required
        />

        <AuthFormField
          label={t("auth.newPassword")}
          name="newPassword"
          type={showPassword ? "text" : "password"}
          icon={Lock}
          value={formData.newPassword}
          onChange={handleChange}
          placeholder={t("auth.newPasswordPlaceholder")}
          error={errors.newPassword}
          showToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          required
        />

        <AuthFormField
          label={t("auth.confirmNewPassword")}
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          icon={Lock}
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder={t("auth.confirmNewPasswordPlaceholder")}
          error={errors.confirmPassword}
          required
        />

        <ActionButton
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="group !mt-6 !h-[50px] !w-full gap-2 text-[15px]"
        >
          {isSubmitting ? t("errors.resetting") : t("errors.resetBtn")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </ActionButton>
      </form>
    </AuthLayout>
  );
}
