import axios from 'axios';
import { apiClient } from '../../../../utils/axiosClient';
import { API_BASE_URL } from '../../../../config/api/api';
import { withLanguageHeaders } from '../../../../utils/httpLanguage';



export const locationTrackingService = {
  shareLocation: async (): Promise<string> => {
    const response = await apiClient.post<any>('/locations/share');
    
    // Tìm token trong mọi ngóc ngách của response
    let tokenStr = response?.data?.data || response?.data?.token || response?.data || response;
    
    if (typeof tokenStr === 'object') {
      tokenStr = Object.values(tokenStr)[0]; // Lấy value đầu tiên nếu BE trả về object lạ
    }
    
    // Ép về string và XÓA SẠCH dấu ngoặc kép thừa (thủ phạm gây lỗi 404/expired)
    return String(tokenStr).replace(/['"]/g, ''); 
  },

  getPublicLocation: async (token: string): Promise<{ lat: number; lng: number; fullName: string }> => {
    const response = await axios.get(`${API_BASE_URL}/api/locations/track/${token}`, {
      headers: withLanguageHeaders(),
    });
    return response.data?.data || response.data;
  }
};
