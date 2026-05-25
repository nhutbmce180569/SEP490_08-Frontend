import React from "react";

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "icon";
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = "primary",
  className = "",
  style,
  children,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center transition-colors font-semibold text-[14.5px] cursor-pointer outline-none";
  
  const variants = {
    primary: "bg-[#EB662B] text-white hover:bg-[#d55821] px-[18px] h-[44px]",
    secondary: "bg-transparent text-[#05073C] hover:text-[#EB662B] px-3 h-[44px]",
    outline: "border border-[rgba(5,7,60,0.12)] bg-white text-[#05073C] hover:bg-slate-50 h-[44px] w-[44px]",
    icon: "bg-white/80 backdrop-blur-sm p-2 hover:bg-white text-slate-600",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={{ borderRadius: variant === "icon" ? 9999 : 12, ...style }}
      {...props}
    >
      {children}
    </button>
  );
};