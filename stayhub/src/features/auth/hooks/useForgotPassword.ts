import { useState } from "react";
import axios from "axios";
import { forgotPassword } from "../services/auth.service";
import { useToast } from "../../../contexts/ToastContext";

export type ForgotPasswordSubmitResult = {
  success: boolean;
  retryAfterSeconds?: number;
};

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
      return { success: true } satisfies ForgotPasswordSubmitResult;
    } catch (err: unknown) {
      console.error("Error processing Forgot Password:", err);
      const responseData = axios.isAxiosError(err) ? err.response?.data : undefined;
      const responseHeaders = axios.isAxiosError(err) ? err.response?.headers : undefined;
      const errorMessage =
        responseData?.message ||
        responseData?.title ||
        (err instanceof Error ? err.message : "Failed to process request.");
      const retryAfterSeconds = Number(
        responseData?.retryAfterSeconds ??
        responseHeaders?.["retry-after"],
      );
      setServerError(errorMessage);
      showError(errorMessage);
      return {
        success: false,
        retryAfterSeconds: Number.isFinite(retryAfterSeconds)
          ? retryAfterSeconds
          : undefined,
      } satisfies ForgotPasswordSubmitResult;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleForgotPasswordSubmit, isSubmitting, serverError };
};
