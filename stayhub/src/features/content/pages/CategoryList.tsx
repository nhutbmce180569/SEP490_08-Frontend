import React, { useMemo, useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Image as ImageIcon, Lock, Unlock, Search, Eye, X } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useCategories } from "../hooks/useCategories";
import { type ReadCategoryDTO } from "../types/category";
import { getImg } from "../../../config/api/api";
import { useChangeCategoryStatus } from "../hooks/useChangeCategoryStatus";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useToast } from "../../../contexts/ToastContext";
import { deleteCategory } from "../services/category.service";
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";

import { useCategorySignalR } from "../hooks/useCategorySignalR";

const PAGE_SIZE = 5;

export const CategoryList: React.FC = () => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");

  const { data, isLoading, error, page, pageSize, setPage, setPageSize, handleCreate, handleEdit, refetch } = useCategories(PAGE_SIZE, keyword);
  const { executeStatusChange, updatingId } = useChangeCategoryStatus(refetch);
  const { success, error: showError } = useToast();
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ReadCategoryDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedCategoryForStatus, setSelectedCategoryForStatus] = useState<ReadCategoryDTO | null>(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCategoryForView, setSelectedCategoryForView] = useState<ReadCategoryDTO | null>(null);

  const handleViewClick = (category: ReadCategoryDTO) => {
    setSelectedCategoryForView(category);
    setViewModalOpen(true);
  };

  const handleStatusClick = (category: ReadCategoryDTO) => {
    setSelectedCategoryForStatus(category);
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedCategoryForStatus) return;
    await executeStatusChange(selectedCategoryForStatus.id, Boolean(selectedCategoryForStatus.isActive));
    setStatusModalOpen(false);
    setSelectedCategoryForStatus(null);
  };

  const handleDeleteClick = (category: ReadCategoryDTO) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;
    setIsDeleting(true);
    try {
      await deleteCategory(selectedCategory.id);
      success(t("content.categoryDeleted"));
      refetch();
    } catch (err: any) {
      showError(err.response?.data?.message || t("content.failedToDeleteCategory"));
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setSelectedCategory(null);
    }
  };

  useCategorySignalR(refetch);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword !== searchInput) {
        setPage(1);
        setKeyword(searchInput);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, keyword, setPage]);

  const categories = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.page || page;
  const totalItems = data?.total || 0;

  const columns: Column<ReadCategoryDTO>[] = useMemo(
    () => [
      {
        header: t("content.icon"),
        className: "w-[90px] sm:w-[100px]",
        render: (cat) =>
          cat.iconUrl ? (
            <img
              src={getImg(cat.iconUrl)}
              alt={cat.name}
              className="h-12 w-12 rounded shadow-sm border border-slate-200 object-cover bg-slate-100"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/100x100/f8fafc/94a3b8?text=Error";
              }}
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded border border-slate-100 bg-slate-100 text-slate-400">
              <ImageIcon className="h-5 w-5" />
            </div>
          ),
      },
      {
        header: t("content.name"),
        className: "w-[22%] sm:w-[24%]",
        render: (cat) => <span className="font-semibold text-slate-800 block truncate" title={cat.name}>{cat.name}</span>,
      },
      {
        header: t("content.slug"),
        className: "w-[18%] sm:w-[20%]",
        render: (cat) => <span className="text-sm text-slate-500 block truncate" title={cat.slug}>{cat.slug}</span>,
      },
      {
        header: t("common.description"),
        className: "w-[28%] sm:w-[30%]",
        render: (cat) => (
          <span className="text-sm text-slate-500 block w-full truncate" title={cat.description || undefined}>
            {cat.description || t("common.na")}
          </span>
        ),
      },
      {
        header: t("common.status"),
        className: "w-[130px] sm:w-[140px]",
        render: (cat) => (
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              cat.isActive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {cat.isActive ? t("common.active") : t("common.inactive")}
          </span>
        ),
      },
      {
        header: t("common.actions"),
        className: "w-[200px] sm:w-[220px]",
        render: (cat) => (
          <div className="flex items-center gap-1.5">
            <ActionButton variant="secondary" onClick={() => handleViewClick(cat)} className="h-8 w-8" title={t("common.viewDetails")}>
              <Eye className="h-3.5 w-3.5" />
            </ActionButton>
            <ActionButton 
              variant="secondary" 
              onClick={() => handleEdit(cat.id)} 
              className={`h-8 w-8 ${cat.isActive ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={cat.isActive}
              title={cat.isActive ? t("content.cannotEditActive") : t("common.edit")}
            >
              <Pencil className="h-3.5 w-3.5" />
            </ActionButton>
            <ActionButton 
              variant="secondary" 
              onClick={() => handleStatusClick(cat)}
              className={`h-8 w-8 ${updatingId === cat.id ? "opacity-50 cursor-wait" : ""} ${cat.isActive ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200" : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"}`}
              title={cat.isActive ? t("content.deactivate") : t("content.activate")}
              disabled={updatingId === cat.id}
            >
              {cat.isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </ActionButton>
            <ActionButton variant="warning" onClick={() => handleDeleteClick(cat)} className="h-8 w-8" title={t("common.delete")}>
              <Trash2 className="h-3.5 w-3.5" />
            </ActionButton>
          </div>
        ),
      },
    ],
    [t, handleEdit, handleDeleteClick, handleStatusClick, updatingId]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("content.searchByCategoryName")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
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

        <ActionButton variant="primary" onClick={handleCreate} className="gap-2 px-4 py-2 text-sm shadow-sm shrink-0">
          <Plus className="h-4 w-4" /> {t("content.addCategory")}
        </ActionButton>
      </div>

      {isLoading ? <div className="flex justify-center p-10 text-slate-500">{t("content.loadingCategoriesList")}</div> 
        : error ? <div className="flex justify-center p-10 text-rose-500">{error}</div> 
        : <Table data={categories} columns={columns} keyExtractor={(item) => item.id} emptyMessage={t("content.noCategoriesFound")} tableClassName="w-full min-w-[750px] border-collapse table-fixed" />}

      <PaginationButton currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />

      <ConfirmDialog
        open={deleteModalOpen}
        onClose={() => !isDeleting && setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t("content.deleteCategoryConfirm")}
        message={
          <div>
            <p className="mb-2">{t("content.deleteCategoryWarning")}</p>
            {selectedCategory && (
              <div className="rounded-lg bg-slate-50 p-3 text-left">
                <p><strong>{t("content.name")}:</strong> {selectedCategory.name}</p>
                <p><strong>{t("content.slug")}:</strong> {selectedCategory.slug}</p>
              </div>
            )}
          </div>
        }
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        variant="warning"
        isLoading={isDeleting}
      />

      <ConfirmDialog
        open={statusModalOpen}
        onClose={() => !(selectedCategoryForStatus && updatingId === selectedCategoryForStatus.id) && setStatusModalOpen(false)}
        onConfirm={handleConfirmStatusChange}
        title={selectedCategoryForStatus?.isActive ? t("content.confirmDeactivateTitle") : t("content.confirmActivateTitle")}
        message={
          <div>
            <p className="mb-2">
              {selectedCategoryForStatus?.isActive
                ? t("content.confirmDeactivateMessage")
                : t("content.confirmActivateMessage")}
            </p>
            {selectedCategoryForStatus && (
              <div className="rounded-lg bg-slate-50 p-3 text-left">
                <p><strong>{t("content.name")}:</strong> {selectedCategoryForStatus.name}</p>
                <p><strong>{t("content.slug")}:</strong> {selectedCategoryForStatus.slug}</p>
              </div>
            )}
          </div>
        }
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        variant={selectedCategoryForStatus?.isActive ? "warning" : "primary"}
        isLoading={Boolean(selectedCategoryForStatus && updatingId === selectedCategoryForStatus.id)}
      />

      {viewModalOpen && selectedCategoryForView && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <h3 className="text-lg font-bold text-slate-800">{t("content.categoryDetails")}</h3>
              <button onClick={() => setViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 outline-none">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-slate-100 border border-slate-200 text-slate-400">
                  {selectedCategoryForView.iconUrl ? (
                    <img src={getImg(selectedCategoryForView.iconUrl)} alt={selectedCategoryForView.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-10 w-10" />
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">{selectedCategoryForView.name}</h4>
                  <p className="text-sm text-slate-500">{selectedCategoryForView.slug}</p>
                </div>
              </div>
              <div className="mt-6 space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-700">
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-slate-500">{t("common.description")}:</span>
                  <div className="font-medium whitespace-pre-wrap break-words leading-relaxed text-slate-800">
                    {selectedCategoryForView.description || t("common.na")}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                  <span className="font-semibold text-slate-500">{t("common.status")}:</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedCategoryForView.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                    {selectedCategoryForView.isActive ? t("common.active") : t("common.inactive")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
