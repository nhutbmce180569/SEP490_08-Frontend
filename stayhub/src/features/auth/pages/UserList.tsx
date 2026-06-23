import React, { useMemo, useState, useEffect } from "react";
import { Pencil, Trash2, Plus, User as UserIcon, Lock, Unlock, Eye, X, Search, Filter } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useUsers } from "../hooks/useUsers";
import { useChangeUserStatus } from "../hooks/useChangeUserStatus";
import { type ReadUserDTO } from "../types/user";
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";
import { useTranslation } from "../../../contexts/LocaleContext";

export const UserList: React.FC = () => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [filters, setFilters] = useState({ fullName: "", role: "" });

  const userHookData = useUsers(filters);
  const { data, isLoading, error, pageSize, setPage, handleCreate, handleEdit, handleDelete } = userHookData;
  const refetch = (userHookData as any).refetch;

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        if (prev.fullName !== searchInput || prev.role !== roleInput) {
          setPage(1);
          return { fullName: searchInput, role: roleInput };
        }
        return prev;
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, roleInput, setPage]);

  const { executeStatusChange, updatingId } = useChangeUserStatus(refetch);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<ReadUserDTO | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUserForView, setSelectedUserForView] = useState<ReadUserDTO | null>(null);

  const users = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  const totalItems = data?.total || 0;

  const openViewDialog = (user: ReadUserDTO) => {
    setSelectedUserForView(user);
    setViewDialogOpen(true);
  };

  const openStatusDialog = (user: ReadUserDTO) => {
    setSelectedUserForStatus(user);
    setStatusDialogOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (selectedUserForStatus) {
      await executeStatusChange(selectedUserForStatus.id, selectedUserForStatus.status || "Active");
      setStatusDialogOpen(false);
      setSelectedUserForStatus(null);
    }
  };

  const columns: Column<ReadUserDTO>[] = useMemo(
    () => [
      {
        header: t("common.user"),
        render: (user) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-full bg-slate-100 text-slate-400 border border-slate-200">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-800">{user.fullName}</span>
              <span className="text-xs text-slate-500">{user.email}</span>
            </div>
          </div>
        ),
      },
      {
        header: t("common.phone"),
        render: (user) => <span className="text-sm text-slate-600">{user.phoneNumber || t("common.na")}</span>,
      },
      {
        header: t("auth.rolesLabel"),
        render: (user) => (
          <div className="flex flex-wrap gap-1">
            {user.roles?.length > 0 ? (
              user.roles.map((role, idx) => (
                <span key={idx} className="inline-block rounded bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                  {role}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">{t("auth.none")}</span>
            )}
          </div>
        ),
      },
      {
        header: t("common.status"),
        render: (user) => {
          const isActive = user.status === "Active";
          return (
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                }`}
              >
                {user.status || t("auth.unknown")}
              </span>
          );
        },
      },
      {
        header: t("common.actions"),
        render: (user) => (
          <div className="flex items-center gap-1.5">
            <ActionButton variant="secondary" onClick={() => openViewDialog(user)} className="h-8 w-8" title={t("auth.viewDetails")}>
              <Eye className="h-3.5 w-3.5" />
            </ActionButton>
            <ActionButton variant="secondary" onClick={() => handleEdit(user.id)} className="h-8 w-8">
              <Pencil className="h-3.5 w-3.5" />
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => openStatusDialog(user)}
              disabled={updatingId === user.id}
              className={`h-8 w-8 ${
                user.status === "Active"
                  ? "!bg-rose-50 !text-rose-500 hover:!bg-rose-100 hover:!border-rose-200 !border-transparent"
                  : "!bg-emerald-50 !text-emerald-600 hover:!bg-emerald-100 hover:!border-emerald-200 !border-transparent"
              }`}
              title={user.status === "Active" ? t("auth.blockUser") : t("auth.activateUser")}
            >
              {user.status === "Active" ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Unlock className="h-3.5 w-3.5" />
              )}
            </ActionButton>
            <ActionButton variant="warning" onClick={() => handleDelete(user.id)} className="h-8 w-8">
              <Trash2 className="h-3.5 w-3.5" />
            </ActionButton>
          </div>
        ),
      },
    ],
    [handleEdit, handleDelete, updatingId, t]
  );

  return (
    <div className="rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[15px] font-bold leading-tight text-slate-900">{t("auth.userManagement")}</h2>
        <ActionButton variant="primary" onClick={handleCreate} className="gap-2 px-4 py-2 text-sm">
          <Plus className="h-4 w-4" /> {t("auth.addUser")}
        </ActionButton>
      </div>

      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t("auth.searchByFullName")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
          >
            <option value="">{t("auth.allRoles")}</option>
            <option value="Admin">Admin</option>
            <option value="Customer">Customer</option>
            <option value="Host">Host</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 text-slate-500">{t("auth.loadingUsers")}</div>
      ) : error ? (
        <div className="flex justify-center p-10 text-rose-500">{error}</div>
      ) : (
        <Table data={users} columns={columns} keyExtractor={(item) => item.id} emptyMessage={t("errors.noUsersFound")} />
      )}

      <PaginationButton currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />

          <ConfirmDialog
            open={statusDialogOpen}
            onClose={() => setStatusDialogOpen(false)}
            onConfirm={handleConfirmStatusChange}
            title={selectedUserForStatus?.status === "Active" ? t("auth.blockUser") : t("auth.activateUser")}
            message={
              selectedUserForStatus?.status === "Active"
                ? t("auth.blockConfirmMessage", { name: selectedUserForStatus?.fullName ?? "" })
                : t("auth.activateConfirmMessage", { name: selectedUserForStatus?.fullName ?? "" })
            }
            confirmText={selectedUserForStatus?.status === "Active" ? t("auth.yesBlock") : t("auth.yesActivate")}
            variant={selectedUserForStatus?.status === "Active" ? "warning" : "primary"}
          />

          {viewDialogOpen && selectedUserForView && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h3 className="text-lg font-bold text-slate-800">{t("auth.userDetails")}</h3>
                  <button onClick={() => setViewDialogOpen(false)} className="text-slate-400 hover:text-slate-600 outline-none">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 border border-slate-200 text-slate-400">
                      {selectedUserForView.avatarUrl ? (
                        <img src={selectedUserForView.avatarUrl} alt={selectedUserForView.fullName} className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon className="h-10 w-10" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900">{selectedUserForView.fullName}</h4>
                      <p className="text-sm text-slate-500">{selectedUserForView.email}</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">{t("common.phone")}:</span><span className="font-medium">{selectedUserForView.phoneNumber || t("common.na")}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">{t("common.gender")}:</span><span className="font-medium">{selectedUserForView.gender || t("common.na")}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">{t("common.dateOfBirth")}:</span><span className="font-medium">{selectedUserForView.dateOfBirth ? new Date(selectedUserForView.dateOfBirth).toLocaleDateString() : t("common.na")}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">{t("auth.provider")}:</span><span className="font-medium">{selectedUserForView.provider || t("auth.local")}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">{t("auth.rolesLabel")}:</span><span className="font-medium">{selectedUserForView.roles?.join(", ") || t("auth.none")}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">{t("common.status")}:</span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${selectedUserForView.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>{selectedUserForView.status || t("auth.unknown")}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">{t("auth.lastOnline")}:</span><span className="font-medium">{selectedUserForView.lastOnline ? new Date(selectedUserForView.lastOnline).toLocaleString() : t("common.na")}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">{t("auth.createdAt")}:</span><span className="font-medium">{selectedUserForView.createdAt ? new Date(selectedUserForView.createdAt).toLocaleString() : t("common.na")}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">{t("auth.updatedAt")}:</span><span className="font-medium">{selectedUserForView.updatedAt ? new Date(selectedUserForView.updatedAt).toLocaleString() : t("common.na")}</span></div>
                  </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end">
                  <ActionButton variant="secondary" onClick={() => setViewDialogOpen(false)} className="px-5 py-2 text-sm">
                    {t("common.close")}
                  </ActionButton>
                </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default UserList;
