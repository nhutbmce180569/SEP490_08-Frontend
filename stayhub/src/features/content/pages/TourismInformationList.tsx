import React, { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Image as ImageIcon,
  Lock,
  MapPin,
  Pencil,
  Plus,
  Search,
  Tag,
  Unlock,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { Table, type Column } from "../../../components/dashboard/Table";
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";
import { useTranslation } from "../../../contexts/LocaleContext";
import { PATH } from "../../../config/routes/route";
import { getImg } from "../../../config/api/api";
import { TourismInformationDetailModal } from "../components/TourismInformationDetailModal";
import { useChangeTourismInformationStatus } from "../hooks/useChangeTourismInformationStatus";
import { useTourismInformation } from "../hooks/useTourismInformation";
import { useTourismInformationCities } from "../hooks/useTourismInformationCities";
import type { TourismInformation } from "../types/tourismInformation";
import {
  TOURISM_INFORMATION_STATUS,
  TOURISM_INFORMATION_TYPES,
  TOURISM_TYPE_LABELS,
} from "../types/tourismInformation";

const getTypeLabel = (type: string) =>
  TOURISM_TYPE_LABELS[type as keyof typeof TOURISM_TYPE_LABELS] ?? type;

export const TourismInformationList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: number; status: string } | null>(null);
  const [filters, setFilters] = useState({
    searchTerm: "",
    city: "",
    type: "",
    status: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const formatDate = (date?: string | null) => {
    if (!date) return t("common.na");
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return t("common.na");
    return parsed.toLocaleString();
  };

  const { data, isLoading, error, pageSize, setPage, setPageSize, handleCreate, handleEdit } =
    useTourismInformation(filters);
  const { executeStatusChange, updatingId, isActiveStatus } =
    useChangeTourismInformationStatus();
  const { cities: provinces, isLoading: isProvincesLoading } = useTourismInformationCities();

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setFilters({
        searchTerm: searchInput.trim(),
        city: cityInput.trim(),
        type: typeFilter,
        status: statusFilter,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, cityInput, typeFilter, statusFilter, setPage]);

  const tourismItems = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  const totalItems = data?.total || 0;

  const handleViewDetail = (id: number) => {
    setSelectedDetailId(id.toString());
  };

  const columns: Column<TourismInformation>[] = useMemo(
    () => [
      {
        header: t("content.image"),
        className: "w-28",
        render: (item) =>
          item.imageUrl ? (
            <img
              src={getImg(item.imageUrl)}
              alt={item.name}
              className="h-14 w-24 rounded-lg border border-slate-200 bg-slate-100 object-cover shadow-sm"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/200x100/f8fafc/94a3b8?text=Error";
              }}
            />
          ) : (
            <div className="flex h-14 w-24 items-center justify-center rounded-lg border border-slate-100 bg-slate-100 text-slate-400">
              <ImageIcon className="h-5 w-5" />
            </div>
          ),
      },
      {
        header: t("content.name"),
        render: (item) => (
          <div className="min-w-[180px]">
            <div className="font-semibold text-slate-800">{item.name}</div>
            <div className="mt-0.5 line-clamp-2 text-xs text-slate-500">
              {item.description || t("content.noDescription")}
            </div>
          </div>
        ),
      },
      {
        header: t("content.type"),
        render: (item) => (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600">
            <Tag className="h-3 w-3" />
            {getTypeLabel(item.type)}
          </span>
        ),
      },
      {
        header: t("content.location"),
        render: (item) => (
          <div className="max-w-[220px] text-sm text-slate-500">
            <div className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="line-clamp-2">
                {[item.address, item.city, item.country].filter(Boolean).join(", ") || t("common.na")}
              </span>
            </div>
          </div>
        ),
      },
      {
        header: t("common.status"),
        render: (item) => {
          const active = isActiveStatus(item.status);
          return (
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
              }`}
            >
              {active ? t("common.active") : t("common.inactive")}
            </span>
          );
        },
      },
      {
        header: t("content.updated"),
        render: (item) => (
          <span className="text-sm text-slate-500">{formatDate(item.updatedAt)}</span>
        ),
      },
      {
        header: t("content.action"),
        render: (item) => {
          const active = isActiveStatus(item.status);
          return (
            <div className="flex items-center gap-1.5">
              <ActionButton
                variant="secondary"
                onClick={() => handleViewDetail(item.id)}
                className="h-8 w-8 text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800"
                title={t("content.viewDetails")}
              >
                <Eye className="h-3.5 w-3.5" />
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => handleEdit(item.id)}
                className={`h-8 w-8 ${
                  active ? "cursor-not-allowed opacity-50" : ""
                }`}
                title={t("content.edit")}
                disabled={active}
              >
                <Pencil className="h-3.5 w-3.5" />
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => setPendingStatusChange({ id: item.id, status: item.status || "" })}
                className={`h-8 w-8 ${updatingId === item.id ? "cursor-wait opacity-50" : ""} ${
                  active
                    ? "text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    : "text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
                title={active ? t("content.deactivate") : t("content.activate")}
                disabled={updatingId === item.id}
              >
                {active ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              </ActionButton>
            </div>
          );
        },
      },
    ],
    [t, executeStatusChange, handleEdit, handleViewDetail, isActiveStatus, updatingId],
  );

  const handleResetFilters = () => {
    setSearchInput("");
    setCityInput("");
    setTypeFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(searchInput || cityInput || typeFilter || statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap flex-1 items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0 w-full sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder={t("content.searchTourismInfo")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="relative">
            <ActionButton
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-2 px-3 py-2 text-sm shrink-0 ${hasActiveFilters ? "border-brand bg-brand-light/30 text-brand" : ""}`}
            >
              <Filter className="h-4 w-4" />
              {t("common.filter") || "Filter"}
            </ActionButton>

            {showFilters && (
              <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">{t("content.type")}</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white"
                    >
                      <option value="">{t("content.allTypes")}</option>
                      {TOURISM_INFORMATION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {getTypeLabel(type)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">{t("common.status")}</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white"
                    >
                      <option value="">{t("content.allStatuses")}</option>
                      <option value={TOURISM_INFORMATION_STATUS.ACTIVE}>{t("common.active")}</option>
                      <option value={TOURISM_INFORMATION_STATUS.INACTIVE}>{t("common.inactive")}</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">{t("content.city") || "City"}</label>
                    <select
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      disabled={isProvincesLoading}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white disabled:opacity-50"
                    >
                      <option value="">{t("content.filterByCity")}</option>
                      {provinces.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {hasActiveFilters && (
                    <ActionButton variant="secondary" onClick={handleResetFilters} className="mt-1 w-full justify-center">
                      {t("content.reset")}
                    </ActionButton>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0">
            <select
              className="bg-transparent text-sm text-slate-700 outline-none"
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setPageSize(newSize);
                setPage(1);
              }}
            >
              <option value={5}>5 {t("common.perPage")}</option>
              <option value={10}>10 {t("common.perPage")}</option>
              <option value={15}>15 {t("common.perPage")}</option>
              <option value={20}>20 {t("common.perPage")}</option>
              <option value={50}>50 {t("common.perPage")}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center shrink-0">
          <ActionButton variant="primary" onClick={handleCreate} className="gap-2 px-4 py-2 text-sm shrink-0">
            <Plus className="h-4 w-4" /> {t("content.addTourismInfo")}
          </ActionButton>
        </div>
      </div>

      {error ? (
        <div className="flex justify-center p-10 text-rose-500">{error}</div>
      ) : (
        <Table
          data={tourismItems}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage={t("content.noTourismInfoFound")}
          isLoading={isLoading}
          skeletonRows={pageSize}
        />
      )}

      <PaginationButton
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!pendingStatusChange}
        onClose={() => setPendingStatusChange(null)}
        onConfirm={() => {
          if (pendingStatusChange) {
            executeStatusChange(pendingStatusChange.id, pendingStatusChange.status);
            setPendingStatusChange(null);
          }
        }}
        title={
          pendingStatusChange && isActiveStatus(pendingStatusChange.status)
            ? (t("content.confirmDeactivateTitle") || "Confirm Deactivation")
            : (t("content.confirmActivateTitle") || "Confirm Activation")
        }
        message={
          pendingStatusChange && isActiveStatus(pendingStatusChange.status)
            ? (t("content.confirmDeactivateMessage") || "Are you sure you want to deactivate this item? It will no longer be visible to users.")
            : (t("content.confirmActivateMessage") || "Are you sure you want to activate this item? It will become visible to users.")
        }
        confirmText="Confirm"
        cancelText="Cancel"
        variant={pendingStatusChange && isActiveStatus(pendingStatusChange.status) ? "warning" : "primary"}
      />
      
      <TourismInformationDetailModal 
        id={selectedDetailId} 
        onClose={() => setSelectedDetailId(null)} 
      />
    </div>
  );
};
