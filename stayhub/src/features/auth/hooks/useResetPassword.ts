import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "../services/auth.service";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";

export const useResetPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, any>>({});
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const handleResetPasswordSubmit = async (payload: { email: string; code: string; newPassword: string }) => {
    setServerErrors({});
    setIsSubmitting(true);

    try {
      const res = await resetPassword(payload);
      success(res?.message || "Password has been reset successfully.");
      navigate(PATH.PUBLIC.LOGIN);
      return true;
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        setServerErrors(err.response.data.errors);
        showError("Please check your inputs for validation errors.");
      } else {
        const errorMessage = err.response?.data?.message || err.message || "Failed to reset password.";
        showError(errorMessage);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleResetPasswordSubmit, isSubmitting, serverErrors };
};