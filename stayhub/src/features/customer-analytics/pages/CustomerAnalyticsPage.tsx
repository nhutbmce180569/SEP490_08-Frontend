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
import { CustomerDetailDrawer } from '../components/CustomerDetailDrawer';
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
  formatDate,
  formatNumber,
  formatPercent,
} from '../utils/analyticsHelpers';

const TABS: { id: AnalyticsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'demographics', label: 'Demographics', icon: <Users className="h-4 w-4" /> },
  { id: 'segments', label: 'Segments', icon: <UserCheck className="h-4 w-4" /> },
  { id: 'engagement', label: 'Engagement', icon: <Heart className="h-4 w-4" /> },
  { id: 'customers', label: 'Customers', icon: <ShoppingCart className="h-4 w-4" /> },
];

export const CustomerAnalyticsPage: React.FC = () => {
  const { preset, setPreset, from, setFrom, to, setTo, dateParams } = useDateRangeState();
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
              label: 'New Registrations',
              data: trends.registrationTrend.map((p) => p.count),
              color: '#0068E0',
            },
            {
              label: 'Orders',
              data: trends.orderTrend.map((p) => p.count),
              color: '#10b981',
            },
            {
              label: 'Revenue (M ₫)',
              data: trends.revenueTrend.map((p) => Math.round((p.amount ?? 0) / 1_000_000)),
              color: '#f59e0b',
            },
          ]
        : [],
    [trends],
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Customer Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Customer behavior, revenue, and engagement insights
            {overview && (
              <span className="ml-1">
                · {formatDate(overview.periodFrom)} – {formatDate(overview.periodTo)}
              </span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {activeTab !== 'engagement' && (
        <section className="rounded-2xl bg-white p-4 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
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

      <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white p-1.5 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-[#0068E0] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
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
                  label="Total Customers"
                  value={formatNumber(overview.totalCustomers)}
                  subLabel={`${formatNumber(overview.activeCustomers)} active`}
                  icon={<Users className="h-5 w-5 text-indigo-500" />}
                  iconBgClass="bg-indigo-50"
                />
                <StatCard
                  label="New Customers"
                  value={formatNumber(overview.newCustomersInPeriod)}
                  subLabel="In selected period"
                  icon={<UserPlus className="h-5 w-5 text-blue-500" />}
                  iconBgClass="bg-blue-50"
                />
                <StatCard
                  label="Revenue"
                  value={formatCompactVnd(overview.totalRevenue)}
                  subLabel={`AOV: ${formatCompactVnd(overview.averageOrderValue)}`}
                  icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
                  iconBgClass="bg-emerald-50"
                />
                <StatCard
                  label="Orders"
                  value={formatNumber(overview.totalOrders)}
                  subLabel={`${formatNumber(overview.paidOrders)} paid · ${formatNumber(overview.completedOrders)} completed`}
                  icon={<ShoppingCart className="h-5 w-5 text-amber-500" />}
                  iconBgClass="bg-amber-50"
                />
                <StatCard
                  label="Unique Buyers"
                  value={formatNumber(overview.uniqueBuyers)}
                  subLabel={`Conversion rate: ${formatPercent(overview.buyerConversionRate)}`}
                  icon={<UserCheck className="h-5 w-5 text-violet-500" />}
                  iconBgClass="bg-violet-50"
                />
                <StatCard
                  label="Repeat Customers"
                  value={formatNumber(overview.repeatCustomers)}
                  subLabel={`Rate: ${formatPercent(overview.repeatCustomerRate)}`}
                  icon={<RefreshCw className="h-5 w-5 text-cyan-500" />}
                  iconBgClass="bg-cyan-50"
                />
                <StatCard
                  label="Engagement"
                  value={formatNumber(overview.totalReviews)}
                  subLabel={`${formatNumber(overview.totalWishlists)} wishlists · Rating ${overview.averageReviewRating.toFixed(1)}★`}
                  icon={<Star className="h-5 w-5 text-amber-500" />}
                  iconBgClass="bg-amber-50"
                />
                <StatCard
                  label="Cancellation Rate"
                  value={formatPercent(overview.cancellationRate)}
                  subLabel={`Refunds: ${formatCompactVnd(overview.totalRefundAmount)}`}
                  icon={<UserX className="h-5 w-5 text-rose-500" />}
                  iconBgClass="bg-rose-50"
                />
              </div>

              <section className="rounded-2xl bg-white p-5 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900">Trends Over Time</h3>
                  <select
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value as Granularity)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
                  >
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
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
                  <h3 className="text-lg font-bold text-slate-900">Top Spenders</h3>
                  <p className="text-sm text-slate-500">Top 10 customers by total spend in the selected period</p>
                </div>
                <TopCustomersTable
                  customers={topCustomersQuery.data ?? []}
                  isLoading={topCustomersQuery.isLoading}
                  onViewCustomer={setSelectedCustomerId}
                />
              </section>
            </>
          ) : (
            <ErrorState message="Unable to load overview data." onRetry={handleRefresh} />
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
                <MiniStat label="Total Customers" value={formatNumber(demographicsQuery.data.totalCustomers)} />
                <MiniStat label="Active" value={formatNumber(demographicsQuery.data.activeCustomers)} />
                <MiniStat label="Inactive" value={formatNumber(demographicsQuery.data.inactiveCustomers)} />
                <MiniStat label="New" value={formatNumber(demographicsQuery.data.newCustomersInPeriod)} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <DistributionChart title="By Gender" data={demographicsQuery.data.byGender} />
                <DistributionChart title="By Age Group" data={demographicsQuery.data.byAgeGroup} />
                <DistributionChart title="By Sign-up Provider" data={demographicsQuery.data.byProvider} />
                <DistributionChart title="By Status" data={demographicsQuery.data.byStatus} />
              </div>
            </>
          ) : (
            <ErrorState message="Unable to load demographics data." onRetry={handleRefresh} />
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
                  label="Never Purchased"
                  count={segmentsQuery.data.neverPurchased}
                  description="No paid/completed orders"
                  colorClass="bg-slate-100 text-slate-500"
                  icon={<UserX className="h-5 w-5" />}
                />
                <SegmentCard
                  label="One-Time Buyer"
                  count={segmentsQuery.data.oneTimeBuyers}
                  description="Exactly 1 paid/completed order"
                  colorClass="bg-blue-50 text-blue-500"
                  icon={<ShoppingCart className="h-5 w-5" />}
                />
                <SegmentCard
                  label="Repeat Buyer"
                  count={segmentsQuery.data.repeatBuyers}
                  description="≥ 2 paid/completed orders"
                  colorClass="bg-emerald-50 text-emerald-500"
                  icon={<RefreshCw className="h-5 w-5" />}
                />
                <SegmentCard
                  label="New Buyers"
                  count={segmentsQuery.data.newBuyersInPeriod}
                  description="First purchase in period"
                  colorClass="bg-indigo-50 text-indigo-500"
                  icon={<UserPlus className="h-5 w-5" />}
                />
                <SegmentCard
                  label="At Risk"
                  count={segmentsQuery.data.atRiskCustomers}
                  description="No purchase in 90+ days"
                  colorClass="bg-rose-50 text-rose-500"
                  icon={<AlertTriangle className="h-5 w-5" />}
                />
                <SegmentCard
                  label="High Value"
                  count={segmentsQuery.data.highValueCustomers}
                  description="Top 20% by spend"
                  colorClass="bg-amber-50 text-amber-500"
                  icon={<Crown className="h-5 w-5" />}
                />
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
                <div className="text-sm font-semibold text-slate-600">
                  Buyer conversion rate:{' '}
                  <span className="text-lg font-bold text-[#0068E0]">
                    {formatPercent(segmentsQuery.data.buyerConversionRate)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DistributionChart
                  title="Order Status Distribution"
                  data={segmentsQuery.data.orderStatusDistribution}
                />
                <DistributionChart
                  title="Customer Rating Distribution"
                  data={segmentsQuery.data.ratingDistribution}
                />
              </div>
            </>
          ) : (
            <ErrorState message="Unable to load segment data." onRetry={handleRefresh} />
          )}
        </div>
      )}

      {activeTab === 'engagement' && (
        <EngagementPanel data={engagementQuery.data} isLoading={engagementQuery.isLoading} />
      )}

      {activeTab === 'customers' && (
        <CustomerListPanel dateParams={dateParams} onViewCustomer={setSelectedCustomerId} />
      )}

      <CustomerDetailDrawer
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
}) => (
  <div className="rounded-2xl bg-white p-12 text-center shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
    <p className="text-sm text-rose-600">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-4 rounded-xl bg-[#0068E0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0058c0]"
    >
      Try Again
    </button>
  </div>
);

export default CustomerAnalyticsPage;
