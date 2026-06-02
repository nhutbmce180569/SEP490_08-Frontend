import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  Building2,
  Heart,
  Map,
  RefreshCw,
  Shield,
  Ticket,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  DateRangeFilter,
  useDateRangeState,
} from '../../customer-analytics/components/DateRangeFilter';
import {
  DistributionChart,
  SegmentCard,
} from '../../customer-analytics/components/DistributionChart';
import {
  formatDate,
  formatNumber,
  formatPercent,
} from '../../customer-analytics/utils/analyticsHelpers';
import {
  AnalyticsPanel,
  ChartGrid,
  ErrorState,
  LoadingPanel,
  MetricGroup,
  MetricStrip,
} from '../components/AnalyticsLayout';
import { HealthPanel } from '../components/HealthPanel';
import { TopToursTable } from '../components/TopToursTable';
import {
  usePlatformCatalog,
  usePlatformHealth,
  usePlatformOverview,
  usePlatformSocial,
  usePlatformUsers,
  usePlatformVouchers,
} from '../hooks/usePlatformAnalytics';
import type { PlatformAnalyticsTab } from '../types/platformAnalytics.types';
import { getRoleLabel, resolveCategoryLabels } from '../utils/platformHelpers';
import { getAllCategories } from '../../content/services/category.service';

const TABS: { id: PlatformAnalyticsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
  { id: 'catalog', label: 'Catalog', icon: <Map className="h-4 w-4" /> },
  { id: 'vouchers', label: 'Vouchers', icon: <Ticket className="h-4 w-4" /> },
  { id: 'social', label: 'Social', icon: <Heart className="h-4 w-4" /> },
  { id: 'health', label: 'Health', icon: <Activity className="h-4 w-4" /> },
];

const DATE_FILTER_TABS: PlatformAnalyticsTab[] = ['overview', 'users', 'health'];

export const PlatformAnalyticsPage: React.FC = () => {
  const { preset, setPreset, from, setFrom, to, setTo, dateParams } = useDateRangeState();
  const [activeTab, setActiveTab] = useState<PlatformAnalyticsTab>('overview');
  const [catalogTop, setCatalogTop] = useState(10);

  const overviewQuery = usePlatformOverview(dateParams);
  const usersQuery = usePlatformUsers(dateParams);
  const catalogQuery = usePlatformCatalog({ top: catalogTop });
  const vouchersQuery = usePlatformVouchers();
  const socialQuery = usePlatformSocial();
  const healthQuery = usePlatformHealth(dateParams);

  const overview = overviewQuery.data;
  const usersByRole = useMemo(
    () =>
      usersQuery.data?.byRole.map((item) => ({
        ...item,
        label: getRoleLabel(item.label),
      })) ?? [],
    [usersQuery.data?.byRole],
  );

  const isRefreshing =
    overviewQuery.isFetching ||
    usersQuery.isFetching ||
    catalogQuery.isFetching ||
    vouchersQuery.isFetching ||
    socialQuery.isFetching ||
    healthQuery.isFetching;

  const handleRefresh = () => {
    overviewQuery.refetch();
    usersQuery.refetch();
    catalogQuery.refetch();
    vouchersQuery.refetch();
    socialQuery.refetch();
    healthQuery.refetch();
  };

  const showDateFilter = DATE_FILTER_TABS.includes(activeTab);
  const periodLabel =
    overview && showDateFilter
      ? `${formatDate(overview.periodFrom)} – ${formatDate(overview.periodTo)}`
      : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="travel-eyebrow">Admin · Analytics</p>
          <h1 className="travel-heading text-2xl md:text-3xl">Platform Analytics</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Unified view of users, catalog, promotions, social activity, and system health.
            {periodLabel && <span className="ml-1 text-slate-400">· {periodLabel}</span>}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <AnalyticsPanel padded={false}>
        <div className="border-b border-slate-100 px-2">
          <nav
            className="custom-scrollbar flex gap-1 overflow-x-auto"
            aria-label="Platform analytics sections"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand text-brand'
                    : 'border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {showDateFilter && (
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
            <DateRangeFilter
              preset={preset}
              from={from}
              to={to}
              onPresetChange={setPreset}
              onFromChange={setFrom}
              onToChange={setTo}
            />
          </div>
        )}

        <div className="p-5">
          {activeTab === 'overview' && (
            <OverviewTab
              isLoading={overviewQuery.isLoading}
              data={overview}
              onRetry={handleRefresh}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab
              isLoading={usersQuery.isLoading}
              data={usersQuery.data}
              byRole={usersByRole}
              onRetry={handleRefresh}
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogTab
              isLoading={catalogQuery.isLoading}
              data={catalogQuery.data}
              catalogTop={catalogTop}
              onTopChange={setCatalogTop}
              onRetry={handleRefresh}
            />
          )}

          {activeTab === 'vouchers' && (
            <VouchersTab
              isLoading={vouchersQuery.isLoading}
              data={vouchersQuery.data}
              onRetry={handleRefresh}
            />
          )}

          {activeTab === 'social' && (
            <SocialTab
              isLoading={socialQuery.isLoading}
              data={socialQuery.data}
              onRetry={handleRefresh}
            />
          )}

          {activeTab === 'health' && (
            <HealthTab
              isLoading={healthQuery.isLoading}
              data={healthQuery.data}
              onRetry={handleRefresh}
            />
          )}
        </div>
      </AnalyticsPanel>
    </div>
  );
};

