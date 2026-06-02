import React from "react";

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "warning" | "accent";
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = "primary",
  className = "",
  children,
  style,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center transition-all duration-200 rounded-[var(--radius-button)] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-brand text-white shadow-md shadow-brand/20 hover:bg-brand-hover hover:shadow-lg",
    secondary:
      "border border-slate-200/80 bg-white/90 text-slate-600 backdrop-blur-sm hover:border-brand/20 hover:bg-brand-light/50 hover:text-brand",
    accent:
      "bg-brand text-white shadow-md shadow-brand/20 hover:bg-brand-hover",
    warning:
      "border border-rose-100 bg-rose-50/90 text-rose-500 backdrop-blur-sm hover:border-rose-200 hover:bg-rose-100 hover:text-rose-600",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};
