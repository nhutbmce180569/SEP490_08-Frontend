import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useLogin } from "../hooks/useLogin";
import { SocialAuthButtons } from "../components/SocialAuthButtons";
import { AuthLayout } from "../components/AuthLayout";
import { AuthFormField } from "../components/AuthFormField";
import { useTranslation } from "../../../contexts/LocaleContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { PATH } from "../../../config/routes/route";
import { getDashboardPath } from "../../../utils/jwt";

export default function Login() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(getDashboardPath(user.roles), { replace: true });
    }
  }, [user, navigate]);


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
      title={t("auth.welcomeBack")}
      subtitle={t("auth.signInSubtitle")}
      heroTitle={t("auth.heroDiscover")}
      heroSubtitle={t("auth.heroLoginDesc")}
      imageSeed="stayhub-travel"
      footer={
        <p className="mt-5 text-center text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
          {t("auth.noAccount")}{" "}
          <Link
            to="/register"
            className="font-bold text-brand transition-colors hover:text-brand-hover !no-underline"
          >
            {t("auth.signUpFree")}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleLogin} className="space-y-5">
        {serverError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm font-medium text-rose-600">
            {serverError}
          </div>
        )}

        <AuthFormField
          label={t("auth.email")}
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.email")}
          required
        />

        <AuthFormField
          label={t("auth.password")}
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

        <div className="flex items-center justify-end pt-0.5">
          <Link
            to="/forgot-password"
            className="text-xs sm:text-sm font-semibold text-brand transition-colors hover:text-brand-hover !no-underline"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>

        <ActionButton
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="group !mt-5 !h-[50px] !w-full gap-2 text-[15px] font-bold shadow-lg"
        >
          {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </ActionButton>
      </form>

      <SocialAuthButtons />
    </AuthLayout>
  );
}
