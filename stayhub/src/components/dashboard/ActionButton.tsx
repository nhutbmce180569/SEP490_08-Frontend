import React from "react";

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "warning";
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = "primary",
  className = "",
  children,
  style,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center shadow-sm transition-all !rounded-lg";
  
  const variants = {
    primary: "bg-[#4880ff] text-white font-semibold hover:bg-[#336efd] hover:shadow-md",
    secondary: "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700",
    warning: "border border-rose-100 bg-rose-50 text-rose-400 hover:border-rose-200 hover:bg-rose-100 hover:text-rose-600",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={{ borderRadius: "8px", ...style }}
      {...props}
    >
      {children}
    </button>
  );
};