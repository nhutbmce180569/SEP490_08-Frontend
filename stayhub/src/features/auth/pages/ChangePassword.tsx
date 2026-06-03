import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useChangePassword } from "../hooks/useChangePassword";
import { PATH } from "../../../config/routes/route";
import { AuthLayout } from "../components/AuthLayout";
import { AuthFormField } from "../components/AuthFormField";

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
    const isSuccess = await handleChangePasswordSubmit(payload);

    if (isSuccess) {
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  return (
    <AuthLayout
      title="Change Password"
      subtitle="Ensure your account is using a strong password to stay secure."
      heroTitle="Keep your account safe."
      heroSubtitle="Update your password regularly to protect your bookings and personal information."
      imageSeed="stayhub-security"
      footer={
        <div className="mt-8 text-center">
          <Link
            to={PATH.PUBLIC.HOME}
            className="text-sm font-semibold text-slate-500 transition-colors hover:text-brand !no-underline"
          >
            &larr; Back to Home
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthFormField
          label="Old Password"
          name="oldPassword"
          type={showPassword ? "text" : "password"}
          icon={Lock}
          value={formData.oldPassword}
          onChange={handleChange}
          placeholder="Enter current password"
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
          {isSubmitting ? "Changing..." : "Change Password"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </ActionButton>
      </form>
    </AuthLayout>
  );
}
