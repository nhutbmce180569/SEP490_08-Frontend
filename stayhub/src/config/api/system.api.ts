import { FULL_API } from './api';

// src/config/api/system.api.ts
export const SYSTEM_API = {
  NOTIFICATIONS: {
    // Gọi GET: Lấy danh sách thông báo của user đang đăng nhập (BE tự lấy ID từ Token)
    GET_USER_NOTIFICATIONS: `${FULL_API}/notifications`,
    
    // Gọi PUT: Đánh dấu 1 thông báo là đã đọc
    MARK_AS_READ: (id: number | string) => `${FULL_API}/notifications/${id}/read`,
    
    // Gọi DELETE: Xóa thông báo (Nếu BE của bạn có viết hàm xóa, thì dùng cái này)
    DELETE: (id: number | string) => `${FULL_API}/notifications/${id}`,
  },
};