import React from 'react';
import {
  AlertTriangle,
  Crown,
  Mail,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';
import { getImg } from '../../../config/api/api';
import { useCustomerDetail } from '../hooks/useCustomerAnalytics';
import type { DateRangeParams } from '../types/customerAnalytics.types';
import {
  formatCompactVnd,
  formatDate,
  formatDateTime,
  formatNumber,
  getSegmentLabel,
  SEGMENT_STYLES,
  STATUS_STYLES,
} from '../utils/analyticsHelpers';
import { useTranslation } from '../../../contexts/LocaleContext';

interface CustomerDetailDrawerProps {
  customerId: number | null;
  dateParams: DateRangeParams;
  onClose: () => void;
}

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  customerId,
  dateParams,
  onClose,
}) => {
  const { t, locale } = useTranslation();
  const { data, isLoading, error } = useCustomerDetail(customerId, dateParams);

  const getSegmentLabelTranslated = (segment: string) => {
    if (segment === 'NeverPurchased') return t('analytics.customer.neverPurchased');
    if (segment === 'OneTimeBuyer') return t('analytics.customer.oneTimeBuyer');
    if (segment === 'RepeatBuyer') return t('analytics.customer.repeatBuyer');
    return segment;
  };

  const getStatusLabelTranslated = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'active') return t('analytics.customer.activeStatus');
    if (s === 'blocked') return t('analytics.customer.blockedStatus');
    if (s === 'inactive') return t('analytics.customer.inactiveStatus');
    return status;
  };

  const getGenderLabelTranslated = (gender?: string | null) => {
    if (!gender) return '—';
    const g = gender.toLowerCase();
    if (g === 'male') return t('analytics.customer.genderMale');
    if (g === 'female') return t('analytics.customer.genderFemale');
    if (g === 'other') return t('analytics.customer.genderOther');
    return gender;
  };

  const getProviderLabelTranslated = (provider?: string | null) => {
    if (!provider) return '—';
    const p = provider.toLowerCase();
    if (p === 'local') return t('analytics.customer.providerLocal');
    if (p === 'google') return t('analytics.customer.providerGoogle');
    if (p === 'facebook') return t('analytics.customer.providerFacebook');
    return provider;
  };

  if (customerId === null) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t('common.close')}
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl border-l border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{t('analytics.customer.customerDetails')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm font-medium text-rose-600 bg-rose-50 p-4 rounded-xl">{t('analytics.customer.loadCustomerError')}</p>
          ) : data ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {data.avatarUrl ? (
                  <img
                    src={getImg(data.avatarUrl)}
                    alt={data.fullName}
                    className="h-16 w-16 rounded-full border border-slate-200 object-cover shadow-sm"
                  />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-xl font-black text-brand shadow-sm">
                    {data.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-lg font-bold text-slate-900">{data.fullName}</div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-0.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {data.email}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                        SEGMENT_STYLES[data.customerSegment] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {getSegmentLabelTranslated(data.customerSegment)}
                    </span>
                    {data.status && (
                      <span
                        className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                          STATUS_STYLES[data.status] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {getStatusLabelTranslated(data.status)}
                      </span>
                    )}
                    {data.isHighValue && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200/60">
                        <Crown className="h-3 w-3 text-amber-500 fill-amber-400" /> {t('analytics.customer.highValue')}
                      </span>
                    )}
                    {data.isAtRisk && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200/60">
                        <AlertTriangle className="h-3 w-3 text-rose-500" /> {t('analytics.customer.atRisk')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetricBox label={t('analytics.customer.totalSpend')} value={formatCompactVnd(data.totalSpend)} />
                <MetricBox label={t('analytics.customer.orders')} value={formatNumber(data.paidOrders)} sub={t('analytics.customer.ordersTotalSub', { total: data.totalOrders })} />
                <MetricBox label={t('analytics.customer.avgOrderValue')} value={formatCompactVnd(data.averageOrderValue)} />
                <MetricBox label={t('analytics.customer.ticketsPurchased')} value={formatNumber(data.totalTickets)} />
                <MetricBox label={t('analytics.customer.reviews')} value={formatNumber(data.reviewCount)} icon={<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />} />
                <MetricBox label={t('analytics.customer.wishlist')} value={formatNumber(data.wishlistCount)} />
              </div>

              <InfoSection title={t('analytics.customer.personalInformation')}>
                <InfoRow label={t('analytics.customer.gender')} value={getGenderLabelTranslated(data.gender)} />
                <InfoRow label={t('analytics.customer.dateOfBirth')} value={formatDate(data.dateOfBirth, locale)} />
                <InfoRow label={t('analytics.customer.signUpProvider')} value={getProviderLabelTranslated(data.provider)} />
                <InfoRow label={t('analytics.customer.joined')} value={formatDateTime(data.createdAt, locale)} />
                <InfoRow label={t('analytics.customer.lastActive')} value={formatDateTime(data.lastOnline, locale)} />
              </InfoSection>

              <InfoSection title={t('analytics.customer.purchaseHistory')}>
                <InfoRow label={t('analytics.customer.firstOrder')} value={formatDateTime(data.firstOrderAt, locale)} />
                <InfoRow label={t('analytics.customer.lastOrder')} value={formatDateTime(data.lastOrderAt, locale)} />
                <InfoRow label={t('analytics.customer.pendingOrders')} value={formatNumber(data.pendingOrders)} />
                <InfoRow label={t('analytics.customer.cancelledOrders')} value={formatNumber(data.cancelledOrders)} />
                {data.averageRatingGiven != null && (
                  <InfoRow
                    label={t('analytics.customer.averageRatingGiven')}
                    value={`${data.averageRatingGiven.toFixed(1)} ★`}
                  />
                )}
              </InfoSection>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
};

const MetricBox: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}> = ({ label, value, sub, icon }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
    <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
      {icon}
      {label}
    </div>
    <div className="mt-1 text-lg font-bold text-slate-900">
      {value}
      {sub && <span className="text-sm font-medium text-slate-400">{sub}</span>}
    </div>
  </div>
);

const InfoSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
      <ShoppingBag className="h-4 w-4 text-brand" />
      {title}
    </h3>
    <div className="space-y-2 rounded-xl border border-slate-100 p-4">{children}</div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-slate-800">{value}</span>
  </div>
);
