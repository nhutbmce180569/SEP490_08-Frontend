import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useChangePassword } from "../hooks/useChangePassword";

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { handleChangePasswordSubmit, isSubmitting } = useChangePassword();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Xóa thông báo lỗi khi user bắt đầu gõ lại
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Kiểm tra xác nhận mật khẩu
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match!" }));
      return;
    }

    // 2. Gọi API
    const { confirmPassword, ...payload } = formData;
    const isSuccess = await handleChangePasswordSubmit(payload);
    
    // 3. Xóa form nếu đổi thành công
    if (isSuccess) {
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-white font-black text-xl">
          S
        </div>
        <span className="text-2xl font-extrabold tracking-tight text-navy">
          StayHub
        </span>
      </div>
      
      {/* Form Container */}
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-navy mb-2">
            Change Password
          </h2>
          <p className="text-slate-500 text-sm">
            Ensure your account is using a strong password to stay secure.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Old Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Old Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                className="h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-slate-900 outline-none transition-all focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10"
                placeholder="Enter current password"
                required
              />
            </div>
          </div>

          {/* New Password */}
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
                className="h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-slate-900 outline-none transition-all focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10"
                placeholder="Create a new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-slate-400 outline-none transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
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
                className={`h-[50px] w-full rounded-xl border bg-slate-50 pl-12 pr-12 text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-brand/10 ${errors.confirmPassword ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-brand"}`}
                placeholder="Repeat your new password"
                required
              />
            </div>
            {errors.confirmPassword && <span className="mt-1.5 text-xs font-medium text-rose-500">{errors.confirmPassword}</span>}
          </div>

          <ActionButton
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="group !mt-6 !h-[50px] !w-full gap-2 text-[15px]"
          >
            {isSubmitting ? "Changing..." : "Change Password"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </ActionButton>
        </form>
      </div>

      <div className="mt-8">
        <Link to="/" className="text-sm font-semibold text-slate-500 hover:text-brand transition-colors !no-underline">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}