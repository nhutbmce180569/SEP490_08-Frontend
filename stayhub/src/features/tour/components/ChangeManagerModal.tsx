import React, { useState, useEffect } from "react";
import { X, Search, Filter } from "lucide-react";
import { useTranslation } from "../../../contexts/LocaleContext";
import { userService } from "../../auth/services/user.service";
import type { ReadUserDTO } from "../../auth/types/user";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { useToast } from "../../../contexts/ToastContext";
import { changeTourManager } from "../services/tour.service";
import type { Tour } from "../types/tour";
import { DynamicText } from "../../../components/DynamicText";

interface ChangeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour | null;
  onSuccess?: () => void;
}

const PAGE_SIZE = 5;

export const ChangeManagerModal: React.FC<ChangeManagerModalProps> = ({
  isOpen,
  onClose,
  tour,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { error: showError, success } = useToast();
  
  const [users, setUsers] = useState<ReadUserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [searchName, setSearchName] = useState("");
  const [roleFilter, setRoleFilter] = useState("Manager");

  useEffect(() => {
    if (!isOpen) return;
    
    let isMounted = true;
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await userService.filterUsers(
          page,
          PAGE_SIZE,
          searchName || undefined,
          roleFilter || undefined
        );
        if (isMounted) {
          setUsers(response.data || []);
          setTotalPages(response.totalPages || 1);
          setTotalItems(response.total || 0);
        }
      } catch (error) {
        if (isMounted) {
          showError("Failed to fetch users");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [isOpen, page, searchName, roleFilter, showError]);

  const handleSelectManager = async (managerId: number) => {
    if (!tour) return;
    setIsUpdating(true);
    try {
      await changeTourManager(tour.id, managerId);
      success("Successfully changed manager");
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      showError(err?.response?.data?.message || err.message || "Failed to change manager");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {t("tour.selectNewManager") || "Select New Manager"}
            </h2>
            {tour && (
              <p className="text-sm text-slate-500 mt-1">
                {t("tour.forTour") || "For tour:"} <span className="font-medium text-slate-700"><DynamicText text={tour.name} /></span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-brand focus-within:bg-white transition-colors">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={t("common.searchByName") || "Search by name..."}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                value={searchName}
                onChange={(e) => {
                  setSearchName(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-brand focus-within:bg-white transition-colors">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                className="bg-transparent text-sm outline-none text-slate-700"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t("common.allRoles") || "All Roles"}</option>
                <option value="Manager">{t("common.manager") || "Manager"}</option>
                <option value="Admin">{t("common.admin") || "Admin"}</option>
                <option value="Staff">{t("common.staff") || "Staff"}</option>
              </select>
            </div>
          </div>

          {/* User List */}
          <div className="border rounded-xl border-slate-100 overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center p-8 text-brand">{t("common.loading") || "Loading..."}</div>
            ) : users.length === 0 ? (
              <div className="flex justify-center p-8 text-slate-500">{t("common.noUsersFound") || "No users found"}</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("common.user") || "User"}</th>
                    <th className="px-4 py-3 font-medium">{t("common.phone") || "Phone"}</th>
                    <th className="px-4 py-3 font-medium">{t("common.roles") || "Roles"}</th>
                    <th className="px-4 py-3 font-medium text-right">{t("common.action") || "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-brand font-bold">
                              {user.fullName.charAt(0)}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">{user.fullName}</span>
                            <span className="text-xs text-slate-500">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100">
                        <span className="text-sm text-slate-600">{user.phoneNumber || "-"}</span>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100">
                        <div className="flex gap-1 flex-wrap">
                          {user.roles?.map(r => (
                            <span key={r} className="inline-block rounded bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                              {t(`common.${r.toLowerCase()}`) || r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-right">
                        {user.id === tour?.createdBy ? (
                          <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 border border-emerald-200">
                            {t("tour.currentManager") || "Current Manager"}
                          </span>
                        ) : (
                          <button
                            disabled={isUpdating || !user.roles?.includes("Manager")}
                            onClick={() => handleSelectManager(user.id)}
                            className={`rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors ${
                              isUpdating || !user.roles?.includes("Manager") ? "opacity-50 cursor-not-allowed" : "hover:bg-brand-hover"
                            }`}
                          >
                            {t("common.select") || "Select"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <PaginationButton
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
};
