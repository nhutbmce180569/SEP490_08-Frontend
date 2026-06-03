import React, { useState } from "react";
import { useTranslation } from "../../contexts/LocaleContext";

type UserAvatarProps = {
  name?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-14 w-14 text-lg",
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = "md",
  className = "",
}) => {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const initial = (name || "U").trim().charAt(0).toUpperCase();
  const showImage = Boolean(avatarUrl) && !imgError;

  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-brand-hover font-bold text-white ring-2 ring-white/90 shadow-sm ${sizeMap[size]} ${className}`}
    >
      {showImage ? (
        <img
          src={avatarUrl!}
          alt={name ? `${name} ${t("common.userAvatar")}` : t("common.userAvatar")}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span aria-hidden>{initial}</span>
      )}
    </div>
  );
};
