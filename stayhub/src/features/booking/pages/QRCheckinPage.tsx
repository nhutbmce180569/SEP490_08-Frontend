import React, { useState } from "react";
import { 
  QrCode, ScanLine, Keyboard, CheckCircle2, 
  XCircle, User, Ticket, Loader2, ArrowLeft 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from "../../../contexts/LocaleContext";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useTicketCheckin } from "../hooks/useTicketCheckin";

import { Scanner } from '@yudiel/react-qr-scanner';

export const QRCheckinPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const [qrInput, setQrInput] = useState("");
  const [scanMode, setScanMode] = useState<"camera" | "manual">("camera"); // Mặc định mở lên là bật Camera
  
  const { isProcessing, lastResult, processQRCode } = useTicketCheckin();

  // Hàm xử lý chung khi Camera quét được hoặc khi Submit form nhập tay
  const handleCheckin = async (code: string) => {
    if (!code.trim() || isProcessing) return;

    try {
      const result = await processQRCode(code);
      if (result?.status === 'success') {
         showSuccess(t("booking.checkInSuccessToast"));
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setQrInput(""); 
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheckin(qrInput);
  };

  return (
    <div className="mx-auto max-w-4xl py-6 px-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors outline-none"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("booking.backToDashboard")}
      </button>

      <div className="grid gap-6 md:grid-cols-5">
        
        {/* CỘT TRÁI: MÀN HÌNH QUÉT / NHẬP MÃ */}
        <div className="md:col-span-3 flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ScanLine className="h-6 w-6 text-[#0068E0]" /> {t("booking.ticketCheckIn")}
                </h1>
                <p className="mt-1 text-sm text-slate-500 font-medium">
                  {t("booking.scanOrEnter")}
                </p>
              </div>
            </div>

            {/* Tab chuyển đổi chế độ */}
            <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setScanMode("camera")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all ${
                  scanMode === "camera" ? "bg-white text-[#0068E0] shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <QrCode className="h-4 w-4" /> {t("booking.cameraScan")}
              </button>
              <button
                onClick={() => setScanMode("manual")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all ${
                  scanMode === "manual" ? "bg-white text-[#0068E0] shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Keyboard className="h-4 w-4" /> {t("booking.manualEntry")}
              </button>
            </div>

            {/* 📸 GIAO DIỆN QUÉT CAMERA THẬT */}
            {scanMode === "camera" && (
              <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-slate-900 border-4 border-slate-800 shadow-inner">
                <Scanner
                  onScan={(detectedCodes) => {
                    // Thư viện trả về mảng các mã quét được, ta lấy mã đầu tiên
                    if (detectedCodes && detectedCodes.length > 0) {
                      const code = detectedCodes[0].rawValue;
                      handleCheckin(code);
                    }
                  }}
                  onError={(error) => {
                    console.log("Camera error:", error?.message);
                  }}
                  // Tùy chỉnh Scanner
                  components={{
                    finder: false // Tắt khung ngắm mặc định để dùng khung ngắm custom bên dưới
                  }}
                  styles={{
                    container: { width: '100%', height: '100%' },
                    video: { objectFit: 'cover' }
                  }}
                />
                
                {/* Lớp phủ màn mờ khi đang tải (Tránh quét đúp) */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                    <Loader2 className="h-10 w-10 text-[#0068E0] animate-spin mb-3" />
                    <p className="text-white font-semibold text-sm animate-pulse">{t("booking.processingTicket")}</p>
                  </div>
                )}

                {/* Hiệu ứng khung ngắm Laser xanh nước biển */}
                {!isProcessing && (
                  <div className="absolute inset-8 border-2 border-[#0068E0]/60 rounded-2xl pointer-events-none z-0">
                    <div className="w-full h-0.5 bg-[#0068E0] absolute top-1/2 shadow-[0_0_15px_3px_rgba(0,104,224,0.6)] animate-[pulse_2s_ease-in-out_infinite]" />
                    {/* Bốn góc trang trí */}
                    <div className="absolute top-[-2px] left-[-2px] w-6 h-6 border-t-4 border-l-4 border-[#0068E0] rounded-tl-xl" />
                    <div className="absolute top-[-2px] right-[-2px] w-6 h-6 border-t-4 border-r-4 border-[#0068E0] rounded-tr-xl" />
                    <div className="absolute bottom-[-2px] left-[-2px] w-6 h-6 border-b-4 border-l-4 border-[#0068E0] rounded-bl-xl" />
                    <div className="absolute bottom-[-2px] right-[-2px] w-6 h-6 border-b-4 border-r-4 border-[#0068E0] rounded-br-xl" />
                  </div>
                )}
              </div>
            )}

            {/* ⌨️ GIAO DIỆN NHẬP TAY (Dự phòng) */}
            {scanMode === "manual" && (
              <form onSubmit={handleManualSubmit} className="max-w-sm mx-auto mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 text-center">
                    {t("booking.enterTicketQr")}
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder={t("booking.ticketQrPlaceholder")}
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-4 text-center text-lg font-black uppercase tracking-widest focus:border-[#0068E0] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                <ActionButton
                  type="submit"
                  variant="primary"
                  disabled={!qrInput.trim() || isProcessing}
                  className="w-full py-4 text-base shadow-sm shadow-blue-500/20"
                >
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : t("booking.processCheckIn")}
                </ActionButton>
              </form>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: HIỂN THỊ KẾT QUẢ QUÉT TỪ HOOK */}
        <div className="md:col-span-2">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4">
              <h3 className="font-bold text-slate-800">{t("booking.scanResult")}</h3>
            </div>
            
            <div className="flex-1 p-5 flex flex-col items-center justify-center text-center bg-slate-50/30">
              {!lastResult ? (
                <div className="text-slate-400">
                  <QrCode className="h-16 w-16 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">{t("booking.waitingForScan")}</p>
                </div>
              ) : lastResult.status === "success" ? (
                <div className="w-full animate-in zoom-in-95 duration-300">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 ring-4 ring-emerald-50">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-1">{t("booking.checkInValid")}</h4>
                  <p className="text-sm font-bold text-emerald-600 mb-6">{lastResult.message}</p>
                  
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-left space-y-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("booking.customerName")}</p>
                        <p className="truncate font-bold text-slate-900 text-base">
                          {lastResult.ticketData?.customerName || t("booking.anonymous")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="h-px w-full bg-slate-100" />

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Ticket className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("booking.ticketId")}</p>
                        <p className="truncate font-bold text-slate-900 text-base">
                          #{lastResult.ticketData?.id || t("common.na")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full animate-in zoom-in-95 duration-300">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4 ring-4 ring-rose-50">
                    <XCircle className="h-8 w-8" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-2">{t("booking.invalidTicket")}</h4>
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
                    <p className="text-sm font-bold text-rose-600 leading-relaxed">
                      {lastResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};