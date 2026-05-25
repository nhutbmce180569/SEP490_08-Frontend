import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/auth.service";
import type { LoginDTO } from "../types/auth";
import { PATH } from "../../../config/routes/route";
import { AuthContext } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { decodeJWT, normalizeRoles } from "../../../utils/jwt";

export const useLogin = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();
  // Đổi tên hàm login lấy từ Context thành contextLogin để tránh trùng với tên service
  const { login: contextLogin } = useContext(AuthContext);
  const { success, error: showError } = useToast();

  const handleLoginSubmit = async (payload: LoginDTO) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Gọi API Login thông qua service
      const res: any = await login(payload);

      console.log("=== DEBUG API LOGIN RESPONSE ===", res);

      // Trích xuất Token và RefreshToken
      const token = res?.data?.token || res.token || res.Token;
      const refreshToken = res?.data?.refreshToken || res.refreshToken || res.RefreshToken; // <-- LẤY REFRESH TOKEN
      let user = res?.data?.user || res.user || res.User || {};

      if (!token || !refreshToken) {
        throw new Error("Login successful but Token or RefreshToken is missing. Please check the Console!");
      }

      // Lưu token và trích xuất Claims từ token
      if (token) {
        const decodedClaims = decodeJWT(token);
        if (decodedClaims) {
          user = {
            ...user,
            id: decodedClaims.sub || decodedClaims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || user?.id,
            email: decodedClaims.email || decodedClaims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || user?.email,
            fullName: decodedClaims.FullName || user?.fullName,
            roles: decodedClaims.role || decodedClaims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
            phoneNumber: decodedClaims.PhoneNumber || user?.phoneNumber,
            gender: decodedClaims.Gender || user?.gender,
            dateOfBirth: decodedClaims.DateOfBirth || user?.dateOfBirth,
            avatarUrl: decodedClaims.AvatarUrl || user?.avatarUrl,
            jti: decodedClaims.jti,
            rawClaims: decodedClaims 
          };
        }
      }

      // CẬP NHẬT: Gọi contextLogin với 3 tham số (thêm refreshToken)
      if (token && refreshToken && user) {
        contextLogin(token, refreshToken, user);
        success("Welcome back! Login successful.");
      }

      // Chuẩn hóa roles thành mảng để dễ bề kiểm tra
      const upperRoles = normalizeRoles(user?.roles);

      // Chuyển hướng theo mức độ ưu tiên của Role
      if (upperRoles.includes("ADMIN")) {
        navigate(PATH.ADMIN.DASHBOARD);
      } else if (upperRoles.includes("OPERATOR") || upperRoles.includes("STAFF")) {
        navigate(PATH.OPERATOR.DASHBOARD);
      } else {
        navigate(PATH.PUBLIC.HOME);
      }
    } catch (err: any) {
      console.error("Error processing Login:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || "Login failed. Please check your credentials.";
      setServerError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleLoginSubmit, isSubmitting, serverError };
};