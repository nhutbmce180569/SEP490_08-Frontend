import { useState, useCallback } from 'react';
import { ticketService } from '../services/ticket.service';
import { tStored } from '../../../i18n/tStored';

// Định nghĩa kiểu dữ liệu cho kết quả quét vé
export interface CheckInResult {
  status: 'success' | 'error';
  message: string;
  ticketData?: any;
}

export const useTicketCheckin = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);

  const processQRCode = useCallback(async (qrCode: string) => {
    if (!qrCode.trim()) return null;
    
    setIsProcessing(true);
    setLastResult(null); // Reset kết quả cũ

    try {
      // Gọi API từ Service
      const res = await ticketService.checkInByQR(qrCode);
      
      const successResult: CheckInResult = {
        status: 'success',
        message: res?.message || tStored('booking.checkInSuccess'),
        ticketData: res?.data
      };
      
      setLastResult(successResult);
      return successResult;

    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || tStored('booking.scanTicketFailed');
      
      const errorResult: CheckInResult = {
        status: 'error',
        message: errorMsg
      };
      
      setLastResult(errorResult);
      throw errorResult; // Ném lỗi ra để giao diện (Component) bắt và hiển thị Toast

    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Hàm để clear kết quả (Ví dụ khi người dùng ấn nút "Quét vé khác")
  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    isProcessing,
    lastResult,
    processQRCode,
    clearResult
  };
};