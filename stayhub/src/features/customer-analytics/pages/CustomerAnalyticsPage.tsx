import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Crown,
  DollarSign,
  Heart,
  RefreshCw,
  ShoppingCart,
  Star,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import { DateRangeFilter, useDateRangeState } from '../components/DateRangeFilter';
import { DistributionChart, SegmentCard } from '../components/DistributionChart';
import { EngagementPanel } from '../components/EngagementPanel';
import { StatCard } from '../components/StatCard';
import { TrendLineChart } from '../components/TrendLineChart';
import { TopCustomersTable } from '../components/TopCustomersTable';
import { CustomerListPanel } from '../components/CustomerListPanel';
import { CustomerDetailModal } from '../components/CustomerDetailDrawer';
import {
  useAnalyticsDemographics,
  useAnalyticsEngagement,
  useAnalyticsOverview,
  useAnalyticsSegments,
  useAnalyticsTrends,
  useTopCustomers,
} from '../hooks/useCustomerAnalytics';
import type { AnalyticsTab, Granularity } from '../types/customerAnalytics.types';
import {
  formatCompactVnd,
  formatCompactAnalyticsMoney,
  formatDate,
  formatNumber,
  formatPercent,
} from '../utils/analyticsHelpers';
import { useTranslation } from '../../../contexts/LocaleContext';
import { useCurrency } from '../../currency/CurrencyContext';

