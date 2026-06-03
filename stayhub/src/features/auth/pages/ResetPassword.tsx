import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, KeyRound, ArrowRight } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useResetPassword } from "../hooks/useResetPassword";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { PATH } from "../../../config/routes/route";
import { AuthLayout } from "../components/AuthLayout";
import { AuthFormField } from "../components/AuthFormField";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefilledEmail = location.state?.email || "";

  const [formData, setFormData] = useState({
    email: prefilledEmail,
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(60);

  const { handleResetPasswordSubmit, isSubmitting, serverErrors } = useResetPassword();
  const { handleForgotPasswordSubmit, isSubmitting: isResending } = useForgotPassword();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

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
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match!" }));
      return;
    }

    const { confirmPassword, ...payload } = formData;
    await handleResetPasswordSubmit(payload);
  };

  const handleResendCode = async () => {
    if (formData.email) {
      const isSuccess = await handleForgotPasswordSubmit({ email: formData.email });
      if (isSuccess) {
        setCountdown(60);
      }
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter the verification code sent to your email and choose a new password."
      heroTitle="Almost there."
      heroSubtitle="Verify your identity and set a new password to regain access to your account."
      imageSeed="stayhub-reset"
      footer={
        <div className="mt-8 text-center">
          <Link
            to={PATH.PUBLIC.LOGIN}
            className="text-sm font-semibold text-slate-500 transition-colors hover:text-brand !no-underline"
          >
            &larr; Back to Login
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthFormField
          label="Email Address"
          name="email"
          type="email"
          icon={Mail}
          value={formData.email}
          readOnly
          placeholder="name@example.com"
          error={errors.email}
          required
        />

        <AuthFormField
          label="Verification Code"
          name="code"
          type="text"
          icon={KeyRound}
          value={formData.code}
          onChange={handleChange}
          placeholder="Enter reset code"
          error={errors.code}
          labelExtra={
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending || isSubmitting || countdown > 0}
              className="text-xs font-bold text-brand outline-none transition-colors hover:text-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isResending
                ? "Resending..."
                : countdown > 0
                  ? `Resend Code (${countdown}s)`
                  : "Resend Code"}
            </button>
          }
          required
        />

        <AuthFormField
          label="New Password"
          name="newPassword"
          type={showPassword ? "text" : "password"}
          icon={Lock}
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="Create a new password"
          error={errors.newPassword}
          showToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          required
        />

        <AuthFormField
          label="Confirm New Password"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          icon={Lock}
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Repeat your new password"
          error={errors.confirmPassword}
          required
        />

        <ActionButton
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="group !mt-6 !h-[50px] !w-full gap-2 text-[15px]"
        >
          {isSubmitting ? "Resetting..." : "Reset Password"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </ActionButton>
      </form>
    </AuthLayout>
  );
}
