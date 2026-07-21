import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Gift, CheckCircle2, Ticket, Users, Mail, X, Calendar, Search, AlertCircle, Loader2, Sparkles, Clock } from 'lucide-react';
import { useTranslation } from '../../../contexts/LocaleContext';
import { ActionButton } from '../../../components/dashboard/ActionButton';
import { useToast } from '../../../contexts/ToastContext';
import { voucherService } from '../services/voucher.service';

interface BirthdayDistributeModalProps {
  open: boolean;
  onClose: () => void;
}

interface CustomerPreview {
  id: number;
  fullName: string;
  email: string;
  status: string;
}

export const BirthdayDistributeModal: React.FC<BirthdayDistributeModalProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);

  // Helper to generate default date ISO strings for month
  const getDefaultDates = (m: number) => {
    const year = currentYear;
    const startStr = `${year}-${String(m).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(year, m, 0); // last day of month m
    const endObj = new Date(lastDayOfMonth);
    endObj.setDate(endObj.getDate() + 30);
    const endStr = endObj.toISOString().split('T')[0];
    return { startStr, endStr };
  };

  // Form states for voucher offer customization
  const [discountType, setDiscountType] = useState<'Percent' | 'Amount'>('Percent');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(500000);
  const [startDate, setStartDate] = useState<string>(() => getDefaultDates(new Date().getMonth() + 1).startStr);
  const [endDate, setEndDate] = useState<string>(() => getDefaultDates(new Date().getMonth() + 1).endStr);

  // Preview & Result data
  const [previewData, setPreviewData] = useState<{
    voucherCode: string;
    isDistributed: boolean;
    totalEligibleCustomers: number;
    customers: CustomerPreview[];
  } | null>(null);

  const [customerSearch, setCustomerSearch] = useState('');

  const [result, setResult] = useState<{
    voucherCode: string;
    totalEligibleCustomers: number;
    emailsSent: number;
  } | null>(null);

  useEffect(() => {
    if (open) {
      loadPreview(selectedMonth);
      const { startStr, endStr } = getDefaultDates(selectedMonth);
      setStartDate(startStr);
      setEndDate(endStr);
    }
  }, [open, selectedMonth]);

  const loadPreview = async (month: number) => {
    setIsLoadingPreview(true);
    try {
      const data = await voucherService.getBirthdayVoucherPreview(month, currentYear);
      setPreviewData(data);
    } catch (err: any) {
      showError(err?.response?.data?.message || err.message || 'Failed to load birthday preview.');
      setPreviewData(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDistribute = async () => {
    if (!previewData || previewData.isDistributed || previewData.totalEligibleCustomers === 0) return;

    setIsDistributing(true);
    setResult(null);
    try {
      const response = await voucherService.distributeBirthdayVouchers(selectedMonth, {
        discountType,
        discountValue: Number(discountValue),
        maxDiscountAmount: discountType === 'Percent' ? Number(maxDiscountAmount) : undefined,
        startDate,
        endDate,
      });
      setResult({
        voucherCode: response.voucherCode,
        totalEligibleCustomers: response.totalEligibleCustomers,
        emailsSent: response.emailsSent,
      });
      success(response.message || 'Vouchers distributed successfully.');
    } catch (error: any) {
      showError(error?.response?.data?.message || error.message || 'Failed to distribute vouchers');
    } finally {
      setIsDistributing(false);
    }
  };

  const handleClose = () => {
    if (!isDistributing && !isLoadingPreview) {
      setResult(null);
      setPreviewData(null);
      setCustomerSearch('');
      onClose();
    }
  };

  // Date validation check
  const startMonthNum = startDate ? Number(startDate.split('-')[1]) : 0;
  const isStartMonthValid = startMonthNum === selectedMonth;
  const isDateOrderValid = Boolean(startDate && endDate && endDate >= startDate);

  let dateErrorMsg = '';
  if (startDate && !isStartMonthValid) {
    dateErrorMsg = t('admin.startDateMonthError', { month: selectedMonth, year: currentYear });
  } else if (startDate && endDate && !isDateOrderValid) {
    dateErrorMsg = t('admin.endDateOrderError');
  }

  const filteredCustomers = previewData?.customers.filter((c) =>
    c.fullName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  ) || [];

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="glass-overlay fixed inset-0 z-[500] flex items-center justify-center p-4"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="glass-modal relative w-full max-w-xl overflow-hidden p-6 sm:p-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <button
          onClick={handleClose}
          className="icon-btn absolute right-4 top-4"
          disabled={isDistributing || isLoadingPreview}
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-center gap-3 shrink-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Gift size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800" id="modal-title">
              {t('admin.distributeBirthdayVoucher')}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {t('admin.birthdayVoucherDesc')}
            </p>
          </div>
        </div>

        {!result ? (
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
            {/* Month Selection Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <span>{t('admin.birthdayTargetMonth')}</span>
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                disabled={isDistributing || isLoadingPreview}
                className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {t('common.month', { defaultValue: 'Tháng' })} {m}/{currentYear} {m === new Date().getMonth() + 1 ? t('admin.currentMonthTag') : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Loading State */}
            {isLoadingPreview ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-2">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
                <span className="text-xs font-medium">{t('admin.loadingBirthdayPreview', { month: selectedMonth })}</span>
              </div>
            ) : previewData ? (
              <>
                {/* Status Notice */}
                {previewData.isDistributed ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-semibold block">{t('admin.birthdayAlreadyDistributedTitle')}</span>
                      <span>{t('admin.birthdayAlreadyDistributedDesc', { code: previewData.voucherCode, month: selectedMonth, year: currentYear })}</span>
                    </div>
                  </div>
                ) : previewData.totalEligibleCustomers === 0 ? (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-3.5 text-xs text-blue-800 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                    <span>{t('admin.noBirthdayCustomersFound', { month: selectedMonth, year: currentYear })}</span>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{t('admin.readyToDistributeNotice', { count: previewData.totalEligibleCustomers, month: selectedMonth, year: currentYear })}</span>
                  </div>
                )}

                {/* Summary Info Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col">
                    <span className="text-[11px] font-medium text-slate-400">{t('admin.autoGeneratedVoucherCode')}</span>
                    <span className="text-sm font-extrabold text-indigo-600 font-mono mt-0.5">{previewData.voucherCode}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col">
                    <span className="text-[11px] font-medium text-slate-400">{t('admin.birthdayCustomersCount')}</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-0.5">{previewData.totalEligibleCustomers}</span>
                  </div>
                </div>

                {/* Offer Customization Form (Only if not distributed) */}
                {!previewData.isDistributed && previewData.totalEligibleCustomers > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('admin.offerCustomizationTitle')}</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">{t('admin.discountTypeLabel')}</label>
                        <select
                          value={discountType}
                          onChange={(e) => {
                            const val = e.target.value as 'Percent' | 'Amount';
                            setDiscountType(val);
                            if (val === 'Amount') setDiscountValue(50000);
                            else setDiscountValue(10);
                          }}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="Percent">{t('admin.discountPercent')}</option>
                          <option value="Amount">{t('admin.discountFixedAmount')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {discountType === 'Percent' ? t('admin.discountValueLabelPercent') : t('admin.discountValueLabelAmount')}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={discountType === 'Percent' ? 100 : 10000000}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {discountType === 'Percent' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">{t('admin.maxDiscountAmountLabel')}</label>
                        <input
                          type="number"
                          step={10000}
                          min={10000}
                          value={maxDiscountAmount}
                          onChange={(e) => setMaxDiscountAmount(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Date picker inputs for custom Start and End Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-indigo-500" />
                          {t('admin.effectiveStartDateLabel')}
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className={`w-full rounded-xl border px-3 py-1.5 text-xs text-slate-800 focus:outline-none font-medium ${
                            startDate && !isStartMonthValid ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500' : 'border-slate-300 bg-white focus:border-indigo-500'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-rose-500" />
                          {t('admin.voucherExpiryDateLabel')}
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className={`w-full rounded-xl border px-3 py-1.5 text-xs text-slate-800 focus:outline-none font-medium ${
                            startDate && endDate && !isDateOrderValid ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500' : 'border-slate-300 bg-white focus:border-indigo-500'
                          }`}
                        />
                      </div>
                    </div>

                    {dateErrorMsg && (
                      <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 pt-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {dateErrorMsg}
                      </p>
                    )}
                  </div>
                )}

                {/* Customers Preview Section */}
                {previewData.customers.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-indigo-500" />
                        {t('admin.customerListTitle', { count: previewData.customers.length })}
                      </h4>
                      {previewData.customers.length > 4 && (
                        <div className="relative w-36 sm:w-44">
                          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder={t('admin.searchCustomerPlaceholder')}
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2 py-1 text-[11px] focus:bg-white focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 pr-1">
                      {filteredCustomers.length === 0 ? (
                        <p className="py-3 text-center text-xs text-slate-400">{t('admin.noMatchingCustomer')}</p>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <div key={customer.id} className="flex items-center justify-between py-1.5 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                                {customer.fullName?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <span className="font-medium text-slate-800">{customer.fullName}</span>
                            </div>
                            <span className="text-slate-400 text-[11px]">{customer.email}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : null}

            {/* Bottom Actions */}
            <div className="flex w-full gap-3 pt-2 mt-auto">
              <ActionButton variant="secondary" onClick={handleClose} disabled={isDistributing} className="flex-1 justify-center py-2.5">
                {t('common.cancel')}
              </ActionButton>
              <ActionButton 
                variant="primary" 
                onClick={handleDistribute} 
                disabled={isDistributing || isLoadingPreview || !previewData || previewData.isDistributed || previewData.totalEligibleCustomers === 0 || !!dateErrorMsg}
                className="flex-1 justify-center py-2.5"
              >
                {isDistributing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('admin.sendingAndDistributing')}
                  </span>
                ) : (
                  t('admin.distributeBirthdayVoucherBtn')
                )}
              </ActionButton>
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="flex flex-col rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
            <div className="mb-4 flex flex-col items-center justify-center text-emerald-600">
              <CheckCircle2 size={44} className="mb-2 text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-800">{t('admin.distributeSuccessTitle')}</h3>
              <p className="text-xs text-slate-500 mt-1">{t('admin.distributeSuccessDesc', { month: selectedMonth, year: currentYear })}</p>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Ticket className="text-indigo-600" size={18} />
                  <span className="text-xs font-semibold text-slate-700">{t('admin.createdVoucherCodeLabel')}</span>
                </div>
                <span className="font-mono font-extrabold text-indigo-600">{result.voucherCode}</span>
              </div>
              
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Users className="text-blue-500" size={18} />
                  <span className="text-xs font-semibold text-slate-700">{t('admin.receivedCustomersLabel')}</span>
                </div>
                <span className="font-bold text-slate-800">{result.totalEligibleCustomers}</span>
              </div>
              
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Mail className="text-amber-500" size={18} />
                  <span className="text-xs font-semibold text-slate-700">{t('admin.sentEmailsLabel')}</span>
                </div>
                <span className="font-bold text-slate-800">{result.emailsSent}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <ActionButton variant="primary" onClick={handleClose} className="w-full justify-center py-2.5">
                {t('common.close')}
              </ActionButton>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
