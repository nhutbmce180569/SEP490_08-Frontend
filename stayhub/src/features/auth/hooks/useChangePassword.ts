import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { changePassword } from "../services/auth.service";
import type { ChangePasswordDTO } from "../types/auth";
import { useToast } from "../../../contexts/ToastContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { PATH } from "../../../config/routes/route";
import { normalizeRoles } from "../../../utils/jwt";

export const useChangePassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { success, error: showError } = useToast();
  const { login: contextLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChangePasswordSubmit = async (payload: ChangePasswordDTO) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await changePassword(payload);
      const authData = res.data;

      contextLogin(authData.token, authData.refreshToken, authData.user);
      success(res?.message || "Password changed successfully!");

      const roles = normalizeRoles(authData.user.roles);
      if (roles.includes("ADMIN")) {
        navigate(PATH.ADMIN.DASHBOARD, { replace: true });
      } else if (roles.includes("MANAGER") || roles.includes("OPERATOR")) {
        navigate(PATH.MANAGER.DASHBOARD, { replace: true });
      } else if (roles.includes("STAFF")) {
        navigate(PATH.STAFF.DASHBOARD, { replace: true });
      } else {
        navigate(PATH.PUBLIC.HOME, { replace: true });
      }

      return true;
    } catch (err: unknown) {
      console.error("Error processing Change Password:", err);
      const responseData = axios.isAxiosError(err) ? err.response?.data : undefined;
      const errorMessage =
        responseData?.message ||
        responseData?.title ||
        (err instanceof Error ? err.message : undefined) ||
        "Failed to change password. Please check your old password.";
      setServerError(errorMessage);
      showError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleChangePasswordSubmit, isSubmitting, serverError };
};
