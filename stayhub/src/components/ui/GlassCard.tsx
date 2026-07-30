import React from "react";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const GlassCard: React.FC<GlassCardProps> = ({
  hover = false,
  padding = "md",
  className = "",
  children,
  ...props
}) => (
  <div
    className={[
      hover ? "glass-card" : "glass-panel-solid rounded-[var(--radius-card)]",
      paddingMap[padding],
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    {...props}
  >
    {children}
  </div>
);
