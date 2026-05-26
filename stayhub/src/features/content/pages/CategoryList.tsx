import React, { useMemo } from "react";
import { Pencil, Trash2, Plus, Image as ImageIcon, Lock, Unlock } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useCategories } from "../hooks/useCategories";
import { type ReadCategoryDTO } from "../types/category";
import { getImg } from "../../../config/api/api";
import { useChangeCategoryStatus } from "../hooks/useChangeCategoryStatus";

export const CategoryList: React.FC = () => {
  const { data, isLoading, error, page, pageSize, setPage, handleCreate, handleEdit, handleDelete } = useCategories();
  const { executeStatusChange, updatingId } = useChangeCategoryStatus();

  const categories = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  const totalItems = data?.total || 0;

  const columns: Column<ReadCategoryDTO>[] = useMemo(
    () => [
      {
        header: "Icon",
        className: "w-20",
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
        header: "Name",
        render: (cat) => <span className="font-semibold text-slate-800">{cat.name}</span>,
      },
      {
        header: "Slug",
        render: (cat) => <span className="text-sm text-slate-500">{cat.slug}</span>,
      },
      {
        header: "Description",
        render: (cat) => (
          <span className="text-sm text-slate-500 max-w-[250px] truncate block" title={cat.description}>
            {cat.description || "N/A"}
          </span>
        ),
      },
      {
        header: "Status",
        render: (cat) => (
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              cat.isActive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            {cat.isActive ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        header: "Action",
        render: (cat) => (
          <div className="flex items-center gap-1.5">
            <ActionButton 
              variant="secondary" 
              onClick={() => executeStatusChange(cat.id, cat.isActive)} 
              className={`h-8 w-8 ${updatingId === cat.id ? "opacity-50 cursor-wait" : ""} ${cat.isActive ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200" : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"}`}
              title={cat.isActive ? "Deactivate" : "Activate"}
              disabled={updatingId === cat.id}
            >
              {cat.isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </ActionButton>
            <ActionButton variant="secondary" onClick={() => handleEdit(cat.id)} className="h-8 w-8">
              <Pencil className="h-3.5 w-3.5" />
            </ActionButton>
            <ActionButton variant="warning" onClick={() => handleDelete(cat.id)} className="h-8 w-8">
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
        <h2 className="text-[15px] font-bold leading-tight text-slate-900">Category Management</h2>
        <ActionButton variant="primary" onClick={handleCreate} className="gap-2 px-4 py-2 text-sm">
          <Plus className="h-4 w-4" /> Add Category
        </ActionButton>
      </div>

      {isLoading ? <div className="flex justify-center p-10 text-slate-500">Loading categories...</div> 
        : error ? <div className="flex justify-center p-10 text-rose-500">{error}</div> 
        : <Table data={categories} columns={columns} keyExtractor={(item) => item.id} emptyMessage="No categories found." />}

      <PaginationButton currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
    </div>
  );
};