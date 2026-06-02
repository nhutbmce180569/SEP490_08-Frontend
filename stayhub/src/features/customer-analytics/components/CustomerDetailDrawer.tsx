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
  const { data, isLoading, error } = useCustomerDetail(customerId, dateParams);

  if (customerId === null) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close detail"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Customer Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600">Unable to load customer information.</p>
          ) : data ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {data.avatarUrl ? (
                  <img
                    src={getImg(data.avatarUrl)}
                    alt={data.fullName}
                    className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-[#0068E0]/10 text-xl font-bold text-[#0068E0]">
                    {data.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-lg font-bold text-slate-900">{data.fullName}</div>
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    {data.email}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${SEGMENT_STYLES[data.customerSegment] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {getSegmentLabel(data.customerSegment)}
                    </span>
                    {data.status && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[data.status] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {data.status}
                      </span>
                    )}
                    {data.isHighValue && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-600">
                        <Crown className="h-3 w-3" /> High Value
                      </span>
                    )}
                    {data.isAtRisk && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600">
                        <AlertTriangle className="h-3 w-3" /> At Risk
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetricBox label="Total Spend" value={formatCompactVnd(data.totalSpend)} />
                <MetricBox label="Orders" value={formatNumber(data.paidOrders)} sub={`/${data.totalOrders} total`} />
                <MetricBox label="Avg. Order Value" value={formatCompactVnd(data.averageOrderValue)} />
                <MetricBox label="Tickets Purchased" value={formatNumber(data.totalTickets)} />
                <MetricBox label="Reviews" value={formatNumber(data.reviewCount)} icon={<Star className="h-3.5 w-3.5 text-amber-500" />} />
                <MetricBox label="Wishlist" value={formatNumber(data.wishlistCount)} />
              </div>

              <InfoSection title="Personal Information">
                <InfoRow label="Gender" value={data.gender ?? '—'} />
                <InfoRow label="Date of Birth" value={formatDate(data.dateOfBirth)} />
                <InfoRow label="Sign-up Provider" value={data.provider ?? '—'} />
                <InfoRow label="Joined" value={formatDateTime(data.createdAt)} />
                <InfoRow label="Last Active" value={formatDateTime(data.lastOnline)} />
              </InfoSection>

              <InfoSection title="Purchase History">
                <InfoRow label="First Order" value={formatDateTime(data.firstOrderAt)} />
                <InfoRow label="Last Order" value={formatDateTime(data.lastOrderAt)} />
                <InfoRow label="Pending Orders" value={formatNumber(data.pendingOrders)} />
                <InfoRow label="Cancelled Orders" value={formatNumber(data.cancelledOrders)} />
                {data.averageRatingGiven != null && (
                  <InfoRow
                    label="Average Rating Given"
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
      <ShoppingBag className="h-4 w-4 text-[#0068E0]" />
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
