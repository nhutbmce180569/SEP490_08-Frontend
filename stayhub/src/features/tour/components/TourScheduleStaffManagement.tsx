import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tourScheduleStaffService } from "../services/tourScheduleStaffService.service";
import {
  UserPlus,
  Trash2,
  Loader2,
  X,
  Users,
  AlertCircle,
  Search,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useSearchUsers } from "../../users/hooks/useUsers";
import { useTranslation } from "../../../contexts/LocaleContext";
import { ActionButton } from "../../../components/dashboard/ActionButton";

// ============ TYPES ============
interface StaffMember {
  id?: number;
  staffId: number;
  name?: string;
  fullName?: string;
  assignedRole: string;
}

interface TourScheduleStaffManagementProps {
  scheduleId: number;
  isReadOnly?: boolean; // <-- Thêm thuộc tính này để quản lý trạng thái Read-Only
  noWrapper?: boolean; // <--- Thêm prop này để bỏ khung ngoài
  onAssignSuccess?: () => void;
  onRemoveSuccess?: () => void;
}

// ============ MAIN COMPONENT ============
export const TourScheduleStaffManagement: React.FC<
  TourScheduleStaffManagementProps
> = ({
  scheduleId,
  isReadOnly = false, // <-- Gán giá trị mặc định là false nếu không truyền
  noWrapper = false,
  onAssignSuccess,
  onRemoveSuccess,
}) => {
  const { t } = useTranslation();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [staffToRemove, setStaffToRemove] = useState<StaffMember | null>(null);

  // ============ SEARCH STATE ============
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  // Debounce input (Đợi 500ms sau khi ngừng gõ mới set query để gọi API)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Hook gọi API search
  const { data: searchResult, isLoading: isSearching } =
    useSearchUsers(debouncedQuery);

  const filteredStaffs = React.useMemo(() => {
    if (!searchResult?.data || !Array.isArray(searchResult.data)) return [];

    return searchResult.data.filter((user: any) => {
      const roleNames = Array.isArray(user.roleNames) ? user.roleNames : [];
      const roles = Array.isArray(user.roles) ? user.roles : [];
      const combinedRoles = [...roleNames, ...roles].map((r: string) =>
        r.toUpperCase(),
      );

      if (combinedRoles.length > 0) {
        return combinedRoles.includes("STAFF");
      }

      const roleIds = Array.isArray(user.roleIds)
        ? user.roleIds.map(String)
        : [];
      if (roleIds.length > 0) {
        return roleIds.includes("3");
      }

      return false;
    });
  }, [searchResult]);

  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  // ============ QUERY ============
  const { data: staffList = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ["tourScheduleStaffs", scheduleId],
    queryFn: () => tourScheduleStaffService.getStaffBySchedule(scheduleId),
    enabled: !!scheduleId,
  });

  // ============ MUTATIONS ============
  const { mutate: mutateAssign, isPending: isAssigning } = useMutation({
    mutationFn: () =>
      tourScheduleStaffService.assignStaff({
        scheduleId,
        staffId: Number(
          selectedStaff?.id || selectedStaff?.Id || selectedStaff?.userId,
        ),
      }),
    onSuccess: () => {
      success(t("tour.staffAssignedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["tourSchedules"] });
      queryClient.invalidateQueries({
        queryKey: ["tourScheduleStaffs", scheduleId],
      });

      setShowAssignModal(false);
      setSearchInput("");
      setSelectedStaff(null);
      onAssignSuccess?.();
    },
    onError: (err: any) => {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        t("tour.failedAssignStaff");
      showError(errorMessage);
    },
  });

  const { mutate: mutateRemove, isPending: isRemoving } = useMutation({
    mutationFn: (staff: StaffMember) =>
      tourScheduleStaffService.removeStaff(scheduleId, staff.staffId),
    onSuccess: () => {
      success(t("tour.staffRemovedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["tourSchedules"] });
      queryClient.invalidateQueries({
        queryKey: ["tourScheduleStaffs", scheduleId],
      });

      setStaffToRemove(null);
      onRemoveSuccess?.();
    },
    onError: (err: any) => {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        t("tour.failedRemoveStaff");
      showError(errorMessage);
    },
  });

  // ============ HANDLERS ============
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) {
      showError(t("tour.selectedStaffMember"));
      return;
    }
    mutateAssign();
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSearchInput("");
    setSelectedStaff(null);
  };

  const getStaffName = (staff: StaffMember) => {
    return (
      staff.fullName ||
      staff.name ||
      t("tour.staffNameFallback", { id: staff.staffId })
    );
  };

  // ============ RENDER ============
  return (
    <div className={noWrapper ? "" : "w-full max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-slate-200 mt-6"}>
      {/* ========== HEADER ========== */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {t("tour.staffManagementTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("tour.staffManagementSubtitle")}
          </p>
        </div>

        {/* Chỉ hiển thị nút Assign Staff khi không ở chế độ Read-Only */}
        {!isReadOnly && (
          <ActionButton
            onClick={() => setShowAssignModal(true)}
            disabled={isAssigning}
            variant="primary"
            className="gap-2 px-4 py-2 text-sm"
          >
            <UserPlus className="h-4 w-4" />
            {t("tour.assignStaff")}
          </ActionButton>
        )}
      </div>

      {/* ========== STAFF LIST TABLE ========== */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        {isLoadingStaff ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-brand mb-4" />
            <p className="text-sm font-medium text-slate-600">
              {t("tour.loadingStaff")}
            </p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-slate-500">
            <div className="p-4 bg-slate-50 rounded-full mb-4">
              <Users className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-base font-medium text-slate-800 mb-1">
              {t("tour.noStaffAssignedTitle")}
            </p>
            <p className="text-sm text-slate-500 text-center mb-4">
              {t("tour.noStaffAssignedDesc")}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t("tour.staffNameCol")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t("tour.staffIdCol")}
                </th>
                {/* Ẩn tiêu đề cột Action nếu là Read-Only */}
                {!isReadOnly && (
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {t("tour.actionCol")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff: any, idx: any) => (
                <tr
                  key={`${staff.staffId}-${idx}`}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-b-0"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    {getStaffName(staff)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                      #{staff.staffId}
                    </span>
                  </td>
                  {/* Ẩn cột chứa nút xóa nhân sự nếu là Read-Only */}
                  {!isReadOnly && (
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setStaffToRemove(staff)}
                        disabled={
                          isRemoving && staffToRemove?.staffId === staff.staffId
                        }
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                        title={t("tour.removeStaffTitle")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ========== ASSIGN MODAL ========== */}
      {!isReadOnly && showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[500] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-visible">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-900">
                {t("tour.assignStaffModalTitle")}
              </h3>
              <button
                onClick={handleCloseAssignModal}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {t("tour.staffMemberLabel")}{" "}
                  <span className="text-rose-500">*</span>
                </label>

                {selectedStaff ? (
                  <div className="flex items-center justify-between p-3 bg-brand-light/50 border border-blue-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-brand-hover font-bold overflow-hidden shrink-0">
                        {selectedStaff.avatarUrl || selectedStaff.avatar ? (
                          <img
                            src={
                              selectedStaff.avatarUrl || selectedStaff.avatar
                            }
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (selectedStaff.fullName || selectedStaff.name || "S")
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {selectedStaff.fullName || selectedStaff.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {selectedStaff.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStaff(null)}
                      className="p-2 text-slate-400 hover:bg-white hover:text-rose-500 hover:shadow-sm rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder={t("tour.searchStaffPlaceholder")}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm placeholder-slate-400"
                        autoFocus
                      />
                    </div>

                    {searchInput.trim() && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto py-2">
                        {isSearching ? (
                          <div className="p-4 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />{" "}
                            {t("tour.searchingStaff")}
                          </div>
                        ) : filteredStaffs.length > 0 ? (
                          <ul>
                            {filteredStaffs.map((user: any) => (
                              <li key={user.id}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedStaff(user)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden shrink-0 text-xs">
                                    {user.avatarUrl || user.avatar ? (
                                      <img
                                        src={user.avatarUrl || user.avatar}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      (user.fullName || user.name || "S")
                                        .charAt(0)
                                        .toUpperCase()
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">
                                      {user.fullName || user.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500 truncate">
                                      {user.email}
                                    </p>
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-4 text-center text-sm text-slate-500">
                            {t("tour.noStaffFound")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseAssignModal}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || !selectedStaff}
                  className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand-hover disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {isAssigning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t("common.confirm")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== CONFIRM REMOVE MODAL ========== */}
      {!isReadOnly && staffToRemove && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[500] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {t("tour.confirmRemoveStaffTitle")}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {t("tour.confirmRemoveStaffDesc", {
                  name: getStaffName(staffToRemove),
                })}
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setStaffToRemove(null)}
                  disabled={isRemoving}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => mutateRemove(staffToRemove)}
                  disabled={isRemoving}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {isRemoving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t("tour.confirmRemove")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
