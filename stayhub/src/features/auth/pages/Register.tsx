import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone, KeyRound } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useRegister } from "../hooks/useRegister";
import { sendRegisterOtp } from "../services/auth.service";
import { SocialAuthButtons } from "../components/SocialAuthButtons";
import { AuthLayout } from "../components/AuthLayout";
import { AuthFormField, authInputClass } from "../components/AuthFormField";
import { PATH } from "../../../config/routes/route";
import { useTranslation } from "../../../contexts/LocaleContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { getDashboardPath } from "../../../utils/jwt";
import { useToast } from "../../../contexts/ToastContext";
import {
  getOtpCooldownStorageKey,
  usePersistentCountdown,
} from "../hooks/usePersistentCountdown";

const OTP_COOLDOWN_SECONDS = 60;

export default function Register() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (user) {
      navigate(getDashboardPath(user.roles), { replace: true });
    }
  }, [user, navigate]);

  const [step, setStep] = useState<"INFO" | "VERIFY_OTP">("INFO");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    otpCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { handleRegisterSubmit, isSubmitting, serverErrors } = useRegister();
  const {
    remainingSeconds: countdown,
    startCountdown,
  } = usePersistentCountdown(
    getOtpCooldownStorageKey(`reg_${formData.email}`),
    OTP_COOLDOWN_SECONDS,
  );

  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      const normalizedErrors: Record<string, string> = {};
      Object.entries(serverErrors).forEach(([key, val]) => {
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        normalizedErrors[camelKey] = Array.isArray(val) ? val[0] : String(val);
      });
      setErrors((prev) => ({ ...prev, ...normalizedErrors }));
    }
  }, [serverErrors]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "phoneNumber" && value.length > 15) {
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const fullNameRegex = /^[a-zA-Z0-9\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]+$/;
    if (!fullNameRegex.test(formData.fullName.trim())) {
      setErrors((prev) => ({ ...prev, fullName: t("errors.fullNameNoSpecialChars") }));
      return;
    }

    if (formData.phoneNumber.length > 15) {
      setErrors((prev) => ({ ...prev, phoneNumber: t("errors.phoneMax15Chars") }));
      return;
    }

    if (!/^[0-9+()\- ]{8,15}$/.test(formData.phoneNumber)) {
      setErrors((prev) => ({ ...prev, phoneNumber: t("errors.phoneInvalid") }));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: t("errors.passwordsNoMatch") }));
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await sendRegisterOtp({
        email: formData.email,
        fullName: formData.fullName,
      });
      success(res?.message || t("errors.verifyRegisterOtpTitle"));
      startCountdown();
      setStep("VERIFY_OTP");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || t("errors.failedToSendOtp");
      showError(msg);
      if (err.response?.status === 400 && err.response.data?.errors) {
        const normalizedErrors: Record<string, string> = {};
        Object.entries(err.response.data.errors).forEach(([key, val]) => {
          const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
          normalizedErrors[camelKey] = Array.isArray(val) ? (val as any)[0] : String(val);
        });
        setErrors((prev) => ({ ...prev, ...normalizedErrors }));
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendCode = async () => {
    if (formData.email && formData.fullName) {
      setIsSendingOtp(true);
      try {
        const res = await sendRegisterOtp({
          email: formData.email,
          fullName: formData.fullName,
        });
        success(res?.message || t("errors.otpResent"));
        startCountdown();
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || t("errors.failedToResendOtp");
        showError(msg);
      } finally {
        setIsSendingOtp(false);
      }
    }
  };

  const handleCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.otpCode) return;

    const { confirmPassword, ...payload } = formData;
    await handleRegisterSubmit({
      ...payload,
      otpCode: formData.otpCode,
    });
  };

  return (
    <AuthLayout
      scrollable
      title={
        step === "INFO"
          ? t("errors.createAccountTitle")
          : t("errors.verifyRegisterOtpTitle")
      }
      subtitle={
        step === "INFO"
          ? t("errors.createAccountSubtitle")
          : t("errors.verifyRegisterOtpSubtitle")
      }
      heroTitle={t("errors.heroRegisterTitle")}
      heroSubtitle={t("errors.heroRegisterDesc")}
      imageSeed="stayhub-register"
      footer={
        <p className="mt-10 pb-2 text-center text-sm font-medium text-slate-600">
          {t("auth.haveAccount")}{" "}
          <Link
            to="/login"
            className="font-bold text-brand transition-colors hover:text-brand-hover !no-underline"
          >
            {t("errors.logInHere")}
          </Link>
        </p>
      }
    >
      {step === "INFO" ? (
        <>
          <form onSubmit={handleSendOtp} className="space-y-5">
            <AuthFormField
              label={t("auth.fullName")}
              name="fullName"
              type="text"
              icon={User}
              value={formData.fullName}
              onChange={handleChange}
              placeholder={t("errors.fullNamePlaceholder")}
              error={errors.fullName}
              maxLength={100}
              required
            />

            <AuthFormField
              label={t("errors.emailAddress")}
              name="email"
              type="email"
              icon={Mail}
              value={formData.email}
              onChange={handleChange}
              placeholder={t("errors.emailPlaceholder")}
              error={errors.email}
              maxLength={255}
              required
            />

            <AuthFormField
              label={t("auth.phoneNumber")}
              name="phoneNumber"
              type="tel"
              icon={Phone}
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder={t("errors.phonePlaceholder")}
              error={errors.phoneNumber}
              maxLength={15}
              required
            />

            <AuthFormField
              label={t("auth.password")}
              name="password"
              type={showPassword ? "text" : "password"}
              icon={Lock}
              value={formData.password}
              onChange={handleChange}
              placeholder={t("errors.passwordPlaceholder")}
              error={errors.password}
              maxLength={100}
              showToggle
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              required
            />

            <AuthFormField
              label={t("errors.confirmPasswordLabel")}
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              icon={Lock}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={t("errors.confirmPasswordPlaceholder")}
              error={errors.confirmPassword}
              maxLength={100}
              required
            />

            <div className="pt-2">
              <label className="group flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-brand focus:ring-brand"
                  required
                />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors group-hover:text-slate-900 dark:group-hover:text-slate-200">
                  {t("errors.agreeTerms")}{" "}
                  <Link
                    to={PATH.PUBLIC.TERMS}
                    state={{ from: PATH.PUBLIC.REGISTER }}
                    className="text-brand !no-underline hover:underline"
                  >
                    {t("common.termsOfService")}
                  </Link>{" "}
                  {t("errors.and")}{" "}
                  <Link
                    to={PATH.PUBLIC.PRIVACY}
                    state={{ from: PATH.PUBLIC.REGISTER }}
                    className="text-brand !no-underline hover:underline"
                  >
                    {t("common.privacyPolicy")}
                  </Link>
                  .
                </span>
              </label>
            </div>

            <ActionButton
              type="submit"
              variant="primary"
              disabled={isSendingOtp || isSubmitting}
              className="!mt-6 !h-[50px] !w-full text-[15px]"
            >
              {isSendingOtp ? t("errors.sendingOtp") : t("errors.createAccountBtn")}
            </ActionButton>
          </form>

          <SocialAuthButtons dividerLabel={t("common.orRegisterWith")} />
        </>
      ) : (
        <form onSubmit={handleCompleteRegister} className="space-y-5">
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
            name="otpCode"
            type="text"
            icon={KeyRound}
            value={formData.otpCode}
            onChange={handleChange}
            placeholder={t("auth.enterResetCode")}
            error={errors.otpCode || errors.code}
            labelExtra={
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isSendingOtp || isSubmitting || countdown > 0}
                className="text-xs font-bold text-brand outline-none transition-colors hover:text-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSendingOtp
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
            disabled={isSubmitting || isSendingOtp}
            className="!mt-6 !h-[50px] !w-full text-[15px]"
          >
            {isSubmitting
              ? t("errors.completingRegistration")
              : t("errors.completeRegistrationBtn")}
          </ActionButton>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setStep("INFO")}
              className="text-sm font-semibold text-slate-500 transition-colors hover:text-brand outline-none"
            >
              &larr; {t("errors.backToRegister")}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
