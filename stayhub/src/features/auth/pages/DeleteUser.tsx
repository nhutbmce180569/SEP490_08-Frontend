import React from "react";
import { AlertTriangle, ArrowLeft, Trash2, User as UserIcon } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useDeleteUser } from "../hooks/useDeleteUser";

export const DeleteUserConfirm: React.FC = () => {
  const { user, isFetching, fetchError, isDeleting, handleConfirmDelete, handleCancel } = useDeleteUser();

  if (isFetching) return <div className="flex justify-center p-10 text-slate-500">Loading user details...</div>;
  if (fetchError) return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  if (!user) return <div className="flex justify-center p-10 text-slate-500">User not found.</div>;

  return (
    <div className="mx-auto max-w-2xl py-8">
      <button onClick={handleCancel} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </button>

      <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-rose-100 bg-rose-50/50 px-6 py-5">
          <div className="mt-0.5 rounded-full bg-rose-100 p-2 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-rose-700">Delete User Confirmation</h2>
            <p className="mt-1 text-sm text-rose-600/90">
              Are you absolutely sure you want to delete this user? This action will permanently remove the data and cannot be undone.
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 text-sm font-bold text-slate-800">User Details to be deleted:</div>
          <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row">
            <div className="flex h-24 w-24 overflow-hidden shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-400 shadow-sm">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-8 w-8" />
              )}
            </div>
            <div className="flex-1 space-y-2.5">
              <h3 className="line-clamp-2 text-base font-bold text-slate-900">{user.fullName}</h3>
              <div className="flex flex-col gap-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">Email: <span className="font-semibold">{user.email}</span></div>
                <div className="flex items-center gap-2">Roles: <span className="font-semibold">{user.roles?.join(", ") || "None"}</span></div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${user.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{user.status || "Unknown"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <ActionButton variant="secondary" onClick={handleCancel} className="px-5 py-2.5 text-sm">Cancel</ActionButton>
          <ActionButton variant="warning" onClick={handleConfirmDelete} className="gap-2 px-5 py-2.5 text-sm !bg-rose-600 !text-white !border-rose-600 hover:!bg-rose-700">
            <Trash2 className="h-4 w-4" /> Yes, Delete User
          </ActionButton>
        </div>
      </div>
      <LoadingOverlay isOpen={isDeleting} message="Deleting user..." />
    </div>
  );
};

export default DeleteUserConfirm;