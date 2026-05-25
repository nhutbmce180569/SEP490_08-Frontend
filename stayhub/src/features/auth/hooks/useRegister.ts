import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/auth.service";
import type { RegisterDTO } from "../types/auth";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
export const useRegister = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, any>>({});
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const handleRegisterSubmit = async (payload: RegisterDTO) => {
    setServerErrors({});
    setIsSubmitting(true);

    try {
      const res = await register(payload);
      success(res?.message || "Registration successful!");
      // Đăng ký thành công thì chuyển hướng về trang Login
      navigate(PATH.PUBLIC.LOGIN);
    } catch (err: any) {
      // Xử lý lỗi validation (400) hoặc lỗi conflict (409)
      if (err.response?.status === 400 && err.response.data?.errors) {
        setServerErrors(err.response.data.errors);
        showError("Please check your inputs for validation errors.");
      } else {
        showError(err.response?.data?.message || err.message || "Failed to register account.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleRegisterSubmit, isSubmitting, serverErrors };
};