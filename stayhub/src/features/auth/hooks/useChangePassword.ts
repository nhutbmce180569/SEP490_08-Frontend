import { useContext, useState } from "react";
import axios from "axios";
import { changePassword } from "../services/auth.service";
import type { ChangePasswordDTO } from "../types/auth";
import { useToast } from "../../../contexts/ToastContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { useTranslation } from "../../../contexts/LocaleContext";

export const useChangePassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { success, error: showError } = useToast();
  const { logout } = useContext(AuthContext);
  const { t } = useTranslation();

  const handleChangePasswordSubmit = async (payload: ChangePasswordDTO) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await changePassword(payload);
      const authData = res.data;

      success(t("auth.passwordChangedSuccess", { defaultValue: "Password changed successfully! Please login again." }));
      setTimeout(() => {
        logout();
      }, 1500);

      return true;
    } catch (err: unknown) {
      console.error("Error processing Change Password:", err);
      const responseData = axios.isAxiosError(err) ? err.response?.data : undefined;
      const errorMessage =
        responseData?.message ||
        responseData?.title ||
        (err instanceof Error ? err.message : undefined) ||
        t("errors.changePasswordFailed", { defaultValue: "Failed to change password. Please check your old password." });
      setServerError(errorMessage);
      showError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleChangePasswordSubmit, isSubmitting, serverError };
};
