import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  Heart,
  Map,
  MessageCircle,
  RefreshCw,
  Shield,
  Ticket,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import {
  DateRangeFilter,
  useDateRangeState,
} from '../../customer-analytics/components/DateRangeFilter';
import {
  DistributionChart,
  SegmentCard,
} from '../../customer-analytics/components/DistributionChart';
import { StatCard } from '../../customer-analytics/components/StatCard';
import {
  formatDate,
  formatNumber,
  formatPercent,
} from '../../customer-analytics/utils/analyticsHelpers';
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
import { getRoleLabel } from '../utils/platformHelpers';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Platform Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time pulse of users, catalog, vouchers, social activity, and platform health
            {overview && activeTab === 'overview' && (
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

      {showDateFilter && (
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
                ? 'bg-brand text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

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
  );
};

const OverviewTab: React.FC<{
  isLoading: boolean;
  data: ReturnType<typeof usePlatformOverview>['data'];
  onRetry: () => void;
}> = ({ isLoading, data, onRetry }) => {
  if (isLoading) return <LoadingGrid count={12} cols="xl:grid-cols-4" />;
  if (!data) return <ErrorState message="Unable to load platform overview." onRetry={onRetry} />;

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="User Ecosystem" subtitle="Accounts across all roles on the platform" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Users"
            value={formatNumber(data.totalUsers)}
            subLabel={`${formatNumber(data.activeUsers)} active`}
            icon={<Users className="h-5 w-5 text-indigo-500" />}
            iconBgClass="bg-indigo-50"
          />
          <StatCard
            label="New Users"
            value={formatNumber(data.newUsersInPeriod)}
            subLabel="In selected period"
            icon={<UserPlus className="h-5 w-5 text-brand" />}
            iconBgClass="bg-brand-light"
          />
          <StatCard
            label="Managers"
            value={formatNumber(data.totalManagers)}
            subLabel="Tour operators"
            icon={<Building2 className="h-5 w-5 text-violet-500" />}
            iconBgClass="bg-violet-50"
          />
          <StatCard
            label="Staff"
            value={formatNumber(data.totalStaff)}
            subLabel="Operator staff accounts"
            icon={<UserCheck className="h-5 w-5 text-cyan-500" />}
            iconBgClass="bg-cyan-50"
          />
        </div>
      </div>

      <div>
        <SectionHeader title="Tour Catalog" subtitle="Tours, schedules, and inventory utilization" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Tours"
            value={formatNumber(data.totalTours)}
            subLabel={`${formatNumber(data.activeTours)} active`}
            icon={<Map className="h-5 w-5 text-emerald-500" />}
            iconBgClass="bg-emerald-50"
          />
          <StatCard
            label="Schedules"
            value={formatNumber(data.totalSchedules)}
            subLabel={`${formatNumber(data.upcomingSchedules)} upcoming`}
            icon={<CalendarDays className="h-5 w-5 text-amber-500" />}
            iconBgClass="bg-amber-50"
          />
          <StatCard
            label="Occupancy Rate"
            value={formatPercent(data.scheduleOccupancyRate)}
            subLabel="Ticket capacity filled"
            icon={<BarChart3 className="h-5 w-5 text-brand" />}
            iconBgClass="bg-brand-light"
          />
          <StatCard
            label="Check-in Rate"
            value={formatPercent(data.checkInRate)}
            subLabel="Tickets checked in"
            icon={<UserCheck className="h-5 w-5 text-teal-500" />}
            iconBgClass="bg-teal-50"
          />
        </div>
      </div>

      <div>
        <SectionHeader
          title="Social & Promotions"
          subtitle="Community engagement and voucher activity"
        />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active Vouchers"
            value={formatNumber(data.activeVouchers)}
            subLabel="System-wide promotions"
            icon={<Ticket className="h-5 w-5 text-rose-500" />}
            iconBgClass="bg-rose-50"
          />
          <StatCard
            label="Tour Moments"
            value={formatNumber(data.totalTourMoments)}
            subLabel="User-generated content"
            icon={<Heart className="h-5 w-5 text-pink-500" />}
            iconBgClass="bg-pink-50"
          />
          <StatCard
            label="Chat Rooms"
            value={formatNumber(data.totalChatRooms)}
            subLabel="Active conversations"
            icon={<MessageCircle className="h-5 w-5 text-indigo-500" />}
            iconBgClass="bg-indigo-50"
          />
          <StatCard
            label="Pending Cancellations"
            value={formatNumber(data.pendingCancellationRequests)}
            subLabel="Awaiting admin action"
            icon={<UserX className="h-5 w-5 text-orange-500" />}
            iconBgClass="bg-orange-50"
          />
        </div>
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
  if (isLoading) return <LoadingGrid count={8} cols="md:grid-cols-2" />;
  if (!data) return <ErrorState message="Unable to load user analytics." onRetry={onRetry} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MiniStat label="Total Users" value={formatNumber(data.totalUsers)} />
        <MiniStat label="Active" value={formatNumber(data.activeUsers)} />
        <MiniStat label="Inactive" value={formatNumber(data.inactiveUsers)} />
        <MiniStat label="New in Period" value={formatNumber(data.newUsersInPeriod)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          colorClass="bg-violet-50 text-violet-500"
          icon={<Building2 className="h-5 w-5" />}
        />
        <SegmentCard
          label="Staff"
          count={data.totalStaff}
          description="Operator team members"
          colorClass="bg-cyan-50 text-cyan-500"
          icon={<UserCheck className="h-5 w-5" />}
        />
        <SegmentCard
          label="Admins"
          count={data.totalAdmins}
          description="Platform administrators"
          colorClass="bg-rose-50 text-rose-500"
          icon={<Shield className="h-5 w-5" />}
        />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
        <div className="text-sm font-semibold text-slate-600">
          Online recently:{' '}
          <span className="text-lg font-bold text-brand">
            {formatNumber(data.onlineRecently)}
          </span>
          <span className="ml-1 text-slate-400">users</span>
        </div>
      </div>

      <DistributionChart title="Users by Role" data={byRole} />
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
  if (isLoading) return <LoadingGrid count={6} cols="md:grid-cols-2" />;
  if (!data) return <ErrorState message="Unable to load catalog analytics." onRetry={onRetry} />;

  const soldPercent =
    data.totalTicketCapacity > 0
      ? (data.totalTicketsSold / data.totalTicketCapacity) * 100
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MiniStat label="Total Tours" value={formatNumber(data.totalTours)} />
        <MiniStat label="Active Tours" value={formatNumber(data.activeTours)} />
        <MiniStat label="Inactive Tours" value={formatNumber(data.inactiveTours)} />
        <MiniStat label="Occupancy" value={formatPercent(data.scheduleOccupancyRate)} />
      </div>

      <div>
        <SectionHeader title="Schedules" subtitle="Tour departure timeline" />
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <MiniStat label="Total" value={formatNumber(data.totalSchedules)} />
          <MiniStat label="Upcoming" value={formatNumber(data.upcomingSchedules)} />
          <MiniStat label="Ongoing" value={formatNumber(data.ongoingSchedules)} />
          <MiniStat label="Completed" value={formatNumber(data.completedSchedules)} />
        </div>
      </div>

      <div>
        <SectionHeader title="Ticket Inventory" subtitle="Capacity, sales, and availability" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Total Capacity"
            value={formatNumber(data.totalTicketCapacity)}
            subLabel="Seats across all schedules"
            icon={<Ticket className="h-5 w-5 text-indigo-500" />}
            iconBgClass="bg-indigo-50"
          />
          <StatCard
            label="Tickets Sold"
            value={formatNumber(data.totalTicketsSold)}
            subLabel={`${formatPercent(soldPercent)} of capacity`}
            icon={<BarChart3 className="h-5 w-5 text-emerald-500" />}
            iconBgClass="bg-emerald-50"
          />
          <StatCard
            label="Available"
            value={formatNumber(data.totalTicketsAvailable)}
            subLabel="Remaining inventory"
            icon={<CalendarDays className="h-5 w-5 text-amber-500" />}
            iconBgClass="bg-amber-50"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DistributionChart title="Tours by Category" data={data.toursByCategory} />
        <DistributionChart title="Tours by City" data={data.toursByCity} />
        <DistributionChart title="Tours by Status" data={data.toursByStatus} />
      </div>

      <section className="rounded-2xl bg-white shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Top Booked Tours</h3>
            <p className="text-sm text-slate-500">Most popular tours by booking count</p>
          </div>
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
        </div>
        <TopToursTable tours={data.topBookedTours} />
      </section>
    </div>
  );
};

const VouchersTab: React.FC<{
  isLoading: boolean;
  data: ReturnType<typeof usePlatformVouchers>['data'];
  onRetry: () => void;
}> = ({ isLoading, data, onRetry }) => {
  if (isLoading) return <LoadingGrid count={6} cols="md:grid-cols-2" />;
  if (!data) return <ErrorState message="Unable to load voucher analytics." onRetry={onRetry} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Vouchers"
          value={formatNumber(data.totalVouchers)}
          subLabel="System-wide vouchers"
          icon={<Ticket className="h-5 w-5 text-indigo-500" />}
          iconBgClass="bg-indigo-50"
        />
        <StatCard
          label="Active"
          value={formatNumber(data.activeVouchers)}
          subLabel="Currently redeemable"
          icon={<UserCheck className="h-5 w-5 text-emerald-500" />}
          iconBgClass="bg-emerald-50"
        />
        <StatCard
          label="Expired"
          value={formatNumber(data.expiredVouchers)}
          subLabel="Past validity date"
          icon={<UserX className="h-5 w-5 text-slate-500" />}
          iconBgClass="bg-slate-100"
        />
        <StatCard
          label="Redemption Rate"
          value={formatPercent(data.redemptionRate)}
          subLabel={`${formatNumber(data.totalRedemptions)} total redemptions`}
          icon={<BarChart3 className="h-5 w-5 text-brand" />}
          iconBgClass="bg-brand-light"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DistributionChart title="By Discount Type" data={data.byDiscountType} />
        <DistributionChart title="By User Voucher Status" data={data.byUserVoucherStatus} />
      </div>
    </div>
  );
};

const SocialTab: React.FC<{
  isLoading: boolean;
  data: ReturnType<typeof usePlatformSocial>['data'];
  onRetry: () => void;
}> = ({ isLoading, data, onRetry }) => {
  if (isLoading) return <LoadingGrid count={8} cols="md:grid-cols-2" />;
  if (!data) return <ErrorState message="Unable to load social analytics." onRetry={onRetry} />;

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Friendships" subtitle="Social connections between users" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Total Friendships"
            value={formatNumber(data.totalFriendships)}
            icon={<Heart className="h-5 w-5 text-pink-500" />}
            iconBgClass="bg-pink-50"
          />
          <StatCard
            label="Accepted"
            value={formatNumber(data.acceptedFriendships)}
            icon={<UserCheck className="h-5 w-5 text-emerald-500" />}
            iconBgClass="bg-emerald-50"
          />
          <StatCard
            label="Pending Requests"
            value={formatNumber(data.pendingFriendRequests)}
            icon={<UserPlus className="h-5 w-5 text-amber-500" />}
            iconBgClass="bg-amber-50"
          />
        </div>
      </div>

      <div>
        <SectionHeader title="Messaging" subtitle="Chat rooms and message activity" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Chat Rooms"
            value={formatNumber(data.totalChatRooms)}
            subLabel={`${formatNumber(data.groupChatRooms)} group chats`}
            icon={<MessageCircle className="h-5 w-5 text-indigo-500" />}
            iconBgClass="bg-indigo-50"
          />
          <StatCard
            label="Total Messages"
            value={formatNumber(data.totalChatMessages)}
            icon={<MessageCircle className="h-5 w-5 text-brand" />}
            iconBgClass="bg-brand-light"
          />
          <StatCard
            label="Unread Messages"
            value={formatNumber(data.unreadChatMessages)}
            icon={<MessageCircle className="h-5 w-5 text-orange-500" />}
            iconBgClass="bg-orange-50"
          />
        </div>
      </div>

      <div>
        <SectionHeader title="Tour Moments" subtitle="User-generated travel content" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Total Moments"
            value={formatNumber(data.totalTourMoments)}
            icon={<Heart className="h-5 w-5 text-rose-500" />}
            iconBgClass="bg-rose-50"
          />
          <StatCard
            label="Reactions"
            value={formatNumber(data.totalMomentReactions)}
            icon={<Heart className="h-5 w-5 text-pink-500" />}
            iconBgClass="bg-pink-50"
          />
          <StatCard
            label="Comments"
            value={formatNumber(data.totalMomentComments)}
            icon={<MessageCircle className="h-5 w-5 text-violet-500" />}
            iconBgClass="bg-violet-50"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DistributionChart title="Moments by Privacy" data={data.momentsByPrivacy} />
        <DistributionChart
          title="Friendship Status Distribution"
          data={data.friendshipStatusDistribution}
        />
      </div>
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

const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div>
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    <p className="text-sm text-slate-500">{subtitle}</p>
  </div>
);

const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl bg-white p-4 text-center shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
  </div>
);

const LoadingGrid: React.FC<{ count: number; cols?: string }> = ({
  count,
  cols = 'md:grid-cols-2 xl:grid-cols-4',
}) => (
  <div className={`grid grid-cols-1 gap-4 ${cols}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
    ))}
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
      className="mt-4 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#0058c0]"
    >
      Try Again
    </button>
  </div>
);

export default PlatformAnalyticsPage;
