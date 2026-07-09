import React, { useEffect, useState } from "react";
import { userService } from "../../auth/services/user.service";

interface ManagerCellProps {
  userId: number;
  fallbackName?: string | null;
}

export const ManagerCell: React.FC<ManagerCellProps> = ({ userId, fallbackName }) => {
  const [name, setName] = useState<string>(fallbackName || "Loading...");

  useEffect(() => {
    let mounted = true;
    userService
      .getUserById(userId)
      .then((user) => {
        if (mounted) setName(user.fullName);
      })
      .catch(() => {
        if (mounted) setName(fallbackName || "Unknown");
      });
    return () => {
      mounted = false;
    };
  }, [userId, fallbackName]);

  return (
    <div className="flex flex-col">
      <span className="text-sm text-slate-800 font-medium">{name}</span>
      <span className="text-xs text-slate-500">ID: {userId}</span>
    </div>
  );
};
