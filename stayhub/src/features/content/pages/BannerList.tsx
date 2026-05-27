import React, { useMemo, useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Image as ImageIcon, Lock, Unlock, Search } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useBanners } from "../hooks/useBanners";
import { type ReadBannerDTO } from "../types/banner";
import { getImg } from "../../../config/api/api";
import { useChangeBannerStatus } from "../hooks/useChangeBannerStatus";

const PAGE_SIZE = 5;

export const BannerList: React.FC = () => {
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");

  const { data, isLoading, error, page, setPage, handleCreate, handleEdit, handleDelete } = useBanners(keyword);
  const { executeStatusChange, updatingId } = useChangeBannerStatus();

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
  const currentPage = data?.currentPage || 1;
  const totalItems = data?.total || 0;

  const columns: Column<ReadBannerDTO>[] = useMemo(
    () => [
      {
        header: "Image",
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
        header: "Title",
        render: (banner) => <span className="font-semibold text-slate-800">{banner.title}</span>,
      },
      {
        header: "Target URL",
        render: (banner) => (
          <span className="text-sm text-slate-500 max-w-[200px] truncate block" title={banner.targetUrl}>
            {banner.targetUrl || "N/A"}
          </span>
        ),
      },
      {
        header: "Priority",
        render: (banner) => <span className="text-sm font-medium">{banner.priority ?? 0}</span>,
      },
      {
        header: "Status",
        render: (banner) => (
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              banner.isActive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            {banner.isActive ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        header: "Action",
        render: (banner) => (
          <div className="flex items-center gap-1.5">
            <ActionButton 
              variant="secondary" 
              onClick={() => executeStatusChange(banner.id, banner.isActive)} 
              className={`h-8 w-8 ${updatingId === banner.id ? "opacity-50 cursor-wait" : ""} ${banner.isActive ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200" : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"}`}
              title={banner.isActive ? "Deactivate" : "Activate"}
              disabled={updatingId === banner.id}
            >
              {banner.isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </ActionButton>
            <ActionButton variant="secondary" onClick={() => handleEdit(banner.id)} className="h-8 w-8">
              <Pencil className="h-3.5 w-3.5" />
            </ActionButton>
            <ActionButton variant="warning" onClick={() => handleDelete(banner.id)} className="h-8 w-8">
              <Trash2 className="h-3.5 w-3.5" />
            </ActionButton>
          </div>
        ),
      },
    ],
    [handleEdit, handleDelete, executeStatusChange, updatingId]
  );

  return (
    <div className="rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[15px] font-bold leading-tight text-slate-900">Banner Management</h2>
        <ActionButton variant="primary" onClick={handleCreate} className="gap-2 px-4 py-2 text-sm">
          <Plus className="h-4 w-4" /> Add Banner
        </ActionButton>
      </div>

      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-[#EB662B] focus:bg-white focus:ring-4 focus:ring-[#EB662B]/10"
          />
        </div>
      </div>

      {isLoading ? <div className="flex justify-center p-10 text-slate-500">Loading banners...</div> 
        : error ? <div className="flex justify-center p-10 text-rose-500">{error}</div> 
        : <Table data={banners} columns={columns} keyExtractor={(item) => item.id} emptyMessage="No banners found." />}

      <PaginationButton currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
};