import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { facebookLogin } from "../services/auth.service";
import type { FacebookLoginDTO } from "../types/auth";
import { PATH } from "../../../config/routes/route";
import { AuthContext } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { decodeJWT, normalizeRoles } from "../../../utils/jwt";

export const useFacebookLogin = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login: contextLogin } = useContext(AuthContext);
  const { success, error: showError } = useToast();

  const handleFacebookLoginSubmit = async (payload: FacebookLoginDTO) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Gọi API Facebook Login thông qua service
      const res: any = await facebookLogin(payload);

      console.log("=== DEBUG API FACEBOOK LOGIN RESPONSE ===", res);

      const responseData = res.data || res;
      const token = responseData.token || responseData.accessToken;
      
      // LẤY THÊM REFRESH TOKEN TỪ RESPONSE
      const refreshToken = responseData.refreshToken || responseData.RefreshToken;
      
      let user = responseData.user || responseData.User || {};

      // Kiểm tra bắt buộc phải có cả 2 token
      if (!token || !refreshToken) {
        throw new Error("Facebook login successful but Token or RefreshToken is missing. Please check the Console!");
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
            jti: decodedClaims.jti,
            rawClaims: decodedClaims
          };
        }
      }

      // CẬP NHẬT: TRUYỀN THÊM REFRESH TOKEN VÀO CONTEXT
      if (token && refreshToken && user) {
        contextLogin(token, refreshToken, user);
        success("Facebook login successful!");
      }

      // Chuẩn hóa roles thành mảng để điều hướng
      const upperRoles = normalizeRoles(user?.roles);

      if (upperRoles.includes("ADMIN")) {
        navigate(PATH.ADMIN.DASHBOARD);
      } else if (upperRoles.includes("OPERATOR") || upperRoles.includes("STAFF")) {
        navigate(PATH.OPERATOR.DASHBOARD);
      } else {
        navigate(PATH.PUBLIC.HOME);
      }
    } catch (err: any) {
      console.error("Error processing Facebook Login:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || "Facebook login failed. Please try again.";
      setServerError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleFacebookLoginSubmit, isSubmitting, serverError };
};