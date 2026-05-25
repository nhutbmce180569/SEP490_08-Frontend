import { useState } from "react";
import { forgotPassword } from "../services/auth.service";
import { useToast } from "../../../contexts/ToastContext";

export const useForgotPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const handleForgotPasswordSubmit = async (payload: { email: string }) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await forgotPassword(payload);
      success(res?.message || "If the email is registered, a password reset code has been sent.");
      return true;
    } catch (err: any) {
      console.error("Error processing Forgot Password:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || "Failed to process request.";
      setServerError(errorMessage);
      showError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleForgotPasswordSubmit, isSubmitting, serverError };
};