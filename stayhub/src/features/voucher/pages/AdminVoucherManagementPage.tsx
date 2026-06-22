import React, { useState } from "react";
import { Gift, CheckCircle2, AlertCircle, Mail, Users, Ticket, ArrowRight } from "lucide-react";
import { useTranslation } from "../../../contexts/LocaleContext";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useToast } from "../../../contexts/ToastContext";
import { voucherService } from "../services/voucher.service";
import { PATH } from "../../../config/routes/route";
import { useNavigate } from "react-router-dom";

export const AdminVoucherManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    voucherCode: string;
    totalEligibleCustomers: number;
    emailsSent: number;
  } | null>(null);

  const handleDistribute = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await voucherService.distributeBirthdayVouchers(selectedMonth);
      setResult({
        voucherCode: response.voucherCode,
        totalEligibleCustomers: response.totalEligibleCustomers,
        emailsSent: response.emailsSent,
      });
      addToast({
        title: t("admin.distributeSuccess") || "Success!",
        message: response.message || "Vouchers distributed successfully.",
        type: "success",
      });
    } catch (error: any) {
      addToast({
        title: t("admin.distributeError") || "Error",
        message: error?.response?.data?.message || error.message || "Failed to distribute vouchers",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="page-container py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 md:text-3xl">
            {t("admin.voucherManagement") || "Voucher Management"}
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {t("admin.birthdayVoucherDesc") || "Automatically distribute discount vouchers to customers with birthdays in the selected month."}
          </p>
        </div>
        <ActionButton 
          variant="secondary" 
          onClick={() => navigate(PATH.ADMIN.SYSTEM_VOUCHERS)}
          className="gap-2"
        >
          {t('voucher.backToVouchers')} <ArrowRight size={18} />
        </ActionButton>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribute Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Gift size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {t("admin.distributeBirthdayVoucher") || "Distribute Birthday Vouchers"}
              </h2>
            </div>
          </div>

          <div className="mb-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {t("admin.selectMonth") || "Select month"}
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                disabled={isLoading}
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    Tháng {m} {m === currentMonth ? "(Hiện tại)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ActionButton
            variant="primary"
            className="w-full"
            onClick={handleDistribute}
            disabled={isLoading}
          >
            {isLoading ? t("common.loading") || "Đang xử lý..." : t("admin.distribute") || "Auto Distribute"}
          </ActionButton>
        </div>

        {/* Result Card */}
        {result ? (
          <div className="flex flex-col justify-center rounded-2xl border border-green-200 bg-green-50 p-6">
            <div className="mb-4 flex items-center gap-3 text-green-600">
              <CheckCircle2 size={24} />
              <h3 className="text-lg font-bold">{t("admin.distributeSuccess") || "Success!"}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Ticket className="text-brand" size={20} />
                  <span className="font-semibold text-slate-700">{t("admin.voucherCode") || "Voucher Code"}</span>
                </div>
                <span className="font-black text-brand">{result.voucherCode}</span>
              </div>
              
              <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Users className="text-blue-500" size={20} />
                  <span className="font-semibold text-slate-700">{t("admin.eligibleCustomers") || "Eligible Customers"}</span>
                </div>
                <span className="font-bold text-slate-800">{result.totalEligibleCustomers}</span>
              </div>
              
              <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Mail className="text-amber-500" size={20} />
                  <span className="font-semibold text-slate-700">{t("admin.emailsSent") || "Emails Sent"}</span>
                </div>
                <span className="font-bold text-slate-800">{result.emailsSent}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Gift size={32} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-700">Chưa có dữ liệu phân phối</h3>
            <p className="max-w-sm text-sm text-slate-500">
              Chọn tháng và nhấn nút "Phát tự động" để gửi voucher giảm giá sinh nhật cho các khách hàng.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
