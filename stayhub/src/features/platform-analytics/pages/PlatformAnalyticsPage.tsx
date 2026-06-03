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
import { useTranslation } from '../../../contexts/LocaleContext';

const DATE_FILTER_TABS: PlatformAnalyticsTab[] = ['overview', 'users', 'health'];

export const PlatformAnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { preset, setPreset, from, setFrom, to, setTo, dateParams } = useDateRangeState();

  const TABS = useMemo<{ id: PlatformAnalyticsTab; label: string; icon: React.ReactNode }[]>(
    () => [
      { id: 'overview', label: t('analytics.tabs.overview'), icon: <BarChart3 className="h-4 w-4" /> },
      { id: 'users', label: t('analytics.tabs.users'), icon: <Users className="h-4 w-4" /> },
      { id: 'catalog', label: t('analytics.tabs.catalog'), icon: <Map className="h-4 w-4" /> },
      { id: 'vouchers', label: t('analytics.tabs.vouchers'), icon: <Ticket className="h-4 w-4" /> },
      { id: 'social', label: t('analytics.tabs.social'), icon: <Heart className="h-4 w-4" /> },
      { id: 'health', label: t('analytics.tabs.health'), icon: <Activity className="h-4 w-4" /> },
    ],
    [t],
  );
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
          <p className="travel-eyebrow">{t('analytics.platform.eyebrow')}</p>
          <h1 className="travel-heading text-2xl md:text-3xl">{t('analytics.platform.title')}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            {t('analytics.platform.subtitle')}
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
          {t('analytics.refresh')}
        </button>
      </div>

      <AnalyticsPanel padded={false}>
        <div className="border-b border-slate-100 px-2">
          <nav
            className="custom-scrollbar flex gap-1 overflow-x-auto"
            aria-label={t('analytics.platform.sectionsAria')}
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
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="space-y-5">
        <LoadingPanel height="h-24" />
        <LoadingPanel height="h-56" />
      </div>
    );
  }

  if (!data) return <ErrorState message={t("analytics.platform.errorOverview")} onRetry={onRetry} />;

  return (
    <div className="space-y-5">
      <MetricStrip
        columns={4}
        items={[
          {
            label: t("analytics.platform.totalUsers"),
            value: formatNumber(data.totalUsers),
            hint: t("analytics.platform.activeHint", { count: formatNumber(data.activeUsers) }),
          },
          {
            label: t("analytics.platform.totalTours"),
            value: formatNumber(data.totalTours),
            hint: t("analytics.platform.activeHint", { count: formatNumber(data.activeTours) }),
          },
          {
            label: t("analytics.platform.scheduleOccupancy"),
            value: formatPercent(data.scheduleOccupancyRate),
            hint: t("analytics.platform.checkInHint", { rate: formatPercent(data.checkInRate) }),
          },
          {
            label: t("analytics.platform.activeVouchers"),
            value: formatNumber(data.activeVouchers),
            hint: t("analytics.platform.pendingCancellationsHint", {
              count: formatNumber(data.pendingCancellationRequests),
            }),
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricGroup
          title={t("analytics.platform.userEcosystem")}
          items={[
            { label: t("analytics.platform.newUsers"), value: formatNumber(data.newUsersInPeriod) },
            { label: t("analytics.platform.managers"), value: formatNumber(data.totalManagers) },
            { label: t("analytics.platform.staff"), value: formatNumber(data.totalStaff) },
            { label: t("analytics.platform.activeUsers"), value: formatNumber(data.activeUsers) },
          ]}
        />
        <MetricGroup
          title={t("analytics.platform.tourCatalog")}
          items={[
            { label: t("analytics.platform.schedules"), value: formatNumber(data.totalSchedules) },
            { label: t("analytics.platform.upcoming"), value: formatNumber(data.upcomingSchedules) },
            { label: t("analytics.platform.occupancy"), value: formatPercent(data.scheduleOccupancyRate) },
            { label: t("analytics.platform.checkInRate"), value: formatPercent(data.checkInRate) },
          ]}
        />
        <MetricGroup
          title={t("analytics.platform.communityOps")}
          items={[
            { label: t("analytics.platform.tourMoments"), value: formatNumber(data.totalTourMoments) },
            { label: t("analytics.platform.chatRooms"), value: formatNumber(data.totalChatRooms) },
            { label: t("analytics.platform.activeVouchers"), value: formatNumber(data.activeVouchers) },
            {
              label: t("analytics.platform.pendingCancellations"),
              value: formatNumber(data.pendingCancellationRequests),
            },
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
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="space-y-5">
        <LoadingPanel height="h-24" />
        <LoadingPanel height="h-64" />
      </div>
    );
  }

  if (!data) return <ErrorState message={t("analytics.platform.errorUsers")} onRetry={onRetry} />;

  return (
    <div className="space-y-5">
      <MetricStrip
        columns={5}
        items={[
          { label: t("analytics.platform.totalUsers"), value: formatNumber(data.totalUsers) },
          {
            label: t("analytics.platform.active"),
            value: formatNumber(data.activeUsers),
            hint: t("analytics.platform.enabledAccounts"),
          },
          { label: t("analytics.platform.inactive"), value: formatNumber(data.inactiveUsers) },
          { label: t("analytics.platform.newInPeriod"), value: formatNumber(data.newUsersInPeriod) },
          {
            label: t("analytics.platform.onlineRecently"),
            value: formatNumber(data.onlineRecently),
            hint: t("analytics.platform.recentSessions"),
          },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-3 xl:grid-cols-2">
          <SegmentCard
            label={t("analytics.platform.customers")}
            count={data.totalCustomers}
            description={t("analytics.platform.customersDesc")}
            colorClass="bg-brand-light text-brand"
            icon={<Users className="h-5 w-5" />}
          />
          <SegmentCard
            label={t("analytics.platform.managers")}
            count={data.totalManagers}
            description={t("analytics.platform.managersDesc")}
            colorClass="bg-slate-100 text-slate-600"
            icon={<Building2 className="h-5 w-5" />}
          />
          <SegmentCard
            label={t("analytics.platform.staff")}
            count={data.totalStaff}
            description={t("analytics.platform.staffDesc")}
            colorClass="bg-slate-100 text-slate-600"
            icon={<UserCheck className="h-5 w-5" />}
          />
          <SegmentCard
            label={t("analytics.platform.admins")}
            count={data.totalAdmins}
            description={t("analytics.platform.adminsDesc")}
            colorClass="bg-slate-100 text-slate-600"
            icon={<Shield className="h-5 w-5" />}
          />
        </div>

        <div className="xl:col-span-2">
          <DistributionChart title={t("analytics.platform.usersByRole")} data={byRole} />
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
  const { t } = useTranslation();
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

  if (!data) return <ErrorState message={t("analytics.platform.errorCatalog")} onRetry={onRetry} />;

  const soldPercent =
    data.totalTicketCapacity > 0
      ? (data.totalTicketsSold / data.totalTicketCapacity) * 100
      : 0;

  return (
    <div className="space-y-5">
      <MetricStrip
        columns={6}
        items={[
          { label: t("analytics.platform.totalTours"), value: formatNumber(data.totalTours) },
          { label: t("analytics.platform.active"), value: formatNumber(data.activeTours) },
          { label: t("analytics.platform.inactiveTours"), value: formatNumber(data.inactiveTours) },
          { label: t("analytics.platform.schedules"), value: formatNumber(data.totalSchedules) },
          { label: t("analytics.platform.upcoming"), value: formatNumber(data.upcomingSchedules) },
          { label: t("analytics.platform.occupancy"), value: formatPercent(data.scheduleOccupancyRate) },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <MetricGroup
          title={t("analytics.platform.scheduleTimeline")}
          items={[
            { label: t("analytics.platform.ongoing"), value: formatNumber(data.ongoingSchedules) },
            { label: t("analytics.platform.completed"), value: formatNumber(data.completedSchedules) },
            { label: t("analytics.platform.upcoming"), value: formatNumber(data.upcomingSchedules) },
          ]}
        />
        <MetricGroup
          title={t("analytics.platform.ticketInventory")}
          items={[
            { label: t("analytics.platform.totalCapacity"), value: formatNumber(data.totalTicketCapacity) },
            {
              label: t("analytics.platform.ticketsSold"),
              value: `${formatNumber(data.totalTicketsSold)} (${formatPercent(soldPercent)})`,
            },
            { label: t("analytics.platform.available"), value: formatNumber(data.totalTicketsAvailable) },
          ]}
        />
        <MetricGroup
          title={t("analytics.platform.utilization")}
          items={[
            { label: t("analytics.platform.occupancyRate"), value: formatPercent(data.scheduleOccupancyRate) },
            { label: t("analytics.platform.soldShare"), value: formatPercent(soldPercent) },
            { label: t("analytics.platform.activeTours"), value: formatNumber(data.activeTours) },
          ]}
        />
      </div>

      <ChartGrid columns={3}>
        <DistributionChart
          title={t("analytics.platform.toursByCategory")}
          data={toursByCategory}
          collapseLimit={6}
        />
        <DistributionChart title={t("analytics.platform.toursByCity")} data={data.toursByCity} pageSize={8} />
        <DistributionChart title={t("analytics.platform.toursByStatus")} data={data.toursByStatus} />
      </ChartGrid>

      <AnalyticsPanel
        title={t("analytics.platform.topBookedTours")}
        subtitle={t("analytics.platform.topBookedSubtitle")}
        padded={false}
        action={
          <select
            value={catalogTop}
            onChange={(e) => onTopChange(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
          >
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {t("analytics.platform.topN", { n })}
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
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="space-y-5">
        <LoadingPanel height="h-24" />
        <LoadingPanel height="h-64" />
      </div>
    );
  }

  if (!data) return <ErrorState message={t("analytics.platform.errorVouchers")} onRetry={onRetry} />;

  return (
    <div className="space-y-5">
      <MetricStrip
        columns={4}
        items={[
          { label: t("analytics.platform.totalVouchers"), value: formatNumber(data.totalVouchers) },
          {
            label: t("analytics.platform.active"),
            value: formatNumber(data.activeVouchers),
            hint: t("analytics.platform.redeemableNow"),
          },
          { label: t("analytics.platform.expired"), value: formatNumber(data.expiredVouchers) },
          {
            label: t("analytics.platform.redemptionRate"),
            value: formatPercent(data.redemptionRate),
            hint: t("analytics.platform.redemptionsHint", { count: formatNumber(data.totalRedemptions) }),
          },
        ]}
      />

      <ChartGrid>
        <DistributionChart title={t("analytics.platform.byDiscountType")} data={data.byDiscountType} />
        <DistributionChart title={t("analytics.platform.byUserVoucherStatus")} data={data.byUserVoucherStatus} />
      </ChartGrid>
    </div>
  );
};

const SocialTab: React.FC<{
  isLoading: boolean;
  data: ReturnType<typeof usePlatformSocial>['data'];
  onRetry: () => void;
}> = ({ isLoading, data, onRetry }) => {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="space-y-5">
        <LoadingPanel height="h-24" />
        <LoadingPanel height="h-72" />
      </div>
    );
  }

  if (!data) return <ErrorState message={t("analytics.platform.errorSocial")} onRetry={onRetry} />;

  return (
    <div className="space-y-5">
      <MetricStrip
        columns={6}
        items={[
          { label: t("analytics.platform.friendships"), value: formatNumber(data.totalFriendships) },
          { label: t("analytics.platform.accepted"), value: formatNumber(data.acceptedFriendships) },
          { label: t("analytics.platform.pending"), value: formatNumber(data.pendingFriendRequests) },
          { label: t("analytics.platform.chatRooms"), value: formatNumber(data.totalChatRooms) },
          { label: t("analytics.platform.messages"), value: formatNumber(data.totalChatMessages) },
          { label: t("analytics.platform.unread"), value: formatNumber(data.unreadChatMessages) },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <MetricGroup
          title={t("analytics.platform.friendships")}
          items={[
            { label: t("analytics.platform.total"), value: formatNumber(data.totalFriendships) },
            { label: t("analytics.platform.accepted"), value: formatNumber(data.acceptedFriendships) },
            { label: t("analytics.platform.pendingRequests"), value: formatNumber(data.pendingFriendRequests) },
          ]}
        />
        <MetricGroup
          title={t("analytics.platform.tourMoments")}
          items={[
            { label: t("analytics.platform.totalMoments"), value: formatNumber(data.totalTourMoments) },
            { label: t("analytics.platform.reactions"), value: formatNumber(data.totalMomentReactions) },
            { label: t("analytics.platform.comments"), value: formatNumber(data.totalMomentComments) },
          ]}
        />
      </div>

      <ChartGrid>
        <DistributionChart title={t("analytics.platform.momentsByPrivacy")} data={data.momentsByPrivacy} />
        <DistributionChart
          title={t("analytics.platform.friendshipStatusDist")}
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
  const { t } = useTranslation();
  if (!isLoading && !data) {
    return <ErrorState message={t("analytics.platform.errorHealth")} onRetry={onRetry} />;
  }
  return <HealthPanel data={data} isLoading={isLoading} />;
};

export default PlatformAnalyticsPage;
