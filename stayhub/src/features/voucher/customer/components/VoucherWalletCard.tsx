import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Copy, MapPin, TicketPercent } from 'lucide-react';
import { PATH } from '../../../../config/routes/route';
import { useTranslation } from '../../../../contexts/LocaleContext';
import type { ReadSavedVoucherDTO } from '../types/customerVoucher';
import { formatDateTime, formatVnd } from '../../utils/voucherHelpers';

const WALLET_STATUS_STYLES: Record<string, string> = {
  Available: 'bg-emerald-100 text-emerald-700',
  Used: 'bg-slate-200 text-slate-600',
  Expired: 'bg-amber-100 text-amber-700',
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  Available: 'voucher.tabAvailable',
  Used: 'voucher.tabUsed',
  Expired: 'voucher.tabExpired',
};

interface VoucherWalletCardProps {
  voucher: ReadSavedVoucherDTO;
  onCopy?: (code: string) => void;
}

export const VoucherWalletCard: React.FC<VoucherWalletCardProps> = ({ voucher, onCopy }) => {
  const { t } = useTranslation();
  const isUsable =
    voucher.status === 'Available' &&
    voucher.isActive &&
    voucher.voucherStatus === 'Active' &&
    voucher.quantity > 0;

  const getDaysUntilExpiry = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return t('voucher.walletExpired');
    if (days === 0) return t('voucher.walletExpiresToday');
    if (days === 1) return t('voucher.walletExpiresTomorrow');
    if (days <= 7) return t('voucher.walletExpiresInDays', { days });
    return null;
  };

  const expiryHint = getDaysUntilExpiry(voucher.endDate);
  const isPercent = voucher.discountType.toLowerCase() === 'percent';
  const statusLabelKey = STATUS_LABEL_KEYS[voucher.status];

  return (
    <div className={`group relative flex overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
      isUsable ? 'border-slate-200 hover:border-brand/40 hover:shadow-md' : 'border-slate-100 opacity-75'
    }`}>
      <div className="relative flex w-[88px] shrink-0 flex-col items-center justify-center bg-gradient-to-b from-brand to-brand-hover px-2 py-4 text-white">
        <div className="text-center">
          <div className="text-2xl font-black leading-none">
            {isPercent ? `${voucher.discountValue}%` : formatVnd(voucher.discountValue).replace(/\s?₫/, '')}
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-90">
            {isPercent ? t('voucher.walletOff') : 'VND'}
          </div>
          {isPercent && voucher.maxDiscountAmount && (
            <div className="mt-2 text-[9px] font-medium leading-tight opacity-80">
              {t('voucher.walletMax', { amount: formatVnd(voucher.maxDiscountAmount) })}
            </div>
          )}
        </div>
        <div className="absolute -right-1.5 top-3 h-3 w-3 rounded-full bg-slate-50" />
        <div className="absolute -right-1.5 bottom-3 h-3 w-3 rounded-full bg-slate-50" />
      </div>

      <div className="w-0 border-l border-dashed border-slate-200" />

      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-black tracking-wider text-slate-900">{voucher.code}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              WALLET_STATUS_STYLES[voucher.status] ?? 'bg-slate-100 text-slate-600'
            }`}>{statusLabelKey ? t(statusLabelKey) : voucher.status}</span>
            {voucher.quantity > 1 && (
              <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand">x{voucher.quantity}</span>
            )}
          </div>

          {voucher.description && (
            <p className="mb-2 line-clamp-2 text-xs text-slate-500">{voucher.description}</p>
          )}

          <div className="space-y-1 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">
                {voucher.tourName ? t('voucher.forTour', { name: voucher.tourName }) : t('voucher.walletAllTours')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>{t('voucher.walletValidUntil', { date: formatDateTime(voucher.endDate) })}</span>
            </div>
            {voucher.voucherStatus === 'Scheduled' && (
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="h-3.5 w-3.5 shrink-0 text-brand" />
                <span className="font-semibold text-brand">
                  Starts on {formatDateTime(voucher.startDate)}
                </span>
              </div>
            )}
            {voucher.minOrderAmount && voucher.minOrderAmount > 0 && (
              <div className="mt-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 inline-block">
                {t('voucher.minOrderHint', { amount: formatVnd(voucher.minOrderAmount) })}
              </div>
            )}
          </div>

          {expiryHint && isUsable && (
            <p className="mt-2 text-xs font-semibold text-rose-500">{expiryHint}</p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => onCopy?.(voucher.code)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Copy className="h-3.5 w-3.5" /> {t('voucher.copy')}
          </button>

          {isUsable && (
            <Link
              to={voucher.tourId ? PATH.PUBLIC.TOUR_DETAIL(voucher.tourId) : PATH.PUBLIC.TOUR_SEARCH}
              className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-hover !no-underline"
            >
              <TicketPercent className="h-3.5 w-3.5" />
              {voucher.tourId ? t('voucher.useNow') : t('voucher.browseTours')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
