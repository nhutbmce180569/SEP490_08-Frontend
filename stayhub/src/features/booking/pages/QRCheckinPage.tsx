import React, { useState } from "react";
import {
  QrCode,
  ScanLine,
  Keyboard,
  CheckCircle2,
  XCircle,
  User,
  Ticket,
  Loader2,
  ArrowLeft,
  Tag,
  Hash
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from "../../../contexts/LocaleContext";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useTicketCheckin } from "../hooks/useTicketCheckin";

import { Scanner } from "@yudiel/react-qr-scanner";

export const QRCheckinPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const [qrInput, setQrInput] = useState("");
  const [scanMode, setScanMode] = useState<"camera" | "manual">("camera");

  const { isProcessing, lastResult, processQRCode } = useTicketCheckin();

  const handleCheckin = async (code: string) => {
    if (!code.trim() || isProcessing) return;

    try {
      const result = await processQRCode(code);
      if (result?.status === "success") {
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
    <div className="mx-auto max-w-5xl py-4 px-4 sm:px-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-[15px] font-bold leading-tight text-slate-900">
            {t("booking.ticketCheckIn")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("booking.scanOrEnter")}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-[#0068E0] hover:ring-[#0068E0]/30 outline-none"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {t("booking.backToDashboard")}
        </button>
      </div>

      {/* Căn items-start để cột phải không bị kéo giãn chiều cao vô cớ */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">
        {/* ==============================================================
            CỘT TRÁI: KHU VỰC QUÉT MÃ (Chiếm 7 phần)
        ============================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">

            {/* Segmented Control: Camera vs Manual */}
            <div className="mb-5 flex rounded-xl bg-slate-100/80 p-1 ring-1 ring-slate-200/50">
              <button
                onClick={() => setScanMode("camera")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all duration-300 ${scanMode === "camera"
                  ? "bg-white text-[#0068E0] shadow-md shadow-slate-200"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <QrCode className="h-4 w-4" /> {t("booking.cameraScan")}
              </button>
              <button
                onClick={() => setScanMode("manual")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all duration-300 ${scanMode === "manual"
                  ? "bg-white text-[#0068E0] shadow-md shadow-slate-200"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <Keyboard className="h-4 w-4" /> {t("booking.manualEntry")}
              </button>
            </div>

            {/* Giao diện quét bằng Camera (Thu nhỏ kích thước max-w) */}
            {scanMode === "camera" && (
              <div className="relative aspect-square w-full max-w-[280px] mx-auto overflow-hidden rounded-3xl bg-slate-900 border-[4px] border-slate-800 shadow-md">
                <Scanner
                  onScan={(detectedCodes) => {
                    if (detectedCodes && detectedCodes.length > 0) {
                      const code = detectedCodes[0].rawValue;
                      handleCheckin(code);
                    }
                  }}
                  onError={(error) => {
                    console.log("Camera error:", error?.message);
                  }}
                  components={{ finder: false }}
                  styles={{
                    container: { width: "100%", height: "100%" },
                    video: { objectFit: "cover" },
                  }}
                />

                {/* Overlay Đang Xử Lý */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md flex flex-col items-center justify-center z-10">
                    <Loader2 className="h-10 w-10 text-[#0068E0] animate-spin mb-3" />
                    <p className="text-white text-sm font-bold tracking-wide animate-pulse">
                      Đang xử lý...
                    </p>
                  </div>
                )}

                {/* Khung ngắm Laser */}
                {!isProcessing && (
                  <div className="absolute inset-8 border-2 border-[#0068E0]/40 rounded-2xl pointer-events-none z-0">
                    <div className="w-full h-[2px] bg-[#0068E0] absolute top-1/2 shadow-[0_0_15px_3px_rgba(0,104,224,0.6)] animate-[pulse_2s_ease-in-out_infinite]" />
                    <div className="absolute top-[-2px] left-[-2px] w-6 h-6 border-t-4 border-l-4 border-[#0068E0] rounded-tl-xl" />
                    <div className="absolute top-[-2px] right-[-2px] w-6 h-6 border-t-4 border-r-4 border-[#0068E0] rounded-tr-xl" />
                    <div className="absolute bottom-[-2px] left-[-2px] w-6 h-6 border-b-4 border-l-4 border-[#0068E0] rounded-bl-xl" />
                    <div className="absolute bottom-[-2px] right-[-2px] w-6 h-6 border-b-4 border-r-4 border-[#0068E0] rounded-br-xl" />
                  </div>
                )}
              </div>
            )}

            {/* Giao diện nhập mã thủ công */}
            {scanMode === "manual" && (
              <form
                onSubmit={handleManualSubmit}
                className="max-w-sm mx-auto mt-4 space-y-4"
              >
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700 text-center">
                    {t("booking.enterTicketQr")}
                  </label>
                  <div className="relative">
                    <input
                      autoFocus
                      type="text"
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      placeholder={t("booking.ticketQrPlaceholder")}
                      className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-3 px-4 text-center text-lg font-black uppercase tracking-widest text-slate-800 focus:border-[#0068E0] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                    <Keyboard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </div>
                </div>
                <ActionButton
                  type="submit"
                  variant="primary"
                  disabled={!qrInput.trim() || isProcessing}
                  className="w-full rounded-2xl py-3 text-sm font-bold shadow-md shadow-blue-500/25 transition-transform active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Vui lòng chờ...</span>
                  ) : (
                    t("booking.processCheckIn")
                  )}
                </ActionButton>
              </form>
            )}
          </div>
        </div>

        {/* ==============================================================
            CỘT PHẢI: KẾT QUẢ HIỂN THỊ (Chiếm 5 phần)
        ============================================================== */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 rounded-3xl border border-slate-200/80 bg-slate-50/50 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-white border-b border-slate-200 px-5 py-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Ticket className="h-4 w-4 text-slate-500" />
                {t("booking.scanResult")}
              </h3>
            </div>

            <div className="p-5 flex flex-col items-center justify-center text-center">

              {/* TRẠNG THÁI CHỜ */}
              {!lastResult ? (
                <div className="text-slate-400 flex flex-col items-center animate-in fade-in py-8">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                    <QrCode className="h-16 w-16 relative z-10 text-slate-300" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-semibold text-slate-500">
                    {t("booking.waitingForScan")}
                  </p>
                  <p className="text-xs mt-1 max-w-[200px] leading-relaxed">
                    Đưa mã QR vào khung ngắm camera để bắt đầu check-in
                  </p>
                </div>
              ) :

                /* TRẠNG THÁI THÀNH CÔNG */
                lastResult.status === "success" ? (
                  <div className="w-full animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-1">
                      {t("booking.checkInValid")}
                    </h4>
                    <p className="text-xs font-bold text-emerald-600 mb-5">
                      {lastResult.message}
                    </p>

                    {/* THIẾT KẾ DẠNG VÉ (TICKET STYLE) */}
                    <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm text-left overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50/50 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200/50">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                              Hành khách / Passenger
                            </p>
                            <p className="truncate font-black text-slate-800 text-base">
                              {lastResult.ticketData?.attendeeName || t("booking.anonymous")}
                            </p>
                          </div>
                        </div>

                        {/* Badge trạng thái check-in */}
                        {lastResult.ticketData?.checkInStatus && (
                          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 border border-emerald-200">
                            {lastResult.ticketData.checkInStatus}
                          </span>
                        )}
                      </div>

                      {/* Vạch đứt */}
                      <div className="relative flex items-center justify-between px-1">
                        <div className="absolute left-[-8px] top-[-8px] h-4 w-4 rounded-full bg-slate-50 border border-slate-200 z-10" />
                        <div className="w-full border-t-[1.5px] border-dashed border-slate-200 mx-1" />
                        <div className="absolute right-[-8px] top-[-8px] h-4 w-4 rounded-full bg-slate-50 border border-slate-200 z-10" />
                      </div>

                      <div className="px-4 py-3 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-0.5">
                            <Tag className="h-2.5 w-2.5" /> Loại Vé
                          </p>
                          <p className="truncate font-bold text-slate-700 text-sm">
                            {lastResult.ticketData?.ticketTypeName || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-0.5">
                            <Hash className="h-2.5 w-2.5" /> ID Vé
                          </p>
                          <p className="truncate font-bold text-slate-700 text-sm">
                            #{lastResult.ticketData?.ticketId || t("common.na")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) :

                  /* TRẠNG THÁI LỖI */
                  (
                    <div className="w-full animate-in slide-in-from-bottom-4 fade-in duration-300 py-4">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3 shadow-[0_0_20px_-5px_rgba(244,63,94,0.4)]">
                        <XCircle className="h-7 w-7" />
                      </div>
                      <h4 className="text-xl font-black text-slate-900 mb-3">
                        {t("booking.invalidTicket")}
                      </h4>
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