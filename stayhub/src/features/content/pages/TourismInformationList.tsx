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
} from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { Table, type Column } from "../../../components/dashboard/Table";
import { useTranslation } from "../../../contexts/LocaleContext";
import { getImg } from "../../../config/api/api";
import { useChangeTourismInformationStatus } from "../hooks/useChangeTourismInformationStatus";
import { useTourismInformation } from "../hooks/useTourismInformation";
import type { TourismInformation } from "../types/tourismInformation";
import {
  TOURISM_INFORMATION_STATUS,
  TOURISM_INFORMATION_TYPES,
  TOURISM_TYPE_LABELS,
} from "../types/tourismInformation";

const getTypeLabel = (type: string) =>
  TOURISM_TYPE_LABELS[type as keyof typeof TOURISM_TYPE_LABELS] ?? type;

export const TourismInformationList: React.FC = () => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filters, setFilters] = useState({
    searchTerm: "",
    city: "",
    type: "",
    status: "",
  });

  const formatDate = (date?: string | null) => {
    if (!date) return t("common.na");
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return t("common.na");
    return parsed.toLocaleString();
  };

  const { data, isLoading, error, pageSize, setPage, handleCreate, handleViewDetail, handleEdit } =
    useTourismInformation(filters);
  const { executeStatusChange, updatingId, isActiveStatus } =
    useChangeTourismInformationStatus();

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
                active ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
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
                onClick={() => executeStatusChange(item.id, item.status)}
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
                className="h-8 w-8"
                title={t("content.edit")}
              >
                <Pencil className="h-3.5 w-3.5" />
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
    <div className="rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-bold leading-tight text-slate-900">
            {t("content.tourismInfoManagement")}
          </h2>
          <p className="mt-1 text-xs text-slate-500">{t("content.tourismInfoManagementDesc")}</p>
        </div>
        <ActionButton variant="primary" onClick={handleCreate} className="gap-2 px-4 py-2 text-sm">
          <Plus className="h-4 w-4" /> {t("content.addTourismInfo")}
        </ActionButton>
      </div>

      <div className="grid gap-3 border-b border-slate-100 px-6 py-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t("content.searchTourismInfo")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white"
        >
          <option value="">{t("content.allTypes")}</option>
          {TOURISM_INFORMATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {getTypeLabel(type)}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white"
        >
          <option value="">{t("content.allStatuses")}</option>
          <option value={TOURISM_INFORMATION_STATUS.ACTIVE}>{t("common.active")}</option>
          <option value={TOURISM_INFORMATION_STATUS.INACTIVE}>{t("common.inactive")}</option>
        </select>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t("content.filterByCity")}
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
          />
          {hasActiveFilters && (
            <ActionButton variant="secondary" onClick={handleResetFilters} className="shrink-0 px-3">
              {t("content.reset")}
            </ActionButton>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 text-slate-500">{t("content.loadingTourismInfo")}</div>
      ) : error ? (
        <div className="flex justify-center p-10 text-rose-500">{error}</div>
      ) : (
        <Table
          data={tourismItems}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage={t("content.noTourismInfoFound")}
        />
      )}

      <PaginationButton
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
};
