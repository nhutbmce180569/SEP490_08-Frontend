import React, { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";

interface Props {
  onRetry: () => void;
}

export const AiModelsNotReadyBanner: React.FC<Props> = ({ onRetry }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      onRetry();
      setCountdown(5);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onRetry]);

  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={{
        background: "#FFFBEB",
        border: "1px solid rgba(245,158,11,0.25)",
      }}
    >
      <div className="flex justify-center mb-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center animate-pulse"
          style={{ background: "#FEF3C7" }}
        >
          <AlertTriangle size={28} className="text-amber-600" />
        </div>
      </div>
      <h3 className="text-lg font-black text-slate-800 mb-2">
        AI đang khởi động...
      </h3>
      <p className="text-sm text-slate-600 font-medium max-w-md mx-auto mb-6">
        Mô hình ML chưa sẵn sàng. Hệ thống sẽ thử lại tự động sau {countdown}s.
      </p>

      {/* Skeleton cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden animate-pulse"
            style={{ border: "1px solid rgba(5,7,60,0.06)" }}
          >
            <div className="bg-slate-200 aspect-[4/3]" />
            <div className="p-4 space-y-3">
              <div className="h-3 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>

      <ActionButton variant="primary" onClick={onRetry} className="!px-6 inline-flex gap-2">
        <RefreshCw size={16} /> Thử lại ngay
      </ActionButton>
    </div>
  );
};
