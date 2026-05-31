import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Phone, Calendar, Users } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useRegister } from "../hooks/useRegister";
import { GoogleLoginButton } from "../components/GoogleLoginButton";
import { FacebookLoginButton } from "../components/FacebookLoginButton";

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    gender: "",
    dateOfBirth: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tách logic ra custom hook
  const { handleRegisterSubmit, isSubmitting, serverErrors } = useRegister();

  // Đồng bộ lỗi từ server vào state lỗi của form
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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match!" }));
      return;
    }

    const { confirmPassword, ...payload } = formData;
    await handleRegisterSubmit({ ...payload, dateOfBirth: payload.dateOfBirth || null });
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-900">
      {/* Cột trái: Hình ảnh (Ẩn trên mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden">
        <img
          src="https://picsum.photos/seed/stayhub-register/1000/1500"
          alt="Travel adventure"
          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

        <div className="relative z-10 flex h-full w-full flex-col justify-between p-12 lg:p-16">
          <Link
            to="/"
            className="flex w-max items-center gap-2 outline-none !no-underline"
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#0068E0] font-black text-xl">
              S
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              StayHub
            </span>
          </Link>

          <div className="max-w-md">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Start your journey with us.
            </h1>
            <p className="text-lg text-slate-300">
              Create an account to discover incredible tours, manage your bookings easily, and join our global community of travelers.
            </p>
          </div>
        </div>
      </div>

      {/* Cột phải: Form Đăng ký */}
      <div className="relative flex h-screen w-full flex-col overflow-y-auto p-6 sm:p-12 md:p-16 lg:w-1/2 lg:p-24">
        {/* Nút Back về Home cho Mobile */}
        <Link
          to="/"
          className="absolute left-6 top-6 flex items-center gap-2 outline-none lg:hidden !no-underline"
        >
          <div className="w-8 h-8 rounded-lg bg-[#05073C] flex items-center justify-center text-white font-black text-base">
            S
          </div>
          <span className="text-xl font-extrabold tracking-tight text-[#05073C]">
            StayHub
          </span>
        </Link>

        <div className="m-auto w-full max-w-md pb-10 pt-16 lg:pt-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#05073C] mb-2">
              Create an account
            </h2>
            <p className="text-slate-500">
              Fill in the details below to join StayHub.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`h-[50px] w-full rounded-xl border bg-slate-50 pl-12 pr-4 text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#0068E0]/10 ${errors.fullName ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-[#0068E0]"}`}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              {errors.fullName && <span className="mt-1.5 text-xs font-medium text-rose-500">{errors.fullName}</span>}
            </div>

            {/* Email Field */}
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
                  onChange={handleChange}
                  className={`h-[50px] w-full rounded-xl border bg-slate-50 pl-12 pr-4 text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#0068E0]/10 ${errors.email ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-[#0068E0]"}`}
                  placeholder="name@example.com"
                  required
                />
              </div>
              {errors.email && <span className="mt-1.5 text-xs font-medium text-rose-500">{errors.email}</span>}
            </div>

            {/* Phone Number Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`h-[50px] w-full rounded-xl border bg-slate-50 pl-12 pr-4 text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#0068E0]/10 ${errors.phoneNumber ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-[#0068E0]"}`}
                  placeholder="e.g. 0123456789"
                  required
                />
              </div>
              {errors.phoneNumber && <span className="mt-1.5 text-xs font-medium text-rose-500">{errors.phoneNumber}</span>}
            </div>

            {/* Gender & Date of Birth */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Gender</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`h-[50px] w-full rounded-xl border bg-slate-50 pl-12 pr-4 text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#0068E0]/10 ${errors.gender ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-[#0068E0]"}`}
                    required
                  >
                    <option value="" disabled>Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {errors.gender && <span className="mt-1.5 text-xs font-medium text-rose-500">{errors.gender}</span>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={`h-[50px] w-full rounded-xl border bg-slate-50 pl-12 pr-4 text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#0068E0]/10 ${errors.dateOfBirth ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-[#0068E0]"}`}
                    required
                  />
                </div>
                {errors.dateOfBirth && <span className="mt-1.5 text-xs font-medium text-rose-500">{errors.dateOfBirth}</span>}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`h-[50px] w-full rounded-xl border bg-slate-50 pl-12 pr-12 text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#0068E0]/10 ${errors.password ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-[#0068E0]"}`}
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-slate-400 outline-none transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && <span className="mt-1.5 text-xs font-medium text-rose-500">{errors.password}</span>}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`h-[50px] w-full rounded-xl border bg-slate-50 pl-12 pr-12 text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#0068E0]/10 ${errors.confirmPassword ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-[#0068E0]"}`}
                  placeholder="Repeat your password"
                  required
                />
              </div>
              {errors.confirmPassword && <span className="mt-1.5 text-xs font-medium text-rose-500">{errors.confirmPassword}</span>}
            </div>

            {/* Terms and Conditions */}
            <div className="pt-2">
              <label className="group flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-[#0068E0] focus:ring-[#0068E0]"
                  required
                />
                <span className="text-sm font-medium text-slate-600 transition-colors group-hover:text-slate-900">
                  I agree to the <Link to="/terms" className="text-[#0068E0] hover:underline !no-underline">Terms of Service</Link> and <Link to="/privacy" className="text-[#0068E0] hover:underline !no-underline">Privacy Policy</Link>.
                </span>
              </label>
            </div>

            {/* Register Button */}
            <ActionButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="group !mt-6 !h-[50px] !w-full gap-2 text-[15px]"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </ActionButton>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-sm font-medium text-slate-400">
              Or register with
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <div className="w-full flex items-start justify-center">
              <GoogleLoginButton />
            </div>
            <div className="w-full flex items-start justify-center">
              <FacebookLoginButton />
            </div>
          </div>

          {/* Login Link */}
          <p className="mt-10 pb-10 text-center text-sm font-medium text-slate-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-[#0068E0] transition-colors hover:text-[#0058D0] !no-underline"
            >
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}