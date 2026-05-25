import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useLogin } from "../hooks/useLogin";
import { GoogleLoginButton } from "../components/GoogleLoginButton";
import { FacebookLoginButton } from "../components/FacebookLoginButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { handleLoginSubmit, isSubmitting, serverError } = useLogin();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLoginSubmit({ email, password });
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-900">
      {/* Cột trái: Hình ảnh (Ẩn trên mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden">
        <img
          src="https://picsum.photos/seed/stayhub-travel/1000/1500"
          alt="Travel destination"
          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

        <div className="relative z-10 flex h-full w-full flex-col justify-between p-12 lg:p-16">
          <Link
            to="/"
            className="flex w-max items-center gap-2 outline-none !no-underline"
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#EB662B] font-black text-xl">
              S
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              StayHub
            </span>
          </Link>

          <div className="max-w-md">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Discover your next great adventure.
            </h1>
            <p className="text-lg text-slate-300">
              Log in to unlock exclusive deals, manage your bookings, and
              explore millions of experiences worldwide.
            </p>
          </div>
        </div>
      </div>

      {/* Cột phải: Form đăng nhập */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-24 relative">
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

        <div className="w-full max-w-md mt-10 lg:mt-0">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-[#05073C] mb-2">
              Welcome back
            </h2>
            <p className="text-slate-500">
              Please enter your details to sign in.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Hiển thị lỗi từ server nếu đăng nhập thất bại */}
            {serverError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
                {serverError}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-[#EB662B] focus:bg-white focus:ring-4 focus:ring-[#EB662B]/10"
                  placeholder="Enter your email"
                  required
                />
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-slate-900 outline-none transition-all focus:border-[#EB662B] focus:bg-white focus:ring-4 focus:ring-[#EB662B]/10"
                  placeholder="••••••••"
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
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="group flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#EB662B] focus:ring-[#EB662B]"
                />
                <span className="text-sm font-medium text-slate-600 transition-colors group-hover:text-slate-900">
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-[#EB662B] transition-colors hover:text-[#d55821] !no-underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <ActionButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="group !mt-6 !h-[50px] !w-full gap-2 text-[15px]"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </ActionButton>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-sm font-medium text-slate-400">
              Or continue with
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

          {/* Sign Up Link */}
          <p className="mt-10 text-center text-sm font-medium text-slate-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-[#EB662B] transition-colors hover:text-[#d55821] !no-underline"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
