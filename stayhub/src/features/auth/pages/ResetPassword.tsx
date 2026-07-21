import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, KeyRound } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useResetPassword } from "../hooks/useResetPassword";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { verifyResetOtp } from "../services/auth.service";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { AuthLayout } from "../components/AuthLayout";
import { AuthFormField } from "../components/AuthFormField";
import { useTranslation } from "../../../contexts/LocaleContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { getDashboardPath } from "../../../utils/jwt";
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
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (user) {
      navigate(getDashboardPath(user.roles), { replace: true });
    }
  }, [user, navigate]);

  const prefilledEmail = location.state?.email || "";

  const [step, setStep] = useState<"VERIFY_OTP" | "SET_NEW_PASSWORD">("VERIFY_OTP");
  const [resetToken, setResetToken] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code) return;
    setIsVerifyingOtp(true);
    setErrors({});
    try {
      const res = await verifyResetOtp({ email: formData.email, code: formData.code });
      if (res?.data?.resetToken) {
        success(res.message || t("auth.verifyOtpSuccess"));
        setResetToken(res.data.resetToken);
        setStep("SET_NEW_PASSWORD");
      } else {
        showError(t("auth.invalidOtpError"));
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || t("auth.invalidOtpError");
      setErrors({ code: msg });
      showError(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: t("errors.passwordsNoMatch") }));
      return;
    }

    await handleResetPasswordSubmit({
      email: formData.email,
      resetToken: resetToken,
      newPassword: formData.newPassword,
    });
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
      title={
        step === "VERIFY_OTP"
          ? t("auth.verifyOtpTitle")
          : t("auth.setNewPasswordTitle")
      }
      subtitle={
        step === "VERIFY_OTP"
          ? ""
          : t("auth.setNewPasswordSubtitle")
      }
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
      {step === "VERIFY_OTP" ? (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
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
                disabled={isResending || isVerifyingOtp || countdown > 0}
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

          <ActionButton
            type="submit"
            variant="primary"
            disabled={isVerifyingOtp || !formData.code}
            className="!mt-6 !h-[50px] !w-full text-[15px]"
          >
            {isVerifyingOtp
              ? t("auth.verifyingOtp")
              : t("auth.verifyOtpBtn")}
          </ActionButton>
        </form>
      ) : (
        <form onSubmit={handleResetSubmit} className="space-y-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs font-medium text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
            {t("auth.otpVerifiedBanner")} <span className="font-bold">{formData.email}</span>.
          </div>

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
            disabled={isSubmitting || !formData.newPassword || !formData.confirmPassword}
            className="!mt-6 !h-[50px] !w-full text-[15px]"
          >
            {isSubmitting ? t("errors.resetting") : t("errors.resetBtn")}
          </ActionButton>
        </form>
      )}
    </AuthLayout>
  );
}
