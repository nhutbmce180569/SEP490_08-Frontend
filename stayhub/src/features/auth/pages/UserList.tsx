import React, { useMemo, useState } from "react";
import { Pencil, Trash2, Plus, User as UserIcon, Lock, Unlock, Eye, X } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useUsers } from "../hooks/useUsers";
import { useChangeUserStatus } from "../hooks/useChangeUserStatus";
import { type ReadUserDTO } from "../types/user";
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";

export const UserList: React.FC = () => {
  const userHookData = useUsers();
  const { data, isLoading, error, page, pageSize, setPage, handleCreate, handleEdit, handleDelete } = userHookData;
  const refetch = (userHookData as any).refetch; // Dùng as any để lấy refetch nếu hook có cung cấp (từ react-query)

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
        header: "User",
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
        header: "Phone",
        render: (user) => <span className="text-sm text-slate-600">{user.phoneNumber || "N/A"}</span>,
      },
      {
        header: "Roles",
        render: (user) => (
          <div className="flex flex-wrap gap-1">
            {user.roles?.length > 0 ? (
              user.roles.map((role, idx) => (
                <span key={idx} className="inline-block rounded bg-[#4880ff]/10 px-2 py-0.5 text-[11px] font-medium text-[#4880ff]">
                  {role}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">None</span>
            )}
          </div>
        ),
      },
      {
        header: "Status",
        render: (user) => {
          const isActive = user.status === "Active";
          return (
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                }`}
              >
                {user.status || "Unknown"}
              </span>
          );
        },
      },
      {
        header: "Action",
        render: (user) => (
          <div className="flex items-center gap-1.5">
            <ActionButton variant="secondary" onClick={() => openViewDialog(user)} className="h-8 w-8" title="View Details">
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
              title={user.status === "Active" ? "Block User" : "Activate User"}
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
    [handleEdit, handleDelete, updatingId]
  );

  return (
    <div className="rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[15px] font-bold leading-tight text-slate-900">User Management</h2>
        <ActionButton variant="primary" onClick={handleCreate} className="gap-2 px-4 py-2 text-sm">
          <Plus className="h-4 w-4" /> Add User
        </ActionButton>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 text-slate-500">Loading users...</div>
      ) : error ? (
        <div className="flex justify-center p-10 text-rose-500">{error}</div>
      ) : (
        <Table data={users} columns={columns} keyExtractor={(item) => item.id} emptyMessage="No users found." />
      )}

      <PaginationButton currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />

          <ConfirmDialog
            open={statusDialogOpen}
            onClose={() => setStatusDialogOpen(false)}
            onConfirm={handleConfirmStatusChange}
            title={selectedUserForStatus?.status === "Active" ? "Block User" : "Activate User"}
            message={
              selectedUserForStatus?.status === "Active"
                ? `Are you sure you want to block the account of ${selectedUserForStatus?.fullName}? They will not be able to log in.`
                : `Are you sure you want to activate the account of ${selectedUserForStatus?.fullName}? They will regain access to the system.`
            }
            confirmText={selectedUserForStatus?.status === "Active" ? "Yes, Block" : "Yes, Activate"}
            variant={selectedUserForStatus?.status === "Active" ? "warning" : "primary"}
          />

          {viewDialogOpen && selectedUserForView && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h3 className="text-lg font-bold text-slate-800">User Details</h3>
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
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">Phone:</span><span className="font-medium">{selectedUserForView.phoneNumber || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">Gender:</span><span className="font-medium">{selectedUserForView.gender || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">Date of Birth:</span><span className="font-medium">{selectedUserForView.dateOfBirth ? new Date(selectedUserForView.dateOfBirth).toLocaleDateString() : "N/A"}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">Provider:</span><span className="font-medium">{selectedUserForView.provider || "Local"}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">Roles:</span><span className="font-medium">{selectedUserForView.roles?.join(", ") || "None"}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">Status:</span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${selectedUserForView.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{selectedUserForView.status || "Unknown"}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">Last Online:</span><span className="font-medium">{selectedUserForView.lastOnline ? new Date(selectedUserForView.lastOnline).toLocaleString() : "N/A"}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">Created At:</span><span className="font-medium">{selectedUserForView.createdAt ? new Date(selectedUserForView.createdAt).toLocaleString() : "N/A"}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">Updated At:</span><span className="font-medium">{selectedUserForView.updatedAt ? new Date(selectedUserForView.updatedAt).toLocaleString() : "N/A"}</span></div>
                  </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end">
                  <ActionButton variant="secondary" onClick={() => setViewDialogOpen(false)} className="px-5 py-2 text-sm">
                    Close
                  </ActionButton>
                </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default UserList;