export const CustomerAnalyticsPage: React.FC = () => {
  const { t, locale } = useTranslation();
  const { mode, usdToVndRate } = useCurrency();
  const { preset, setPreset, from, setFrom, to, setTo, dateParams } = useDateRangeState();

  const TABS = useMemo<{ id: AnalyticsTab; label: string; icon: React.ReactNode }[]>(
    () => [
      { id: 'overview', label: t('analytics.tabs.overview'), icon: <BarChart3 className="h-4 w-4" /> },
      { id: 'demographics', label: t('analytics.tabs.demographics'), icon: <Users className="h-4 w-4" /> },
      { id: 'segments', label: t('analytics.tabs.segments'), icon: <UserCheck className="h-4 w-4" /> },
      { id: 'engagement', label: t('analytics.tabs.engagement'), icon: <Heart className="h-4 w-4" /> },
      { id: 'customers', label: t('analytics.tabs.customers'), icon: <ShoppingCart className="h-4 w-4" /> },
    ],
    [t],
  );
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const overviewQuery = useAnalyticsOverview(dateParams);
  const demographicsQuery = useAnalyticsDemographics(dateParams);
  const segmentsQuery = useAnalyticsSegments(dateParams);
  const trendsQuery = useAnalyticsTrends({ ...dateParams, granularity });
  const topCustomersQuery = useTopCustomers({ ...dateParams, top: 10 });
  const engagementQuery = useAnalyticsEngagement();

  const overview = overviewQuery.data;
  const trends = trendsQuery.data;

  const trendLabels = useMemo(
    () => trends?.registrationTrend.map((p) => p.period) ?? [],
    [trends],
  );

  const trendSeries = useMemo(
    () =>
      trends
        ? [
            {
              label: t('analytics.customer.newRegistrations'),
              data: trends.registrationTrend.map((p) => p.count),
              color: 'var(--color-brand)',
            },
            {
              label: t('analytics.customer.orders'),
              data: trends.orderTrend.map((p) => p.count),
              color: '#10b981',
            },
            {
              label: t('analytics.customer.revenueSeries'),
              data: trends.revenueTrend.map((p) => Math.round((p.amount ?? 0) / 1_000_000)),
              color: '#f59e0b',
            },
          ]
        : [],
    [trends, t],
  );

  const isRefreshing =
    overviewQuery.isFetching ||
    demographicsQuery.isFetching ||
    segmentsQuery.isFetching ||
    trendsQuery.isFetching;

  const handleRefresh = () => {
    overviewQuery.refetch();
    demographicsQuery.refetch();
    segmentsQuery.refetch();
    trendsQuery.refetch();
    topCustomersQuery.refetch();
    engagementQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand">
            {t('analytics.customer.eyebrow')}
          </span>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            {t('analytics.customer.title')}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {t('analytics.customer.subtitle')}
            {overview && (
              <span className="ml-1.5 font-bold text-slate-700">
                · {formatDate(overview.periodFrom, locale)} – {formatDate(overview.periodTo, locale)}
              </span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-brand ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('analytics.refresh')}
        </button>
      </div>

      {activeTab !== 'engagement' && (
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.04)]">
          <DateRangeFilter
            preset={preset}
            from={from}
            to={to}
            onPresetChange={setPreset}
            onFromChange={setFrom}
            onToChange={setTo}
          />
        </section>
      )}

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.04)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-brand text-white shadow-md shadow-brand/20 scale-[1.02]'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {overviewQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : overview ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label={t('analytics.customer.totalCustomers')}
                  value={formatNumber(overview.totalCustomers)}
                  subLabel={t('analytics.customer.activeSub', { count: formatNumber(overview.activeCustomers) })}
                  icon={<Users className="h-5 w-5 text-indigo-500" />}
                  iconBgClass="bg-indigo-50"
                />
                <StatCard
                  label={t('analytics.customer.newCustomers')}
                  value={formatNumber(overview.newCustomersInPeriod)}
                  subLabel={t('analytics.customer.inSelectedPeriod')}
                  icon={<UserPlus className="h-5 w-5 text-brand" />}
                  iconBgClass="bg-brand-light"
                />
                <StatCard
                  label={t('analytics.customer.revenue')}
                  value={formatCompactAnalyticsMoney(overview.totalRevenue, mode, usdToVndRate)}
                  subLabel={t('analytics.customer.aovSub', { value: formatCompactAnalyticsMoney(overview.averageOrderValue, mode, usdToVndRate) })}
                  icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
                  iconBgClass="bg-emerald-50"
                />
                <StatCard
                  label={t('analytics.customer.orders')}
                  value={formatNumber(overview.totalOrders)}
                  subLabel={t('analytics.customer.ordersSub', {
                    paid: formatNumber(overview.paidOrders),
                    completed: formatNumber(overview.completedOrders),
                  })}
                  icon={<ShoppingCart className="h-5 w-5 text-amber-500" />}
                  iconBgClass="bg-amber-50"
                />
                <StatCard
                  label={t('analytics.customer.uniqueBuyers')}
                  value={formatNumber(overview.uniqueBuyers)}
                  subLabel={t('analytics.customer.conversionSub', {
                    rate: formatPercent(overview.buyerConversionRate),
                  })}
                  icon={<UserCheck className="h-5 w-5 text-violet-500" />}
                  iconBgClass="bg-violet-50"
                />
                <StatCard
                  label={t('analytics.customer.repeatCustomers')}
                  value={formatNumber(overview.repeatCustomers)}
                  subLabel={t('analytics.customer.rateSub', {
                    rate: formatPercent(overview.repeatCustomerRate),
                  })}
                  icon={<RefreshCw className="h-5 w-5 text-cyan-500" />}
                  iconBgClass="bg-cyan-50"
                />
                <StatCard
                  label={t('analytics.customer.engagement')}
                  value={formatNumber(overview.totalReviews)}
                  subLabel={t('analytics.customer.engagementSub', {
                    wishlists: formatNumber(overview.totalWishlists),
                    rating: overview.averageReviewRating.toFixed(1),
                  })}
                  icon={<Star className="h-5 w-5 text-amber-500" />}
                  iconBgClass="bg-amber-50"
                />
                <StatCard
                  label={t('analytics.customer.cancellationRate')}
                  value={formatPercent(overview.cancellationRate)}
                  subLabel={t('analytics.customer.refundsSub', {
                    amount: formatCompactAnalyticsMoney(overview.totalRefundAmount, mode, usdToVndRate),
                  })}
                  icon={<UserX className="h-5 w-5 text-rose-500" />}
                  iconBgClass="bg-rose-50"
                />
              </div>

              <section className="rounded-2xl bg-white p-5 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{t('analytics.customer.trendsOverTime')}</h3>
                  <select
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value as Granularity)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
                  >
                    <option value="day">{t('analytics.customer.daily')}</option>
                    <option value="week">{t('analytics.customer.weekly')}</option>
                    <option value="month">{t('analytics.customer.monthly')}</option>
                  </select>
                </div>
                {trendsQuery.isLoading ? (
                  <div className="h-[280px] animate-pulse rounded-xl bg-slate-100" />
                ) : (
                  <TrendLineChart
                    labels={trendLabels}
                    series={trendSeries}
                    granularity={granularity}
                  />
                )}
              </section>

              <section className="rounded-2xl bg-white shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h3 className="text-lg font-bold text-slate-900">{t('analytics.customer.topSpenders')}</h3>
                  <p className="text-sm text-slate-500">{t('analytics.customer.topSpendersDesc')}</p>
                </div>
                <TopCustomersTable
                  customers={topCustomersQuery.data ?? []}
                  isLoading={topCustomersQuery.isLoading}
                  onViewCustomer={setSelectedCustomerId}
                />
              </section>
            </>
          ) : (
            <ErrorState message={t('analytics.customer.errorOverview')} onRetry={handleRefresh} />
          )}
        </div>
      )}

      {activeTab === 'demographics' && (
        <div className="space-y-6">
          {demographicsQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : demographicsQuery.data ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <MiniStat label={t('analytics.customer.totalCustomers')} value={formatNumber(demographicsQuery.data.totalCustomers)} />
                <MiniStat label={t('analytics.customer.active')} value={formatNumber(demographicsQuery.data.activeCustomers)} />
                <MiniStat label={t('analytics.platform.inactive')} value={formatNumber(demographicsQuery.data.inactiveCustomers)} />
                <MiniStat label={t('analytics.customer.new')} value={formatNumber(demographicsQuery.data.newCustomersInPeriod)} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <DistributionChart title={t('analytics.customer.byGender')} data={demographicsQuery.data.byGender} />
                <DistributionChart title={t('analytics.customer.byAgeGroup')} data={demographicsQuery.data.byAgeGroup} />
                <DistributionChart title={t('analytics.customer.bySignUpProvider')} data={demographicsQuery.data.byProvider} />
                <DistributionChart title={t('analytics.customer.byStatus')} data={demographicsQuery.data.byStatus} />
              </div>
            </>
          ) : (
            <ErrorState message={t('analytics.customer.errorDemographics')} onRetry={handleRefresh} />
          )}
        </div>
      )}

      {activeTab === 'segments' && (
        <div className="space-y-6">
          {segmentsQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : segmentsQuery.data ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SegmentCard
                  label={t('analytics.customer.neverPurchased')}
                  count={segmentsQuery.data.neverPurchased}
                  description={t('analytics.customer.neverPurchasedDesc')}
                  colorClass="bg-slate-100 text-slate-500"
                  icon={<UserX className="h-5 w-5" />}
                />
                <SegmentCard
                  label={t('analytics.customer.oneTimeBuyer')}
                  count={segmentsQuery.data.oneTimeBuyers}
                  description={t('analytics.customer.oneTimeBuyerDesc')}
                  colorClass="bg-brand-light text-brand"
                  icon={<ShoppingCart className="h-5 w-5" />}
                />
                <SegmentCard
                  label={t('analytics.customer.repeatBuyer')}
                  count={segmentsQuery.data.repeatBuyers}
                  description={t('analytics.customer.repeatBuyerDesc')}
                  colorClass="bg-emerald-50 text-emerald-500"
                  icon={<RefreshCw className="h-5 w-5" />}
                />
                <SegmentCard
                  label={t('analytics.customer.newBuyers')}
                  count={segmentsQuery.data.newBuyersInPeriod}
                  description={t('analytics.customer.newBuyersDesc')}
                  colorClass="bg-indigo-50 text-indigo-500"
                  icon={<UserPlus className="h-5 w-5" />}
                />
                <SegmentCard
                  label={t('analytics.customer.atRisk')}
                  count={segmentsQuery.data.atRiskCustomers}
                  description={t('analytics.customer.atRiskDesc')}
                  colorClass="bg-rose-50 text-rose-500"
                  icon={<AlertTriangle className="h-5 w-5" />}
                />
                <SegmentCard
                  label={t('analytics.customer.highValue')}
                  count={segmentsQuery.data.highValueCustomers}
                  description={t('analytics.customer.highValueDesc')}
                  colorClass="bg-amber-50 text-amber-500"
                  icon={<Crown className="h-5 w-5" />}
                />
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
                <div className="text-sm font-semibold text-slate-600">
                  {t('analytics.customer.buyerConversionRate')}{' '}
                  <span className="text-lg font-bold text-brand">
                    {formatPercent(segmentsQuery.data.buyerConversionRate)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DistributionChart
                  title={t('analytics.customer.orderStatusDist')}
                  data={segmentsQuery.data.orderStatusDistribution}
                />
                <DistributionChart
                  title={t('analytics.customer.ratingDist')}
                  data={segmentsQuery.data.ratingDistribution}
                />
              </div>
            </>
          ) : (
            <ErrorState message={t('analytics.customer.errorSegments')} onRetry={handleRefresh} />
          )}
        </div>
      )}

      {activeTab === 'engagement' && (
        <EngagementPanel data={engagementQuery.data} isLoading={engagementQuery.isLoading} />
      )}

      {activeTab === 'customers' && (
        <CustomerListPanel dateParams={dateParams} onViewCustomer={setSelectedCustomerId} />
      )}

      <CustomerDetailModal
        customerId={selectedCustomerId}
        dateParams={dateParams}
        onClose={() => setSelectedCustomerId(null)}
      />
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl bg-white p-4 text-center shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
  </div>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl bg-white p-12 text-center shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
      <p className="text-sm text-rose-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#0058c0]"
      >
        {t('analytics.tryAgain')}
      </button>
    </div>
  );
};

export default CustomerAnalyticsPage;
