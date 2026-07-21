import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, BarChart3, Building2, Calendar, CheckCircle, Heart,
  Map, MessageCircle, RefreshCw, Shield, Ticket, TrendingUp,
  UserCheck, Users, Zap,
} from 'lucide-react';
import { DateRangeFilter, useDateRangeState } from '../../customer-analytics/components/DateRangeFilter';
import { DistributionChart } from '../../customer-analytics/components/DistributionChart';
import { formatDate, formatNumber, formatPercent } from '../../customer-analytics/utils/analyticsHelpers';
import {
  AnalyticsPanel, ChartGrid, ErrorState, KpiCard, KpiGrid,
  LoadingKpiGrid, LoadingPanel, MetricGroup, MetricStrip, RoleCard,
} from '../components/AnalyticsLayout';
import { HealthPanel } from '../components/HealthPanel';
import { TopToursTable } from '../components/TopToursTable';
import {
  usePlatformCatalog, usePlatformHealth, usePlatformOverview,
  usePlatformSocial, usePlatformUsers, usePlatformVouchers,
} from '../hooks/usePlatformAnalytics';
import type { PlatformAnalyticsTab } from '../types/platformAnalytics.types';
import { getRoleLabel, resolveCategoryLabels } from '../utils/platformHelpers';
import { getAllCategories } from '../../content/services/category.service';
import { useTranslation } from '../../../contexts/LocaleContext';

const DATE_FILTER_TABS: PlatformAnalyticsTab[] = ['overview', 'users', 'health'];

