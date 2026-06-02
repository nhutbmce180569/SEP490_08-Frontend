import React from "react";

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "icon" | "accent" | "ghost";
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = "primary",
  className = "",
  style,
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold text-[14.5px] cursor-pointer outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-brand text-white shadow-md shadow-brand/25 hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/30 px-[18px] h-11 rounded-[var(--radius-button)]",
    secondary:
      "bg-transparent text-navy hover:text-brand px-3 h-11 rounded-[var(--radius-button)]",
    accent:
      "bg-brand text-white shadow-md shadow-brand/25 hover:bg-brand-hover px-[18px] h-11 rounded-[var(--radius-button)]",
    outline:
      "border border-navy/12 bg-white/80 backdrop-blur-sm text-navy hover:bg-white hover:border-brand/25 hover:text-brand h-11 min-w-11 px-3 rounded-[var(--radius-button)]",
    icon: "bg-white/80 backdrop-blur-md p-2 text-slate-600 hover:bg-white hover:text-brand rounded-full border border-white/60 shadow-sm",
    ghost:
      "h-10 gap-1.5 border border-transparent bg-transparent px-3 text-navy hover:border-brand/15 hover:bg-brand-light/50 hover:text-brand rounded-[var(--radius-button)]",
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
