import { useState } from "react";
import { changePassword } from "../services/auth.service";
import type { ChangePasswordDTO } from "../types/auth";
import { useToast } from "../../../contexts/ToastContext";

export const useChangePassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const handleChangePasswordSubmit = async (payload: ChangePasswordDTO) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await changePassword(payload);
      success(res?.message || "Password changed successfully!");
      return true; // Trả về true để component biết là thành công (ví dụ để đóng modal hoặc reset form)
    } catch (err: any) {
      console.error("Error processing Change Password:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || "Failed to change password. Please check your old password.";
      setServerError(errorMessage);
      showError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleChangePasswordSubmit, isSubmitting, serverError };
};