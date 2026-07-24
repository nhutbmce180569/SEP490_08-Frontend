import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { DynamicText } from "../components/DynamicText";

export type ToastType = "success" | "warning" | "error" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  success: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);  
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Tự động đóng Toast sau 3 giây
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  // Tiện ích rút gọn hàm gọi
  const success = useCallback((msg: string) => showToast(msg, "success"), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, "warning"), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, "error"), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, "info"), [showToast]);

  return (
    <ToastContext.Provider value={{ success, warning, error, info }}>
      {children}
      {/* Vùng hiển thị toàn bộ Toasts */}
     <div className="fixed right-6 top-6 z-[999999] flex flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({ toast, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Kích hoạt animation giảm dần của thanh progress
    const timer = setTimeout(() => setProgress(0), 10);
    return () => clearTimeout(timer);
  }, []);

  const config = {
    success: { icon: CheckCircle, className: "glass-modal border-emerald-200/80 bg-emerald-600/95 text-white shadow-lg", iconColor: "text-white/90", progressClass: "bg-white/80" },
    warning: { icon: AlertTriangle, className: "glass-modal border-amber-200/80 bg-amber-500/95 text-white shadow-lg", iconColor: "text-white/90", progressClass: "bg-white/80" },
    error: { icon: XCircle, className: "glass-modal border-rose-200/80 bg-rose-600/95 text-white shadow-lg", iconColor: "text-white/90", progressClass: "bg-white/80" },
    info: { icon: Info, className: "glass-modal border-brand/30 bg-brand/95 text-white shadow-lg", iconColor: "text-white/90", progressClass: "bg-white/80" },
  };

  const { icon: Icon, className, iconColor, progressClass } = config[toast.type];

  return (
    <div 
      className={`relative flex w-full min-w-[300px] max-w-sm items-center gap-3 overflow-hidden rounded-xl px-4 py-3 transition-all duration-300 ${className}`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
      <p className="m-0 flex-1 text-sm font-medium"><DynamicText text={toast.message} isHtml={false} /></p>
      <button
        onClick={onClose}
        className="shrink-0 p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Progress Bar (Timer hiệu ứng) */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-black/10">
        <div 
          className={`h-full ${progressClass} transition-all ease-linear`}
          style={{ width: `${progress}%`, transitionDuration: '2990ms' }}
        />
      </div>
    </div>
  );
};