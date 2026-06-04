// Lấy biến môi trường từ Vite (.env)
// SAME_ORIGIN = dùng cùng domain với frontend (Cloudflare Tunnel / nginx share proxy)
function resolveApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

  if (envUrl === "SAME_ORIGIN") {
    return typeof window !== "undefined" ? window.location.origin : "http://localhost:7010";
  }

  if (envUrl) {
    return envUrl;
  }

  return "http://localhost:7010";
}

export const API_BASE_URL: string = resolveApiBaseUrl();
export const API_PREFIX: string = import.meta.env.VITE_API_PREFIX || "/api";

// URL đầy đủ: http://localhost:7010/api
export const FULL_API: string = `${API_BASE_URL}${API_PREFIX}`;

// Đặc biệt: Cổng kết nối Real-time WebSockets/SignalR (Thường không có /api)
export const SIGNALR_HUB_BASE: string = `${API_BASE_URL}/hubs`;

// ==========================================
// UTILITIES (Các hàm tiện ích)
// ==========================================

/**
 * Hàm xử lý URL hình ảnh an toàn.
 */
export const getImg = (url: string | null | undefined): string => {
  if (!url) return "";

  if (url.startsWith("http") || url.startsWith("https")) {
    return url;
  }

  const cleanUrl = url.startsWith("/") ? url.substring(1) : url;

  return `${API_BASE_URL}/${cleanUrl}`;
};