export const PlatformAnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { preset, setPreset, from, setFrom, to, setTo, dateParams } = useDateRangeState();
  const [activeTab, setActiveTab] = useState<PlatformAnalyticsTab>('overview');
  const [catalogTop, setCatalogTop] = useState(10);

  const TABS = useMemo(() => [
    { id: 'overview' as const, label: t('analytics.tabs.overview'), icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'users' as const, label: t('analytics.tabs.users'), icon: <Users className="h-4 w-4" /> },
    { id: 'catalog' as const, label: t('analytics.tabs.catalog'), icon: <Map className="h-4 w-4" /> },
    { id: 'vouchers' as const, label: t('analytics.tabs.vouchers'), icon: <Ticket className="h-4 w-4" /> },
    { id: 'social' as const, label: t('analytics.tabs.social'), icon: <Heart className="h-4 w-4" /> },
    { id: 'health' as const, label: t('analytics.tabs.health'), icon: <Activity className="h-4 w-4" /> },
  ], [t]);

  const overviewQuery = usePlatformOverview(dateParams);
  const usersQuery = usePlatformUsers(dateParams);
  const catalogQuery = usePlatformCatalog({ top: catalogTop });
  const vouchersQuery = usePlatformVouchers();
  const socialQuery = usePlatformSocial();
  const healthQuery = usePlatformHealth(dateParams);

  const usersByRole = useMemo(() => {
    return (usersQuery.data?.byRole ?? []).map((item) => {
      const norm = item.label.toUpperCase();
      let label = item.label;
      if (norm === 'CUSTOMER') label = t('analytics.platform.customers');
      else if (norm === 'MANAGER') label = t('analytics.platform.managers');
      else if (norm === 'STAFF') label = t('analytics.platform.staff');
      else if (norm === 'ADMIN') label = t('analytics.platform.admins');
      return { ...item, label };
    });
  }, [usersQuery.data?.byRole, t]);

  const isRefreshing = overviewQuery.isFetching || usersQuery.isFetching ||
    catalogQuery.isFetching || vouchersQuery.isFetching || socialQuery.isFetching || healthQuery.isFetching;

  const handleRefresh = () => {
    overviewQuery.refetch(); usersQuery.refetch(); catalogQuery.refetch();
    vouchersQuery.refetch(); socialQuery.refetch(); healthQuery.refetch();
  };

  const showDateFilter = DATE_FILTER_TABS.includes(activeTab);
  const overview = overviewQuery.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="travel-eyebrow">{t('analytics.platform.eyebrow')}</p>
          <h1 className="travel-heading mt-1 text-2xl font-extrabold md:text-3xl">
            {t('analytics.platform.title')}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">{t('analytics.platform.subtitle')}</p>
        </div>
        <button
          type="button" onClick={handleRefresh} disabled={isRefreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('analytics.refresh')}
        </button>
      </div>

      {/* Tab nav */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-2">
          <nav className="custom-scrollbar flex gap-0.5 overflow-x-auto" aria-label={t('analytics.platform.sectionsAria')}>
            {TABS.map((tab) => (
              <button
                key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-semibold transition-colors ${activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700'
                  }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </nav>
        </div>

        {showDateFilter && (
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
            <DateRangeFilter preset={preset} from={from} to={to}
              onPresetChange={setPreset} onFromChange={setFrom} onToChange={setTo} />
          </div>
        )}

        <div className="p-5">
          {activeTab === 'overview' && <OverviewTab isLoading={overviewQuery.isLoading} data={overview} onRetry={handleRefresh} />}
          {activeTab === 'users' && <UsersTab isLoading={usersQuery.isLoading} data={usersQuery.data} byRole={usersByRole} onRetry={handleRefresh} />}
          {activeTab === 'catalog' && <CatalogTab isLoading={catalogQuery.isLoading} data={catalogQuery.data} catalogTop={catalogTop} onTopChange={setCatalogTop} onRetry={handleRefresh} />}
          {activeTab === 'vouchers' && <VouchersTab isLoading={vouchersQuery.isLoading} data={vouchersQuery.data} onRetry={handleRefresh} />}
          {activeTab === 'social' && <SocialTab isLoading={socialQuery.isLoading} data={socialQuery.data} onRetry={handleRefresh} />}
          {activeTab === 'health' && <HealthTab isLoading={healthQuery.isLoading} data={healthQuery.data} onRetry={handleRefresh} />}
        </div>
      </div>
    </div>
  );
};

// ── Overview Tab ──────────────────────────────────────────────────────────────
const OverviewTab: React.FC<{
  isLoading: boolean;
  data: ReturnType<typeof usePlatformOverview>['data'];
  onRetry: () => void;
}> = ({ isLoading, data, onRetry }) => {
  const { t } = useTranslation();
  if (isLoading) return (
    <div className="space-y-5">
      <LoadingKpiGrid count={4} />
      <div className="grid gap-4 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => <LoadingPanel key={i} height="h-40" />)}
      </div>
    </div>
  );
  if (!data) return <ErrorState message={t('analytics.platform.errorOverview')} onRetry={onRetry} />;

  const occupancyPct = data.scheduleOccupancyRate;
  const checkInPct = data.checkInRate;

  return (
    <div className="space-y-5">
      <KpiGrid cols={4}>
        <KpiCard
          label={t('analytics.platform.totalUsers')}
          value={formatNumber(data.totalUsers)}
          sub={t('analytics.platform.activeHint', { count: formatNumber(data.activeUsers) })}
          icon={<Users className="h-5 w-5" />}
          accent="brand"
        />
        <KpiCard
          label={t('analytics.platform.totalTours')}
          value={formatNumber(data.totalTours)}
          sub={t('analytics.platform.activeHint', { count: formatNumber(data.activeTours) })}
          icon={<Map className="h-5 w-5" />}
          accent="slate"
        />
        <KpiCard
          label={t('analytics.platform.scheduleOccupancy')}
          value={formatPercent(occupancyPct)}
          sub={t('analytics.platform.checkInHint', { rate: formatPercent(checkInPct) })}
          icon={<Calendar className="h-5 w-5" />}
          accent={occupancyPct >= 60 ? 'emerald' : 'amber'}
          trend={{ dir: occupancyPct >= 50 ? 'up' : 'down', label: formatPercent(occupancyPct) }}
        />
        <KpiCard
          label={t('analytics.platform.activeVouchers')}
          value={formatNumber(data.activeVouchers)}
          sub={t('analytics.platform.pendingCancellationsHint', { count: formatNumber(data.pendingCancellationRequests) })}
          icon={<Ticket className="h-5 w-5" />}
          accent="accent"
        />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricGroup
          title={t('analytics.platform.userEcosystem')}
          icon={<Users className="h-4 w-4" />}
          items={[
            { label: t('analytics.platform.newUsers'), value: formatNumber(data.newUsersInPeriod) },
            { label: t('analytics.platform.managers'), value: formatNumber(data.totalManagers) },
            { label: t('analytics.platform.staff'), value: formatNumber(data.totalStaff) },
          ]}
        />
        <MetricGroup
          title={t('analytics.platform.tourCatalog')}
          icon={<Map className="h-4 w-4" />}
          items={[
            { label: t('analytics.platform.schedules'), value: formatNumber(data.totalSchedules) },
            { label: t('analytics.platform.upcoming'), value: formatNumber(data.upcomingSchedules) },
            { label: t('analytics.platform.checkInRate'), value: formatPercent(data.checkInRate), bar: data.checkInRate, barColor: 'bg-emerald-500' },
          ]}
        />
        <MetricGroup
          title={t('analytics.platform.communityOps')}
          icon={<Heart className="h-4 w-4" />}
          items={[
            { label: t('analytics.platform.tourMoments'), value: formatNumber(data.totalTourMoments) },
            { label: t('analytics.platform.activeVouchers'), value: formatNumber(data.activeVouchers) },
            { label: t('analytics.platform.pendingCancellations'), value: formatNumber(data.pendingCancellationRequests) },
          ]}
        />
      </div>
    </div>
  );
};

// ── Users Tab ──────────────────────────────────────────────────────────────────
const UsersTab: React.FC<{
  isLoading: boolean;
  data: ReturnType<typeof usePlatformUsers>['data'];
  byRole: { label: string; count: number; percentage: number }[];
  onRetry: () => void;
}> = ({ isLoading, data, byRole, onRetry }) => {
  const { t } = useTranslation();
  if (isLoading) return (
    <div className="space-y-5">
      <LoadingKpiGrid count={3} cols={3} />
      <LoadingPanel height="h-64" />
    </div>
  );
  if (!data) return <ErrorState message={t('analytics.platform.errorUsers')} onRetry={onRetry} />;

  return (
    <div className="space-y-5">
      <KpiGrid cols={3}>
        <KpiCard label={t('analytics.platform.totalUsers')} value={formatNumber(data.totalUsers)}
          sub={`${formatNumber(data.activeUsers)} ${t('analytics.platform.active').toLowerCase()}`}
          icon={<Users className="h-5 w-5" />} accent="brand" />
        <KpiCard label={t('analytics.platform.newInPeriod')} value={formatNumber(data.newUsersInPeriod)}
          icon={<TrendingUp className="h-5 w-5" />} accent="emerald"
          trend={{ dir: data.newUsersInPeriod > 0 ? 'up' : 'neutral', label: formatNumber(data.newUsersInPeriod) }} />
        <KpiCard label={t('analytics.platform.onlineRecently')} value={formatNumber(data.onlineRecently)}
          sub={t('analytics.platform.recentSessions')} icon={<Zap className="h-5 w-5" />} accent="amber" />
      </KpiGrid>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="grid grid-cols-2 gap-4 lg:col-span-3">
          <RoleCard label={t('analytics.platform.customers')} count={data.totalCustomers}
            description={t('analytics.platform.customersDesc')}
            icon={<Users className="h-5 w-5" />} gradientIndex={0} />
          <RoleCard label={t('analytics.platform.managers')} count={data.totalManagers}
            description={t('analytics.platform.managersDesc')}
            icon={<Building2 className="h-5 w-5" />} gradientIndex={1} />
          <RoleCard label={t('analytics.platform.staff')} count={data.totalStaff}
            description={t('analytics.platform.staffDesc')}
            icon={<UserCheck className="h-5 w-5" />} gradientIndex={2} />
          <RoleCard label={t('analytics.platform.admins')} count={data.totalAdmins}
            description={t('analytics.platform.adminsDesc')}
            icon={<Shield className="h-5 w-5" />} gradientIndex={3} />
        </div>
        <div className="lg:col-span-2">
          <DistributionChart title={t('analytics.platform.usersByRole')} data={byRole} />
        </div>
      </div>
    </div>
  );
};

// ── Catalog Tab ────────────────────────────────────────────────────────────────
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
    const names = Object.fromEntries((categoriesPage?.data ?? []).map((c) => [c.id, c.name]));
    return resolveCategoryLabels(data.toursByCategory, names);
  }, [data, categoriesPage?.data]);

  if (isLoading) return (
    <div className="space-y-5">
      <LoadingKpiGrid count={4} />
      <LoadingPanel height="h-72" />
    </div>
  );
  if (!data) return <ErrorState message={t('analytics.platform.errorCatalog')} onRetry={onRetry} />;

  const soldPct = data.totalTicketCapacity > 0 ? (data.totalTicketsSold / data.totalTicketCapacity) * 100 : 0;

  const toursByStatus = useMemo(() => {
    if (!data?.toursByStatus) return [];
    return data.toursByStatus.map((item) => {
      const norm = item.label.toLowerCase();
      let label = item.label;
      if (norm === 'active') label = t('analytics.platform.active');
      else if (norm === 'inactive') label = t('analytics.platform.inactive');
      else if (norm === 'draft') label = t('analytics.platform.tourDraft');
      return { ...item, label };
    });
  }, [data?.toursByStatus, t]);

  const toursByCity = useMemo(() => {
    if (!data?.toursByCity) return [];
    return data.toursByCity.map((item) => {
      let label = item.label;
      if (item.label.toLowerCase() === 'unknown') label = t('analytics.platform.cityUnknown');
      return { ...item, label };
    });
  }, [data?.toursByCity, t]);

  return (
    <div className="space-y-5">
      <KpiGrid cols={4}>
        <KpiCard label={t('analytics.platform.totalTours')} value={formatNumber(data.totalTours)}
          sub={`${formatNumber(data.activeTours)} ${t('analytics.platform.active').toLowerCase()}`}
          icon={<Map className="h-5 w-5" />} accent="brand" />
        <KpiCard label={t('analytics.platform.schedules')} value={formatNumber(data.totalSchedules)}
          sub={`${formatNumber(data.upcomingSchedules)} ${t('analytics.platform.upcoming').toLowerCase()}`}
          icon={<Calendar className="h-5 w-5" />} accent="slate" />
        <KpiCard label={t('analytics.platform.occupancyRate')} value={formatPercent(data.scheduleOccupancyRate)}
          icon={<TrendingUp className="h-5 w-5" />} accent="emerald"
          trend={{ dir: data.scheduleOccupancyRate >= 50 ? 'up' : 'down', label: formatPercent(data.scheduleOccupancyRate) }} />
        <KpiCard label={t('analytics.platform.ticketsSold')} value={formatNumber(data.totalTicketsSold)}
          sub={`${formatPercent(soldPct)} ${t('analytics.platform.utilization').toLowerCase()}`}
          icon={<Ticket className="h-5 w-5" />} accent="amber" />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <MetricGroup title={t('analytics.platform.scheduleTimeline')} icon={<Calendar className="h-4 w-4" />}
          items={[
            { label: t('analytics.platform.upcoming'), value: formatNumber(data.upcomingSchedules), bar: data.upcomingSchedules / (data.totalSchedules || 1) * 100, barColor: 'bg-sky-500' },
            { label: t('analytics.platform.ongoing'), value: formatNumber(data.ongoingSchedules), bar: data.ongoingSchedules / (data.totalSchedules || 1) * 100, barColor: 'bg-emerald-500' },
            { label: t('analytics.platform.completed'), value: formatNumber(data.completedSchedules), bar: data.completedSchedules / (data.totalSchedules || 1) * 100, barColor: 'bg-slate-400' },
          ]} />
        <MetricGroup title={t('analytics.platform.ticketInventory')} icon={<Ticket className="h-4 w-4" />}
          items={[
            { label: t('analytics.platform.totalCapacity'), value: formatNumber(data.totalTicketCapacity) },
            { label: t('analytics.platform.ticketsSold'), value: `${formatNumber(data.totalTicketsSold)} (${formatPercent(soldPct)})`, bar: soldPct, barColor: 'bg-brand' },
            { label: t('analytics.platform.available'), value: formatNumber(data.totalTicketsAvailable) },
          ]} />
      </div>

      <ChartGrid columns={3}>
        <DistributionChart title={t('analytics.platform.toursByCategory')} data={toursByCategory} collapseLimit={6} />
        <DistributionChart title={t('analytics.platform.toursByCity')} data={toursByCity} pageSize={8} />
        <DistributionChart title={t('analytics.platform.toursByStatus')} data={toursByStatus} />
      </ChartGrid>

      <AnalyticsPanel
        title={t('analytics.platform.topBookedTours')}
        subtitle={t('analytics.platform.topBookedSubtitle')}
        padded={false}
        action={
          <select value={catalogTop} onChange={(e) => onTopChange(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600">
            {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{t('analytics.platform.topN', { n })}</option>)}
          </select>
        }
        bodyClassName="px-0 pb-0"
      >
        <TopToursTable tours={data.topBookedTours} />
      </AnalyticsPanel>
    </div>
  );
};

