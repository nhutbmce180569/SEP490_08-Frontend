import axios from 'axios';
import { apiClient } from '../../../../utils/axiosClient';
import { API_BASE_URL } from '../../../../config/api/api';
import { withLanguageHeaders } from '../../../../utils/httpLanguage';

export const locationTrackingService = {
  // 1. API Tạo mã chia sẻ (Có Auth)
  shareLocation: async (): Promise<string> => {
    const response = await apiClient.post<any>('/locations/share');
    
    // Tùy thuộc apiClient có interceptor hay không, lấy phần payload thực sự
    const payload = response.data || response;
    
    // Bóc tách token dù BE có gói nó trong key "token" hay "data"
    const tokenStr = payload.token || payload.data || payload;
    
    // Nếu vẫn là object, ép kiểu để tránh lỗi [object Object] (dành cho debug)
    return typeof tokenStr === 'string' ? tokenStr : JSON.stringify(tokenStr);
  },


  getPublicLocation: async (token: string): Promise<{ lat: number; lng: number; fullName: string }> => {
    const response = await axios.get(`${API_BASE_URL}/api/locations/track/${token}`, {
      headers: withLanguageHeaders(),
    });
    
    return response.data?.data || response.data;
  }
};
