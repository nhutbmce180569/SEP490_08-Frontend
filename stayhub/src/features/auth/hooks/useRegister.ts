import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/auth.service";
import type { RegisterDTO } from "../types/auth";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { useTranslation } from "../../../contexts/LocaleContext";

export const useRegister = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, any>>({});
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { t } = useTranslation();

  const handleRegisterSubmit = async (payload: RegisterDTO) => {
    setServerErrors({});
    setIsSubmitting(true);

    try {
      const res = await register(payload);
      success(res?.message || t("errors.registerSuccess") || "Registration successful!");
      navigate(PATH.PUBLIC.LOGIN);
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        const translatedErrors: Record<string, string> = {};
        Object.entries(err.response.data.errors).forEach(([key, val]) => {
          const firstErrorMsg = Array.isArray(val) ? val[0] : String(val);
          if (firstErrorMsg === "FullNameCannotContainSpecialCharacters") {
            translatedErrors[key] = t("errors.fullNameNoSpecialChars");
          } else {
            translatedErrors[key] = firstErrorMsg;
          }
        });
        setServerErrors(translatedErrors);
        showError(t("errors.checkInputs") || "Please check your inputs for validation errors.");
      } else {
        const msg = err.response?.data?.message;
        if (msg === "PhoneNumberExists") {
          showError(t("errors.phoneNumberExists"));
        } else {
          showError(msg || err.message || t("errors.registerFailed") || "Failed to register account.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleRegisterSubmit, isSubmitting, serverErrors };
};