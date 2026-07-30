import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useChangePassword } from "../hooks/useChangePassword";
import { PATH } from "../../../config/routes/route";
import { AuthLayout } from "../components/AuthLayout";
import { AuthFormField } from "../components/AuthFormField";
import { useTranslation } from "../../../contexts/LocaleContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { getDashboardPath } from "../../../utils/jwt";

export default function ChangePassword() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const isSocialLogin = Boolean(user?.provider && user.provider !== "Local");
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { handleChangePasswordSubmit, isSubmitting, serverError } = useChangePassword();

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

    const isSuccess = await handleChangePasswordSubmit({
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword,
    });

    if (isSuccess) {
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  return (
    <AuthLayout
      title={t("auth.changePasswordTitle")}
      subtitle={t("auth.changePasswordSubtitleLong")}
      heroTitle={t("auth.changePasswordHeroTitle")}
      heroSubtitle={t("auth.changePasswordHeroDesc")}
      imageSeed="stayhub-security"
      footer={
        user?.requirePasswordChange ? undefined : (
          <div className="mt-8 text-center">
            <Link
              to={getDashboardPath(user?.roles || [])}
              className="text-sm font-semibold text-slate-500 transition-colors hover:text-brand !no-underline"
            >
              &larr; {t("auth.backToDashboard", { defaultValue: "Back to Dashboard" })}
            </Link>
          </div>
        )
      }
    >
      {isSocialLogin ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-center text-amber-900 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200 space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">
            {user?.provider === "Google" ? "Tài khoản Google" : "Tài khoản Mạng xã hội"}
          </h3>
          <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
            {t("errors.socialAccountCannotChangePassword", {
              defaultValue:
                "Tài khoản này đăng nhập bằng Google. Hệ thống không yêu cầu mật khẩu riêng và không hỗ trợ đổi mật khẩu tại đây. Vui lòng sử dụng tài khoản Google trực tiếp khi đăng nhập.",
            })}
          </p>
          <div className="pt-2">
            <Link
              to={getDashboardPath(user?.roles || [])}
              className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-600 !no-underline"
            >
              &larr; {t("auth.backToDashboard", { defaultValue: "Back to Dashboard" })}
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {user?.requirePasswordChange && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
              {t("auth.passwordChangeRequired")}
            </div>
          )}
          {serverError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
              {serverError}
            </div>
          )}
          <AuthFormField
            label={t("auth.oldPassword")}
            name="oldPassword"
            type={showPassword ? "text" : "password"}
            icon={Lock}
            value={formData.oldPassword}
            onChange={handleChange}
            placeholder={t("auth.oldPasswordPlaceholder")}
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
            required
          />
          {errors.confirmPassword && (
            <p className="text-sm text-rose-600">{errors.confirmPassword}</p>
          )}

          <ActionButton
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="group !mt-6 !h-[50px] !w-full gap-2 text-[15px]"
          >
            {isSubmitting ? t("errors.changingPassword") : t("errors.changePasswordBtn")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </ActionButton>
        </form>
      )}
    </AuthLayout>
  );
}
