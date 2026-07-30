import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig, type AxiosResponse } from "axios";
import { FULL_API } from "../config/api/api";
import { AUTH_API } from "../config/api/auth.api"; // BỔ SUNG: Nhớ import để gọi API refresh
import { PATH } from "../config/routes/route";
import { decodeJWT } from "./jwt";
import { getStoredLocale } from "../i18n";

const axiosClient = axios.create({
  baseURL: FULL_API,
  headers: {
    "Content-Type": "application/json",
  },
  // timeout: 10000, 
});

// ==========================================
// GLOBAL VARIABLES FOR REFRESH TOKEN QUEUE
// ==========================================
let isRefreshing = false;

type RefreshSubscriber = {
  resolve: (token: string) => void;
  reject: (error: any) => void;
};
let refreshSubscribers: RefreshSubscriber[] = [];

const onRefreshed = (error: any, token: string | null = null) => {
  refreshSubscribers.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token as string);
    }
  });
  refreshSubscribers = []; // Clear the queue after processing
};

// ==========================================
// 1. REQUEST INTERCEPTOR (Auto-attach Token)
// ==========================================
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["X-Language"] = getStoredLocale();
    return config;
  },
  (error: any) => Promise.reject(error)
);

// ==========================================
// 2. RESPONSE INTERCEPTOR (Handle 401 & Silent Refresh)
// ==========================================
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error: any) => {
    // Normalize backend error messages into error.message
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (typeof data === "string") {
        error.message = data;
      } else if (data.message) {
        error.message = data.message;
      } else if (data.title) {
        error.message = data.title;
      }
    }

    const originalRequest = error.config;

    // Intercept 401 Unauthorized errors for requests that haven't been retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      
      // Prevent infinite loops if the 401 originates from Auth endpoints
      if (originalRequest.url?.includes(AUTH_API.REFRESH_TOKEN) || originalRequest.url?.includes(AUTH_API.LOGIN)) {
        return Promise.reject(error);
      }

      // Immediately abort if backend explicitly states session expiration due to critical security changes
      const wwwAuthenticate = error.response.headers['www-authenticate'] || "";
      if (wwwAuthenticate.includes("Session expired due to security changes")) {
        localStorage.clear();
        window.location.href = PATH.PUBLIC.LOGIN;
        return Promise.reject(error);
      }

      // CONCURRENCY HANDLING: If a refresh is already in progress, queue this request.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push({ resolve, reject });
        })
          .then((token: unknown) => {
            // Re-run the paused request with the new access token
            originalRequest.headers.Authorization = `Bearer ${token as string}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // LOCK THE QUEUE: Set flags to indicate refreshing state
      originalRequest._retry = true;
      isRefreshing = true;

      const currentRefreshToken = localStorage.getItem("refreshToken");

      if (!currentRefreshToken) {
        // If a logged-out visitor hits a 401 from a public page, do not force
        // them away from the public route. Protected routes handle login redirects.
        const hadAccessToken = Boolean(localStorage.getItem("accessToken"));
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (hadAccessToken) {
          window.location.href = PATH.PUBLIC.LOGIN;
        }
        return Promise.reject(error);
      }

      try {
        // USE NATIVE AXIOS for the refresh call to bypass this interceptor
        const res = await axios.post(
          AUTH_API.REFRESH_TOKEN,
          { refreshToken: currentRefreshToken },
          { baseURL: FULL_API } 
        );

        // Extract tokens supporting standard patterns (data.data.token or data.token)
        const responseData = res.data?.data || res.data;
        const newToken = responseData.token || responseData.accessToken;
        const newRefreshToken = responseData.refreshToken || responseData.RefreshToken;
        let newUser = responseData.user || responseData.User || {};

        if (!newToken) throw new Error("Missing new token from server");

        // Trích xuất lại Claims từ Token mới để cập nhật thông tin user đầy đủ nhất
        const decodedClaims = decodeJWT(newToken);
        if (decodedClaims) {
          newUser = {
            ...newUser,
            id: decodedClaims.sub || decodedClaims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || newUser?.id,
            email: decodedClaims.email || decodedClaims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || newUser?.email,
            fullName: decodedClaims.FullName || newUser?.fullName,
            roles: decodedClaims.role || decodedClaims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
            phoneNumber: decodedClaims.PhoneNumber || newUser?.phoneNumber,
            gender: decodedClaims.Gender || newUser?.gender,
            dateOfBirth: decodedClaims.DateOfBirth || newUser?.dateOfBirth,
            avatarUrl: decodedClaims.AvatarUrl || newUser?.avatarUrl,
            jti: decodedClaims.jti,
            rawClaims: decodedClaims 
          };
        }

        // Update LocalStorage
        localStorage.setItem("accessToken", newToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }
        if (Object.keys(newUser).length > 0) {
          localStorage.setItem("user", JSON.stringify(newUser));
          window.dispatchEvent(new CustomEvent("onAuthRefreshed", { detail: { user: newUser, token: newToken, refreshToken: newRefreshToken } }));
        }

        // Notify all waiting requests in the queue to proceed with the new token
        onRefreshed(null, newToken);

        // Process the original request that triggered this flow
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);

      } catch (refreshError) {
        // Refresh Failure Handler: (e.g., token revoked, user banned, password changed)
        // Reject all queued promises to clear memory
        onRefreshed(refreshError, null);
        localStorage.clear();
        window.location.href = PATH.PUBLIC.LOGIN;
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false; // Unlock the queue
      }
    }

    return Promise.reject(error);
  }
);

// Cấu trúc các hàm CRUD chung để tái sử dụng ở mọi Service
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => axiosClient.get(url, config),
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => axiosClient.post(url, data, config),
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => axiosClient.put(url, data, config),
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => axiosClient.delete(url, config),
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => axiosClient.patch(url, data, config),
};

export default axiosClient;
