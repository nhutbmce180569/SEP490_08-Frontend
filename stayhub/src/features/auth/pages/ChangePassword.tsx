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

export default function ChangePassword() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
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
              to={PATH.PUBLIC.HOME}
              className="text-sm font-semibold text-slate-500 transition-colors hover:text-brand !no-underline"
            >
              &larr; {t("auth.backToHome")}
            </Link>
          </div>
        )
      }
    >
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
          error={errors.confirmPassword}
          required
        />

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
    </AuthLayout>
  );
}
