import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useLogin } from "../hooks/useLogin";
import { SocialAuthButtons } from "../components/SocialAuthButtons";
import { AuthLayout } from "../components/AuthLayout";
import { AuthFormField } from "../components/AuthFormField";

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
    <AuthLayout
      title="Welcome back"
      subtitle="Please enter your details to sign in."
      heroTitle="Discover your next great adventure."
      heroSubtitle="Log in to unlock exclusive deals, manage your bookings, and explore millions of experiences worldwide."
      imageSeed="stayhub-travel"
      footer={
        <p className="mt-10 text-center text-sm font-medium text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-bold text-brand transition-colors hover:text-brand-hover !no-underline"
          >
            Sign up for free
          </Link>
        </p>
      }
    >
      <form onSubmit={handleLogin} className="space-y-6">
        {serverError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
            {serverError}
          </div>
        )}

        <AuthFormField
          label="Email"
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />

        <AuthFormField
          label="Password"
          type={showPassword ? "text" : "password"}
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          showToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          required
        />

        <div className="flex items-center justify-between pt-1">
          <label className="group flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand focus:ring-brand"
            />
            <span className="text-sm font-medium text-slate-600 transition-colors group-hover:text-slate-900">
              Remember me
            </span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-brand transition-colors hover:text-brand-hover !no-underline"
          >
            Forgot password?
          </Link>
        </div>

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

      <SocialAuthButtons dividerLabel="Or continue with" />
    </AuthLayout>
  );
}
