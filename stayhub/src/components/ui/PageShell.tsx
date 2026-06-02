import React from "react";
import { PageHeader } from "./PageHeader";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
};

/** Khung trang thống nhất — bọc nội dung customer / feature pages */
export const PageShell: React.FC<PageShellProps> = ({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  className = "",
  noPadding = false,
}) => (
  <div className={`page-container section-shell ${noPadding ? "" : "pb-10"} ${className}`}>
    {(title || eyebrow) && (
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        actions={actions}
      />
    )}
    <div className="glass-card p-5 md:p-8">{children}</div>
  </div>
);
