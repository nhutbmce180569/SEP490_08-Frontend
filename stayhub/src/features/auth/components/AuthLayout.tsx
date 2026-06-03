import type { ReactNode } from "react";
import { StayHubLogo } from "../../../components/brand/StayHubLogo";
import { ThemeToggle } from "../../../components/ui/ThemeToggle";
import { LanguageSwitcher } from "../../../components/ui/LanguageSwitcher";
import { PATH } from "../../../config/routes/route";

export type AuthLayoutProps = {
  title: string;
  subtitle: string;
  heroTitle: string;
  heroSubtitle: string;
  imageSeed?: string;
  /** Bật khi form dài (register) — cột phải scroll được */
  scrollable?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({
  title,
  subtitle,
  heroTitle,
  heroSubtitle,
  imageSeed = "stayhub-auth",
  scrollable = false,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full font-sans text-slate-900">
      <div className="relative hidden w-1/2 overflow-hidden bg-slate-900 lg:flex">
        <img
          src={`https://picsum.photos/seed/${imageSeed}/1000/1500`}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

        <div className="relative z-10 flex h-full w-full flex-col justify-between p-12 lg:p-16">
          <StayHubLogo theme="light" linkTo={PATH.PUBLIC.HOME} />

          <div className="max-w-md">
            <h1 className="mb-6 text-4xl font-bold leading-tight text-white lg:text-5xl">
              {heroTitle}
            </h1>
            <p className="text-lg text-slate-300">{heroSubtitle}</p>
          </div>
        </div>
      </div>

      <div
        className={`relative flex w-full bg-slate-50 dark:bg-slate-900 lg:w-1/2 lg:bg-white/60 lg:dark:bg-slate-900/80 lg:backdrop-blur-sm ${
          scrollable
            ? "min-h-screen flex-col overflow-y-auto px-4 py-6 sm:px-8 sm:py-10 lg:items-center lg:justify-center lg:p-16"
            : "items-center justify-center px-4 py-8 sm:px-8 lg:p-16"
        }`}
      >
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-6 sm:top-6">
          <LanguageSwitcher variant="icon" />
          <ThemeToggle />
        </div>

        <div
          className={`w-full max-w-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90 dark:shadow-black/20 ${
            scrollable
              ? "mx-auto rounded-lg px-5 py-6 sm:px-7 sm:py-8 lg:rounded-xl"
              : "rounded-lg px-5 py-6 sm:rounded-xl sm:px-7 sm:py-8"
          }`}
        >
          <div className="mb-6 lg:hidden">
            <StayHubLogo linkTo={PATH.PUBLIC.HOME} />
          </div>

          <div className="mb-6">
            <h2 className="travel-heading mb-1.5 text-2xl text-navy sm:text-3xl">{title}</h2>
            <p className="text-sm text-slate-500 sm:text-base">{subtitle}</p>
          </div>

          {children}
          {footer}
        </div>
      </div>
    </div>
  );
}
