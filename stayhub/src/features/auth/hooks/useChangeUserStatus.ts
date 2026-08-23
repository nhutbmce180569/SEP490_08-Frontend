import { useState } from "react";
import { userService } from "../services/user.service";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from "../../../contexts/LocaleContext";

export const useChangeUserStatus = (refetch?: () => void) => {
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { success, error: showError } = useToast();
  const { t } = useTranslation();

  const executeStatusChange = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Blocked" : "Active";
    setUpdatingId(userId);
    try {
      const res = await userService.changeUserStatus(userId, { status: newStatus });
      success(res?.message || `User status changed to ${newStatus}.`);
      
      if (refetch) refetch();
      else window.location.reload();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      let displayMsg = msg;
      if (msg === "Cannot block or change the status of an Admin account.") displayMsg = t("errors.cannotEditAdmin");

      showError(displayMsg || t("admin.changeStatusError") || "Failed to change user status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return { executeStatusChange, updatingId };
};
