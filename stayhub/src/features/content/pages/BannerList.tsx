import React, { useMemo, useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Image as ImageIcon, Lock, Unlock, Search } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useBanners } from "../hooks/useBanners";
import { type ReadBannerDTO } from "../types/banner";
import { getImg } from "../../../config/api/api";
import { useChangeBannerStatus } from "../hooks/useChangeBannerStatus";
import { DynamicText } from "../../../components/DynamicText";

import { bannerService } from "../services/banner.service";
import { useToast } from "../../../contexts/ToastContext";

const PAGE_SIZE = 5;

export const BannerList: React.FC = () => {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusTarget, setStatusTarget] = useState<ReadBannerDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReadBannerDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, error, page, pageSize, setPage, setPageSize, handleCreate, handleEdit, refetch } = useBanners(PAGE_SIZE, keyword);
  const { executeStatusChange, updatingId } = useChangeBannerStatus(refetch);

  const statusTargetIsActive = Boolean(statusTarget?.isActive);

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return;
    await executeStatusChange(statusTarget.id, statusTargetIsActive);
    setStatusTarget(null);
  };

  const handleDeleteClick = (banner: ReadBannerDTO) => {
    setDeleteTarget(banner);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await bannerService.delete(deleteTarget.id);
      success(t("content.bannerDeleted") || "Banner deleted successfully");
      refetch();
    } catch (err: any) {
      showError(err.response?.data?.message || t("content.failedToDeleteBanner") || "Failed to delete banner");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword !== searchInput) {
        setPage(1);
        setKeyword(searchInput);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, keyword, setPage]);

  const banners = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || (data as any)?.page || page;
  const totalItems = data?.total || 0;

  const columns: Column<ReadBannerDTO>[] = useMemo(
    () => [
      {
        header: t("content.image"),
        className: "w-32",
        render: (banner) =>
          banner.imageUrl ? (
            <img
              src={getImg(banner.imageUrl)}
              alt={banner.title}
              className="h-12 w-24 rounded shadow-sm border border-slate-200 object-cover bg-slate-100"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/200x100/f8fafc/94a3b8?text=Error";
              }}
            />
          ) : (
            <div className="flex h-12 w-24 items-center justify-center rounded border border-slate-100 bg-slate-100 text-slate-400">
              <ImageIcon className="h-5 w-5" />
            </div>
          ),
      },
      {
        header: t("content.bannerTitle"),
        render: (banner) => <span className="font-semibold text-slate-800"><DynamicText text={banner.title} /></span>,
      },
      {
        header: t("content.targetUrl"),
        render: (banner) => (
          <span className="text-sm text-slate-500 max-w-[200px] truncate block" title={banner.targetUrl}>
            {banner.targetUrl || t("common.na")}
          </span>
        ),
      },
      {
        header: t("content.priority"),
        render: (banner) => <span className="text-sm font-medium">{banner.priority ?? 0}</span>,
      },
      {
        header: t("common.status"),
        render: (banner) => (
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              banner.isActive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {banner.isActive ? t("common.active") : t("common.inactive")}
          </span>
        ),
      },
      {
        header: t("common.actions"),
        render: (banner) => (
          <div className="flex items-center gap-1.5">
            <ActionButton variant="secondary" onClick={() => handleEdit(banner.id)} className="h-8 w-8" title={t("common.edit")}>
              <Pencil className="h-3.5 w-3.5" />
            </ActionButton>
            <ActionButton 
              variant="secondary" 
              onClick={() => setStatusTarget(banner)}
              className={`h-8 w-8 ${updatingId === banner.id ? "opacity-50 cursor-wait" : ""} ${banner.isActive ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200" : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"}`}
              title={banner.isActive ? t("content.deactivate") : t("content.activate")}
              disabled={updatingId === banner.id}
            >
              {banner.isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </ActionButton>
            <ActionButton variant="warning" onClick={() => handleDeleteClick(banner)} className="h-8 w-8" title={t("common.delete")}>
              <Trash2 className="h-3.5 w-3.5" />
            </ActionButton>
          </div>
        ),
      },
    ],
    [t, handleEdit, handleDeleteClick, updatingId]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap flex-1 items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0 w-full sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder={t("content.searchByTitle")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0">
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
        </div>

        <div className="flex items-center shrink-0">
          <ActionButton variant="primary" onClick={handleCreate} className="gap-2 px-4 py-2 text-sm shadow-sm shrink-0">
            <Plus className="h-4 w-4" /> {t("content.addBanner")}
          </ActionButton>
        </div>
      </div>

      {error ? (
        <div className="flex justify-center p-10 text-rose-500">{error}</div>
      ) : (
        <Table
          data={banners}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage={t("content.noBannersFound")}
          tableClassName="w-full min-w-[750px] border-collapse table-fixed"
          isLoading={isLoading}
          skeletonRows={pageSize}
        />
      )}

      <PaginationButton currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />

      <ConfirmDialog
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleConfirmStatusChange}
        title={statusTargetIsActive ? t("content.deactivate") : t("content.activate")}
        message={
          <span>
            {statusTargetIsActive
              ? t("content.deactivateBannerConfirm")
              : t("content.activateBannerConfirm")}
            {statusTarget && (
              <span className="mt-2 block font-semibold text-slate-700">
                <DynamicText text={statusTarget.title} />
              </span>
            )}
          </span>
        }
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        variant={statusTargetIsActive ? "warning" : "primary"}
        icon={
          statusTargetIsActive ? (
            <Lock className="h-6 w-6 text-rose-500" />
          ) : (
            <Unlock className="h-6 w-6 text-emerald-500" />
          )
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={t("content.deleteBannerConfirm") || "Delete Banner"}
        message={
          <div>
            <p className="mb-2">{t("content.deleteBannerWarning") || "Are you sure you want to delete this banner?"}</p>
            {deleteTarget && (
              <div className="rounded-lg bg-slate-50 p-3 text-left font-semibold text-slate-700">
                <DynamicText text={deleteTarget.title} />
              </div>
            )}
          </div>
        }
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        variant="warning"
        isLoading={isDeleting}
      />
    </div>
  );
};
