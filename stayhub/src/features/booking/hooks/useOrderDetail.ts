import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { ReadOrderDTO } from "../types/booking";
import { getOrderById } from "../services/booking.service";
import { useToast } from "../../../contexts/ToastContext";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object") {
    const apiError = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };

    return apiError.response?.data?.message || apiError.message || fallback;
  }

  return fallback;
};

export const useOrderDetail = (orderId?: string | number | null) => {
  const [order, setOrder] = useState<ReadOrderDTO | null>(null);
  
  // isLoading: Dành cho lần load ĐẦU TIÊN
  const [isLoading, setIsLoading] = useState<boolean>(true); // Nên để true ban đầu để tránh chớp UI lúc mới vào
  
  // isRefetching: Dành cho tải lại ngầm (khi review hoặc xử lý VNPay xong)
  const [isRefetching, setIsRefetching] = useState<boolean>(false); 
  
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error: showError } = useToast();
  const paymentHandledRef = useRef(false);

  // 1. THÊM: Bọc useCallback và tham số isBackgroundRefresh
  const fetchOrder = useCallback(async (isBackgroundRefresh = false) => {
    if (orderId === undefined || orderId === null) {
      setOrder(null);
      setError("Invalid order identifier.");
      setIsLoading(false);
      return;
    }

    // 2. THÊM: Tách biệt Loading và Refetching
    if (isBackgroundRefresh) {
      setIsRefetching(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);

    try {
      const data = await getOrderById(orderId);
      setOrder(data || null);
      if (!data) {
        setError("Order not found.");
      }
    } catch (err: unknown) {
      // Giữ nguyên cách bắt lỗi cũ của bạn trên Git
      setError(getErrorMessage(err, "Failed to load order details."));
    } finally {
      setIsLoading(false);
      setIsRefetching(false); // Nhớ tắt cờ refetch
    }
  }, [orderId]);

  // Load data lần đầu khi vào trang
  useEffect(() => {
    const loadOrder = async () => {
      await fetchOrder(false);
    };

    void loadOrder();
  }, [fetchOrder]);

  // Luồng xử lý thanh toán VNPay (Giữ nguyên logic của bạn, chỉ đổi cách gọi fetchOrder)
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (!orderId || paymentHandledRef.current) {
      return;
    }

    if (paymentStatus !== "success" && paymentStatus !== "cancelled") {
      return;
    }

    paymentHandledRef.current = true;

    const syncPayment = async () => {
      if (paymentStatus === "success") {
        try {
          await fetchOrder(true);
          success("Payment successful! Your booking is now confirmed.");
        } catch (err: unknown) {
          showError(getErrorMessage(err, "Failed to refresh the confirmed order."));
        }
      } else {
        try {
          await fetchOrder(true);
          showError("Payment was cancelled. Your order has been cancelled.");
        } catch (err: unknown) {
          showError(getErrorMessage(err, "Failed to refresh the cancelled order."));
        }
      }

      searchParams.delete("payment");
      setSearchParams(searchParams, { replace: true });
    };

    void syncPayment();
    // 4. SỬA: Cập nhật lại list dependency cho chuẩn React Hook
  }, [orderId, searchParams, setSearchParams, success, showError, fetchOrder]);

  return {
    order,
    isLoading,
    isRefetching, // Trả ra thêm cho component ngoài nếu muốn xài
    error,
    refetch: () => fetchOrder(true), // Nút Edit Review sẽ gọi hàm này -> tải ngầm cực mượt
  };
};