// ── Vouchers Tab ───────────────────────────────────────────────────────────────
const VouchersTab: React.FC<{
  isLoading: boolean;
  data: ReturnType<typeof usePlatformVouchers>['data'];
  onRetry: () => void;
}> = ({ isLoading, data, onRetry }) => {
  const { t } = useTranslation();
  if (isLoading) return <div className="space-y-5"><LoadingKpiGrid count={4} /><LoadingPanel height="h-64" /></div>;
  if (!data) return <ErrorState message={t('analytics.platform.errorVouchers')} onRetry={onRetry} />;

  const byDiscountType = useMemo(() => {
    if (!data?.byDiscountType) return [];
    return data.byDiscountType.map((item) => {
      const norm = item.label.toLowerCase();
      let label = item.label;
      if (norm.includes('percent')) label = t('analytics.platform.discountPercentage');
      else if (norm.includes('fixed')) label = t('analytics.platform.discountFixed');
      return { ...item, label };
    });
  }, [data?.byDiscountType, t]);

  const byUserVoucherStatus = useMemo(() => {
    if (!data?.byUserVoucherStatus) return [];
    return data.byUserVoucherStatus.map((item) => {
      const norm = item.label.toLowerCase();
      let label = item.label;
      if (norm === 'unused') label = t('analytics.platform.voucherUnused');
      else if (norm === 'used') label = t('analytics.platform.voucherUsed');
      else if (norm === 'expired') label = t('analytics.platform.expired');
      return { ...item, label };
    });
  }, [data?.byUserVoucherStatus, t]);

  return (
    <div className="space-y-5">
      <KpiGrid cols={4}>
        <KpiCard label={t('analytics.platform.totalVouchers')} value={formatNumber(data.totalVouchers)}
          icon={<Ticket className="h-5 w-5" />} accent="brand" />
        <KpiCard label={t('analytics.platform.active')} value={formatNumber(data.activeVouchers)}
          sub={t('analytics.platform.redeemableNow')}
          icon={<CheckCircle className="h-5 w-5" />} accent="emerald" />
        <KpiCard label={t('analytics.platform.expired')} value={formatNumber(data.expiredVouchers)}
          icon={<Zap className="h-5 w-5" />} accent="slate" />
        <KpiCard label={t('analytics.platform.redemptionRate')} value={formatPercent(data.redemptionRate)}
          sub={t('analytics.platform.redemptionsHint', { count: formatNumber(data.totalRedemptions) })}
          icon={<TrendingUp className="h-5 w-5" />} accent="amber"
          trend={{ dir: data.redemptionRate >= 30 ? 'up' : 'neutral', label: formatPercent(data.redemptionRate) }} />
      </KpiGrid>
      <ChartGrid>
        <DistributionChart title={t('analytics.platform.byDiscountType')} data={byDiscountType} />
        <DistributionChart title={t('analytics.platform.byUserVoucherStatus')} data={byUserVoucherStatus} />
      </ChartGrid>
    </div>
  );
};

