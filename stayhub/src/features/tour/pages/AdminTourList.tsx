import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Search, Eye, Star, ListFilter, X, RefreshCw, User as UserIcon } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useAdminTours } from "../hooks/useAdminTours";
import { type Tour } from "../types/tour";
import { ChangeManagerModal } from "../components/ChangeManagerModal";
import { AdminTourDetailModal } from "../components/AdminTourDetailModal";
import { ManagerCell } from "../components/ManagerCell";
import { userService } from "../../auth/services/user.service";
import type { ReadUserDTO } from "../../auth/types/user";

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-600",
  Draft: "bg-slate-100 text-slate-600",
  Full: "bg-amber-50 text-amber-600",
  Banned: "bg-rose-50 text-rose-600",
};

export const AdminTourList: React.FC = () => {
  const { t } = useTranslation();
  const [pageSize, setPageSize] = useState(5);
  
  const {
    data,
    isLoading,
    error,
    setPage,
    search,
    setSearch,
    managerIdFilter,
    setManagerIdFilter,
    clearFilters,
    categories,
    isCategoryLoading,
    refetch,
  } = useAdminTours(pageSize);

  const [selectedTourForManagerChange, setSelectedTourForManagerChange] = useState<Tour | null>(null);
  const [selectedTourForDetail, setSelectedTourForDetail] = useState<Tour | null>(null);
  
  const [managers, setManagers] = useState<ReadUserDTO[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchManagers = async () => {
      try {
        const response = await userService.filterUsers(1, 100, undefined, "Manager");
        if (isMounted) {
          setManagers(response.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch managers", error);
      }
    };
    fetchManagers();
    return () => {
      isMounted = false;
    };
  }, []);

  const tours = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  const totalItems = data?.total || 0;
  
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  
  const hasActiveFilters = search.trim() !== "" || managerIdFilter !== undefined;

  const getStatusLabel = useCallback((status?: string | null) => {
    const map: Record<string, string> = {
      Active: t("common.active"),
      Draft: t("tour.draft"),
      Full: t("tour.full"),
      Banned: t("tour.banned"),
    };
    return map[status || "Draft"] ?? status ?? t("tour.draft");
  }, [t]);

  const handleView = useCallback((tour: Tour) => {
    setSelectedTourForDetail(tour);
  }, []);

  const columns: Column<Tour>[] = useMemo(
    () => [
      {
        header: "",
        className: "w-24",
        render: (tour) =>
          tour.imageUrl ? (
            <img
              src={tour.imageUrl}
              alt={tour.name}
              className="h-10 w-10 min-w-[40px] shrink-0 rounded-lg border border-slate-100 object-cover bg-slate-100"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-100 text-slate-400">
              <span className="text-[10px] font-medium">{t("tour.noImg")}</span>
            </div>
          ),
      },
      {
        header: t("tour.tourNameCol"),
        render: (tour) => (
          <span className="line-clamp-2 max-w-[200px] text-sm font-semibold text-slate-800">
            {tour.name}
          </span>
        ),
      },
      {
        header: t("tour.category"),
        render: (tour) => (
          <span className="text-sm text-slate-600">
            {categoryNameById.get(tour.categoryId) ?? `ID ${tour.categoryId}`}
          </span>
        ),
      },
      {
        header: t("common.status"),
        render: (tour) => (
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              STATUS_STYLES[tour.status || "Draft"] ??
              "bg-slate-100 text-slate-500"
            }`}
          >
            {getStatusLabel(tour.status)}
          </span>
        ),
      },
      {
        header: t("tour.rating"),
        render: (tour) => {
          const rating = tour.averageStar ?? 0;
          const displayRating = rating > 0 ? rating.toFixed(1) : t("tour.noRatings");
          return (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < Math.floor(rating)
                        ? "fill-amber-400 text-amber-400"
                        : i < rating
                          ? "fill-amber-200 text-amber-400"
                          : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-slate-600">
                {displayRating}
              </span>
            </div>
          );
        },
      },
      {
        header: "Manager",
        render: (tour) => (
          <ManagerCell userId={tour.createdBy} fallbackName={tour.createdByName} />
        )
      },
      {
        header: t("common.actions"),
        render: (tour) => (
          <div className="flex items-center gap-1.5">
            <ActionButton
              variant="secondary"
              aria-label={t("tour.view")}
              onClick={() => handleView(tour)}
              className="h-8 w-8 text-brand hover:bg-brand-light hover:text-brand-hover"
            >
              <Eye className="h-3.5 w-3.5" />
            </ActionButton>
            
            <ActionButton
              variant="secondary"
              aria-label="Change Manager"
              title="Change Manager"
              onClick={() => setSelectedTourForManagerChange(tour)}
              className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </ActionButton>
          </div>
        ),
      },
    ],
    [
      t,
      getStatusLabel,
      categoryNameById,
      handleView,
    ],
  );

  return (
    <div className="rounded-2xl">
      {/* Card header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div>
            <h2 className="text-[15px] font-bold leading-tight text-slate-900">
              Admin Tour Management
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder={t("tour.searchToursPlaceholderMgr")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors sm:w-64">
            <UserIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <select
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
              value={managerIdFilter || ""}
              onChange={(e) => {
                const val = e.target.value;
                setManagerIdFilter(val ? Number(val) : undefined);
              }}
            >
              <option value="">All Managers</option>
              {managers.map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors">
            <select
              className="bg-transparent text-sm text-slate-700 outline-none"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5 {t("common.perPage")}</option>
              <option value={10}>10 {t("common.perPage")}</option>
              <option value={20}>20 {t("common.perPage")}</option>
              <option value={50}>50 {t("common.perPage")}</option>
            </select>
          </div>

          <ActionButton
            variant="secondary"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="gap-2 px-4 py-2 text-sm"
          >
            <X className="h-4 w-4" />
            {t("tour.clear")}
          </ActionButton>
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="flex justify-center p-10 text-rose-500">{error}</div>
      ) : (
        <Table
          data={tours}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage={t("tour.noToursFound")}
          isLoading={isLoading}
          skeletonRows={pageSize}
        />
      )}

      {/* Footer / Pagination */}
      <PaginationButton
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <ChangeManagerModal
        isOpen={selectedTourForManagerChange !== null}
        onClose={() => setSelectedTourForManagerChange(null)}
        tour={selectedTourForManagerChange}
        onSuccess={() => refetch()}
      />

      <AdminTourDetailModal
        tour={selectedTourForDetail}
        onClose={() => setSelectedTourForDetail(null)}
        categoryName={selectedTourForDetail ? categoryNameById.get(selectedTourForDetail.categoryId) : undefined}
      />
    </div>
  );
};
