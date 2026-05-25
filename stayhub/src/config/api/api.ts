// Lấy biến môi trường từ Vite (.env)
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "http://localhost:7010";
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
 * Giúp ghép đúng Base URL nếu database trả về thiếu,
 * và bỏ qua nếu URL đã là một link hoàn chỉnh (Cloudinary, AWS S3, v.v.)
 */
export const getImg = (url: string | null | undefined): string => {
  // Tránh trường hợp url bị undefined, null hoặc rỗng
  if (!url) return ""; 
  
  // Tránh việc url đã có sẵn http:// hoặc https:// nhưng vẫn bị nối thêm base url
  if (url.startsWith('http') || url.startsWith('https')) {
    return url;
  }

  // Loại bỏ dấu '/' dư thừa ở đầu url nếu có để tránh lỗi http://localhost:7008//images/...
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;

  return `${API_BASE_URL}/${cleanUrl}`;
};