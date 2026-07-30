import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { googleLogin } from "../services/auth.service";
import type { GoogleLoginDTO } from "../types/auth";
import { PATH } from "../../../config/routes/route";
import { AuthContext } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { decodeJWT, normalizeRoles, getDashboardPath } from "../../../utils/jwt";
import { useTranslation } from "../../../contexts/LocaleContext";

export interface PendingGoogleAuth {
  idToken: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

export const useGoogleLogin = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState<PendingGoogleAuth | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: contextLogin } = useContext(AuthContext);
  const { success, error: showError, info: showInfo } = useToast();

  const handleGoogleLoginSubmit = async (payload: GoogleLoginDTO) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Gọi API Google Login thông qua service
      const res: any = await googleLogin(payload);

      console.log("=== DEBUG API GOOGLE LOGIN RESPONSE ===", res);

      // Vì Controller C# trả về: Ok(new { message = "...", data = response })
      // hoặc trực tiếp response
      const responseData = res.data || res;

      // KIỂM TRA NẾU LÀ TÀI KHOẢN MỚI CẦN BỔ SUNG SỐ ĐIỆN THOẠI
      if (res.requirePhoneNumber || responseData?.requirePhoneNumber) {
        setPendingGoogleAuth({
          idToken: payload.idToken,
          email: responseData?.user?.email || "",
          fullName: responseData?.user?.fullName || "",
          avatarUrl: responseData?.user?.avatarUrl || "",
        });
        return;
      }

      const token = responseData.token || responseData.accessToken;
      const refreshToken = responseData.refreshToken || responseData.RefreshToken;
      let user = responseData.user || responseData.User || {};

      // Bắt buộc phải có cả 2 token
      if (!token || !refreshToken) {
        throw new Error("Google login successful but Token or RefreshToken is missing. Please check the Console!");
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
            provider: decodedClaims.Provider || user?.provider,
            securityStamp: decodedClaims.SecurityStamp || user?.securityStamp,
            jti: decodedClaims.jti,
            rawClaims: decodedClaims,
          };
        }
      }

      if (token && refreshToken && user) {
        contextLogin(token, refreshToken, user);
        success("Google login successful!");
      }

      setPendingGoogleAuth(null);
      navigate(getDashboardPath(user?.roles));
    } catch (err: any) {
      console.error("Error processing Google Login:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        err.message ||
        "Google login failed. Please try again.";
      setServerError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPhoneNumber = async (phoneNumber: string) => {
    if (!pendingGoogleAuth) return;
    await handleGoogleLoginSubmit({
      idToken: pendingGoogleAuth.idToken,
      phoneNumber: phoneNumber,
    });
  };

  const handleCancelPhoneInput = () => {
    setPendingGoogleAuth(null);
    showInfo(t("errors.googleRegisterCanceled") || "Đã hủy đăng ký tài khoản mới bằng Google.");
    if (location.pathname !== PATH.PUBLIC.LOGIN && location.pathname !== "/login") {
      navigate(PATH.PUBLIC.LOGIN);
    }
  };

  return {
    handleGoogleLoginSubmit,
    handleConfirmPhoneNumber,
    handleCancelPhoneInput,
    pendingGoogleAuth,
    isSubmitting,
    serverError,
  };
};