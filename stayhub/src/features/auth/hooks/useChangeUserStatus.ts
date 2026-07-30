import { useState } from "react";
import { userService } from "../services/user.service";
import { useToast } from "../../../contexts/ToastContext";

export const useChangeUserStatus = (refetch?: () => void) => {
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { success, error: showError } = useToast();

  const executeStatusChange = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Blocked" : "Active";
    setUpdatingId(userId);
    try {
      const res = await userService.changeUserStatus(userId, { status: newStatus });
      success(res?.message || `User status changed to ${newStatus}.`);
      
      if (refetch) refetch();
      else window.location.reload();
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed to change user status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return { executeStatusChange, updatingId };
};