const OverviewTab: React.FC<{
  isLoading: boolean;
  data: ReturnType<typeof usePlatformOverview>['data'];
  onRetry: () => void;
}> = ({ isLoading, data, onRetry }) => {
  if (isLoading) {
    return (
      <div className="space-y-5">
        <LoadingPanel height="h-24" />
        <LoadingPanel height="h-56" />
      </div>
    );
  }

  if (!data) return <ErrorState message="Unable to load platform overview." onRetry={onRetry} />;

  return (
    <div className="space-y-5">
      <MetricStrip
        columns={4}
        items={[
          {
            label: 'Total users',
            value: formatNumber(data.totalUsers),
            hint: `${formatNumber(data.activeUsers)} active`,
          },
          {
            label: 'Total tours',
            value: formatNumber(data.totalTours),
            hint: `${formatNumber(data.activeTours)} active`,
          },
          {
            label: 'Schedule occupancy',
            value: formatPercent(data.scheduleOccupancyRate),
            hint: `Check-in ${formatPercent(data.checkInRate)}`,
          },
          {
            label: 'Active vouchers',
            value: formatNumber(data.activeVouchers),
            hint: `${formatNumber(data.pendingCancellationRequests)} pending cancellations`,
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricGroup
          title="User ecosystem"
          items={[
            { label: 'New users', value: formatNumber(data.newUsersInPeriod) },
            { label: 'Managers', value: formatNumber(data.totalManagers) },
            { label: 'Staff', value: formatNumber(data.totalStaff) },
            { label: 'Active users', value: formatNumber(data.activeUsers) },
          ]}
        />
        <MetricGroup
          title="Tour catalog"
          items={[
            { label: 'Schedules', value: formatNumber(data.totalSchedules) },
            { label: 'Upcoming', value: formatNumber(data.upcomingSchedules) },
            { label: 'Occupancy', value: formatPercent(data.scheduleOccupancyRate) },
            { label: 'Check-in rate', value: formatPercent(data.checkInRate) },
          ]}
        />
        <MetricGroup
          title="Community & ops"
          items={[
            { label: 'Tour moments', value: formatNumber(data.totalTourMoments) },
            { label: 'Chat rooms', value: formatNumber(data.totalChatRooms) },
            { label: 'Active vouchers', value: formatNumber(data.activeVouchers) },
            { label: 'Pending cancellations', value: formatNumber(data.pendingCancellationRequests) },
          ]}
        />
      </div>
    </div>
  );
};

const UsersTab: React.FC<{
  isLoading: boolean;
  data: ReturnType<typeof usePlatformUsers>['data'];
  byRole: { label: string; count: number; percentage: number }[];
  onRetry: () => void;
}> = ({ isLoading, data, byRole, onRetry }) => {
  if (isLoading) {
    return (
      <div className="space-y-5">
        <LoadingPanel height="h-24" />
        <LoadingPanel height="h-64" />
      </div>
    );
  }

  if (!data) return <ErrorState message="Unable to load user analytics." onRetry={onRetry} />;

  return (
    <div className="space-y-5">
      <MetricStrip
        columns={5}
        items={[
          { label: 'Total users', value: formatNumber(data.totalUsers) },
          { label: 'Active', value: formatNumber(data.activeUsers), hint: 'Enabled accounts' },
          { label: 'Inactive', value: formatNumber(data.inactiveUsers) },
          { label: 'New in period', value: formatNumber(data.newUsersInPeriod) },
          {
            label: 'Online recently',
            value: formatNumber(data.onlineRecently),
            hint: 'Recent sessions',
          },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-3 xl:grid-cols-2">
          <SegmentCard
            label="Customers"
            count={data.totalCustomers}
            description="End-user accounts"
            colorClass="bg-brand-light text-brand"
            icon={<Users className="h-5 w-5" />}
          />
          <SegmentCard
            label="Managers"
            count={data.totalManagers}
            description="Tour operators"
            colorClass="bg-slate-100 text-slate-600"
            icon={<Building2 className="h-5 w-5" />}
          />
          <SegmentCard
            label="Staff"
            count={data.totalStaff}
            description="Operator team members"
            colorClass="bg-slate-100 text-slate-600"
            icon={<UserCheck className="h-5 w-5" />}
          />
          <SegmentCard
            label="Admins"
            count={data.totalAdmins}
            description="Platform administrators"
            colorClass="bg-slate-100 text-slate-600"
            icon={<Shield className="h-5 w-5" />}
          />
        </div>

        <div className="xl:col-span-2">
          <DistributionChart title="Users by role" data={byRole} />
        </div>
      </div>
    </div>
  );
};

const CatalogTab: React.FC<{
  isLoading: boolean;
  data: ReturnType<typeof usePlatformCatalog>['data'];
  catalogTop: number;
  onTopChange: (top: number) => void;
  onRetry: () => void;
}> = ({ isLoading, data, catalogTop, onTopChange, onRetry }) => {
  const { data: categoriesPage } = useQuery({
    queryKey: ['categories', 'platform-analytics'],
    queryFn: () => getAllCategories(1, 500),
    enabled: !!data,
  });

  const toursByCategory = useMemo(() => {
    if (!data) return [];

    const categoryNames = Object.fromEntries(
      (categoriesPage?.data ?? []).map((category) => [category.id, category.name]),
    );

    return resolveCategoryLabels(data.toursByCategory, categoryNames);
  }, [data, categoriesPage?.data]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <LoadingPanel height="h-24" />
        <LoadingPanel height="h-72" />
      </div>
    );
  }

  if (!data) return <ErrorState message="Unable to load catalog analytics." onRetry={onRetry} />;

  const soldPercent =
    data.totalTicketCapacity > 0
      ? (data.totalTicketsSold / data.totalTicketCapacity) * 100
      : 0;

  return (
    <div className="space-y-5">
      <MetricStrip
        columns={6}
        items={[
          { label: 'Total tours', value: formatNumber(data.totalTours) },
          { label: 'Active', value: formatNumber(data.activeTours) },
          { label: 'Inactive', value: formatNumber(data.inactiveTours) },
          { label: 'Schedules', value: formatNumber(data.totalSchedules) },
          { label: 'Upcoming', value: formatNumber(data.upcomingSchedules) },
          { label: 'Occupancy', value: formatPercent(data.scheduleOccupancyRate) },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <MetricGroup
          title="Schedule timeline"
          items={[
            { label: 'Ongoing', value: formatNumber(data.ongoingSchedules) },
            { label: 'Completed', value: formatNumber(data.completedSchedules) },
            { label: 'Upcoming', value: formatNumber(data.upcomingSchedules) },
          ]}
        />
        <MetricGroup
          title="Ticket inventory"
          items={[
            { label: 'Total capacity', value: formatNumber(data.totalTicketCapacity) },
            {
              label: 'Tickets sold',
              value: `${formatNumber(data.totalTicketsSold)} (${formatPercent(soldPercent)})`,
            },
            { label: 'Available', value: formatNumber(data.totalTicketsAvailable) },
          ]}
        />
        <MetricGroup
          title="Utilization"
          items={[
            { label: 'Occupancy rate', value: formatPercent(data.scheduleOccupancyRate) },
            { label: 'Sold share', value: formatPercent(soldPercent) },
            { label: 'Active tours', value: formatNumber(data.activeTours) },
          ]}
        />
      </div>

      <ChartGrid columns={3}>
        <DistributionChart
          title="Tours by category"
          data={toursByCategory}
          collapseLimit={6}
        />
        <DistributionChart title="Tours by city" data={data.toursByCity} pageSize={8} />
        <DistributionChart title="Tours by status" data={data.toursByStatus} />
      </ChartGrid>

      <AnalyticsPanel
        title="Top booked tours"
        subtitle="Most popular tours by booking count"
        padded={false}
        action={
          <select
            value={catalogTop}
            onChange={(e) => onTopChange(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
          >
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                Top {n}
              </option>
            ))}
          </select>
        }
        bodyClassName="px-0 pb-0"
      >
        <TopToursTable tours={data.topBookedTours} />
      </AnalyticsPanel>
    </div>
  );
};

const VouchersTab: React.FC<{
  isLoading: boolean;
  data: ReturnType<typeof usePlatformVouchers>['data'];
  onRetry: () => void;
}> = ({ isLoading, data, onRetry }) => {
  if (isLoading) {
    return (
      <div className="space-y-5">
        <LoadingPanel height="h-24" />
        <LoadingPanel height="h-64" />
      </div>
    );
  }

  if (!data) return <ErrorState message="Unable to load voucher analytics." onRetry={onRetry} />;

  return (
    <div className="space-y-5">
      <MetricStrip
        columns={4}
        items={[
          { label: 'Total vouchers', value: formatNumber(data.totalVouchers) },
          { label: 'Active', value: formatNumber(data.activeVouchers), hint: 'Redeemable now' },
          { label: 'Expired', value: formatNumber(data.expiredVouchers) },
          {
            label: 'Redemption rate',
            value: formatPercent(data.redemptionRate),
            hint: `${formatNumber(data.totalRedemptions)} redemptions`,
          },
        ]}
      />

      <ChartGrid>
        <DistributionChart title="By discount type" data={data.byDiscountType} />
        <DistributionChart title="By user voucher status" data={data.byUserVoucherStatus} />
      </ChartGrid>
    </div>
  );
};

const SocialTab: React.FC<{
  isLoading: boolean;
  data: ReturnType<typeof usePlatformSocial>['data'];
  onRetry: () => void;
}> = ({ isLoading, data, onRetry }) => {
  if (isLoading) {
    return (
      <div className="space-y-5">
        <LoadingPanel height="h-24" />
        <LoadingPanel height="h-72" />
      </div>
    );
  }

  if (!data) return <ErrorState message="Unable to load social analytics." onRetry={onRetry} />;

  return (
    <div className="space-y-5">
      <MetricStrip
        columns={6}
        items={[
          { label: 'Friendships', value: formatNumber(data.totalFriendships) },
          { label: 'Accepted', value: formatNumber(data.acceptedFriendships) },
          { label: 'Pending', value: formatNumber(data.pendingFriendRequests) },
          { label: 'Chat rooms', value: formatNumber(data.totalChatRooms) },
          { label: 'Messages', value: formatNumber(data.totalChatMessages) },
          { label: 'Unread', value: formatNumber(data.unreadChatMessages) },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <MetricGroup
          title="Friendships"
          items={[
            { label: 'Total', value: formatNumber(data.totalFriendships) },
            { label: 'Accepted', value: formatNumber(data.acceptedFriendships) },
            { label: 'Pending requests', value: formatNumber(data.pendingFriendRequests) },
          ]}
        />
        <MetricGroup
          title="Tour moments"
          items={[
            { label: 'Total moments', value: formatNumber(data.totalTourMoments) },
            { label: 'Reactions', value: formatNumber(data.totalMomentReactions) },
            { label: 'Comments', value: formatNumber(data.totalMomentComments) },
          ]}
        />
      </div>

      <ChartGrid>
        <DistributionChart title="Moments by privacy" data={data.momentsByPrivacy} />
        <DistributionChart
          title="Friendship status distribution"
          data={data.friendshipStatusDistribution}
        />
      </ChartGrid>
    </div>
  );
};

const HealthTab: React.FC<{
  isLoading: boolean;
  data: ReturnType<typeof usePlatformHealth>['data'];
  onRetry: () => void;
}> = ({ isLoading, data, onRetry }) => {
  if (!isLoading && !data) {
    return <ErrorState message="Unable to load platform health data." onRetry={onRetry} />;
  }
  return <HealthPanel data={data} isLoading={isLoading} />;
};

export default PlatformAnalyticsPage;