// ── Social Tab ─────────────────────────────────────────────────────────────────
const SocialTab: React.FC<{
  isLoading: boolean;
  data: ReturnType<typeof usePlatformSocial>['data'];
  onRetry: () => void;
}> = ({ isLoading, data, onRetry }) => {
  const { t } = useTranslation();
  if (isLoading) return <div className="space-y-5"><LoadingKpiGrid count={3} cols={3} /><LoadingPanel height="h-72" /></div>;
  if (!data) return <ErrorState message={t('analytics.platform.errorSocial')} onRetry={onRetry} />;

  const acceptedRate = data.totalFriendships > 0
    ? (data.acceptedFriendships / data.totalFriendships) * 100 : 0;

  const momentsByPrivacy = useMemo(() => {
    if (!data?.momentsByPrivacy) return [];
    return data.momentsByPrivacy.map((item) => {
      const norm = item.label.toLowerCase();
      let label = item.label;
      if (norm === 'public') label = t('analytics.platform.privacyPublic');
      else if (norm.includes('friend')) label = t('analytics.platform.privacyFriend');
      else if (norm === 'private') label = t('analytics.platform.privacyPrivate');
      return { ...item, label };
    });
  }, [data?.momentsByPrivacy, t]);

  const friendshipStatusDistribution = useMemo(() => {
    if (!data?.friendshipStatusDistribution) return [];
    return data.friendshipStatusDistribution.map((item) => {
      const norm = item.label.toLowerCase();
      let label = item.label;
      if (norm === 'accepted') label = t('analytics.platform.accepted');
      else if (norm === 'declined') label = t('analytics.platform.friendshipDeclined');
      else if (norm === 'pending') label = t('analytics.platform.pending');
      return { ...item, label };
    });
  }, [data?.friendshipStatusDistribution, t]);

  return (
    <div className="space-y-5">
      <KpiGrid cols={3}>
        <KpiCard label={t('analytics.platform.friendships')} value={formatNumber(data.totalFriendships)}
          sub={`${formatNumber(data.acceptedFriendships)} ${t('analytics.platform.accepted').toLowerCase()}`}
          icon={<Users className="h-5 w-5" />} accent="brand" />
        <KpiCard label={t('analytics.platform.tourMoments')} value={formatNumber(data.totalTourMoments)}
          sub={`${formatNumber(data.totalMomentReactions)} ${t('analytics.platform.reactions').toLowerCase()}`}
          icon={<Heart className="h-5 w-5" />} accent="accent"
          trend={{ dir: data.totalTourMoments > 0 ? 'up' : 'neutral', label: formatNumber(data.totalTourMoments) }} />
        <KpiCard label={t('analytics.platform.messages')} value={formatNumber(data.totalChatMessages)}
          sub={`${formatNumber(data.unreadChatMessages)} ${t('analytics.platform.unread').toLowerCase()}`}
          icon={<MessageCircle className="h-5 w-5" />} accent="slate" />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <MetricGroup title={t('analytics.platform.friendships')} icon={<Users className="h-4 w-4" />}
          items={[
            { label: t('analytics.platform.accepted'), value: formatNumber(data.acceptedFriendships), bar: acceptedRate, barColor: 'bg-emerald-500' },
            { label: t('analytics.platform.pendingRequests'), value: formatNumber(data.pendingFriendRequests), bar: data.totalFriendships > 0 ? data.pendingFriendRequests / data.totalFriendships * 100 : 0, barColor: 'bg-amber-400' },
          ]} />
        <MetricGroup title={t('analytics.platform.tourMoments')} icon={<Heart className="h-4 w-4" />}
          items={[
            { label: t('analytics.platform.totalMoments'), value: formatNumber(data.totalTourMoments) },
            { label: t('analytics.platform.reactions'), value: formatNumber(data.totalMomentReactions) },
            { label: t('analytics.platform.comments'), value: formatNumber(data.totalMomentComments) },
          ]} />
      </div>

      <ChartGrid>
        <DistributionChart title={t('analytics.platform.momentsByPrivacy')} data={momentsByPrivacy} />
        <DistributionChart title={t('analytics.platform.friendshipStatusDist')} data={friendshipStatusDistribution} />
      </ChartGrid>
    </div>
  );
};

// ── Health Tab ─────────────────────────────────────────────────────────────────
const HealthTab: React.FC<{
  isLoading: boolean;
  data: ReturnType<typeof usePlatformHealth>['data'];
  onRetry: () => void;
}> = ({ isLoading, data, onRetry }) => {
  const { t } = useTranslation();
  if (!isLoading && !data) return <ErrorState message={t('analytics.platform.errorHealth')} onRetry={onRetry} />;
  return <HealthPanel data={data} isLoading={isLoading} />;
};

export default PlatformAnalyticsPage;
