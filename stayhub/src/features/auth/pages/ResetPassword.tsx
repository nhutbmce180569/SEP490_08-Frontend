import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, KeyRound, Eye, EyeOff, ArrowRight } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useResetPassword } from "../hooks/useResetPassword";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { PATH } from "../../../config/routes/route";

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
  const [countdown, setCountdown] = useState(60); // Bắt đầu đếm ngược 60s ngay khi vào trang

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
    // Nếu không có email (truy cập trực tiếp), bắt buộc quay lại trang Forgot Password
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
        setCountdown(60); // Reset lại đếm ngược nếu gửi lại thành công
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="mb-8 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-[#05073C] flex items-center justify-center text-white font-black text-xl">
          S
        </div>
        <span className="text-2xl font-extrabold tracking-tight text-[#05073C]">
          StayHub
        </span>
      </div>
      
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#05073C] mb-2">
            Reset Password
          </h2>
          <p className="text-slate-500 text-sm">
            Enter your email, the verification code, and your new password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className="h-[50px] w-full rounded-xl border border-slate-200 bg-slate-100 pl-12 pr-4 text-slate-500 outline-none cursor-not-allowed"
                placeholder="name@example.com"
                required
              />
            </div>
            {errors.email && <span className="mt-1.5 text-xs font-medium text-rose-500">{errors.email}</span>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700">
                Verification Code
              </label>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending || isSubmitting || countdown > 0}
                className="text-xs font-bold text-[#0068E0] hover:text-[#0058D0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none"
              >
                {isResending ? "Resending..." : countdown > 0 ? `Resend Code (${countdown}s)` : "Resend Code"}
              </button>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className={`h-[50px] w-full rounded-xl border bg-slate-50 pl-12 pr-4 text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#0068E0]/10 ${errors.code ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-[#0068E0]"}`}
                placeholder="Enter reset code"
                required
              />
            </div>
            {errors.code && <span className="mt-1.5 text-xs font-medium text-rose-500">{errors.code}</span>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={`h-[50px] w-full rounded-xl border bg-slate-50 pl-12 pr-12 text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#0068E0]/10 ${errors.newPassword ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-[#0068E0]"}`}
                placeholder="Create a new password"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-slate-400 outline-none transition-colors hover:bg-slate-100 hover:text-slate-600">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.newPassword && <span className="mt-1.5 text-xs font-medium text-rose-500">{errors.newPassword}</span>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`h-[50px] w-full rounded-xl border bg-slate-50 pl-12 pr-12 text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#0068E0]/10 ${errors.confirmPassword ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-[#0068E0]"}`}
                placeholder="Repeat your new password"
                required
              />
            </div>
            {errors.confirmPassword && <span className="mt-1.5 text-xs font-medium text-rose-500">{errors.confirmPassword}</span>}
          </div>

          <ActionButton type="submit" variant="primary" disabled={isSubmitting} className="group !mt-6 !h-[50px] !w-full gap-2 text-[15px]">
            {isSubmitting ? "Resetting..." : "Reset Password"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </ActionButton>
        </form>
      </div>

      <div className="mt-8">
        <Link to={PATH.PUBLIC.LOGIN} className="text-sm font-semibold text-slate-500 hover:text-[#0068E0] transition-colors !no-underline">
          &larr; Back to Login
        </Link>
      </div>
    </div>
  );
}