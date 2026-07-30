import React, { useState, useEffect, type ReactNode } from "react";
import { StayHubLogo } from "../../../components/brand/StayHubLogo";
import { ThemeToggle } from "../../../components/ui/ThemeToggle";
import { LanguageSwitcher } from "../../../components/ui/LanguageSwitcher";
import { PATH } from "../../../config/routes/route";
import { MapPin, ChevronLeft, ChevronRight, Sparkles, ShieldCheck, Compass, Star } from "lucide-react";
import { useTranslation } from "../../../contexts/LocaleContext";

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

type ScenicScene = {
  id: number;
  name: string;
  location: string;
  videoUrl: string;
  poster: string;
};

const SCENIC_SCENES: ScenicScene[] = [
  {
    id: 1,
    name: "Biển Ngọc & Vịnh Đá Lân Quang",
    location: "Vịnh Hạ Long, Việt Nam",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-coast-of-a-beach-with-turquoise-water-and-rocks-41554-large.mp4",
    poster: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Dãy Núi Sương Mù Đại Ngàn",
    location: "Sapa & Tây Bắc, Việt Nam",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-mountain-ranges-and-blue-sky-41544-large.mp4",
    poster: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Cung Đường Biển Xanh Đèo Hải Vân",
    location: "Đà Nẵng - Huế, Việt Nam",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-curvy-road-on-a-tree-covered-hill-41537-large.mp4",
    poster: "https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=1920&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Làn Sóng Đại Dương Khơi Xa",
    location: "Đảo Phú Quốc, Việt Nam",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-clear-blue-sea-41549-large.mp4",
    poster: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop",
  },
];

export function AuthLayout({
  title,
  subtitle,
  heroTitle,
  heroSubtitle,
  scrollable = false,
  children,
  footer,
}: AuthLayoutProps) {
  const { t } = useTranslation();
  const [sceneIndex, setSceneIndex] = useState<number>(0);
  const currentScene = SCENIC_SCENES[sceneIndex];

  const handlePrevScene = () => {
    setSceneIndex((prev) => (prev === 0 ? SCENIC_SCENES.length - 1 : prev - 1));
  };

  const handleNextScene = () => {
    setSceneIndex((prev) => (prev === SCENIC_SCENES.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSceneIndex((prev) => (prev + 1) % SCENIC_SCENES.length);
    }, 10000);
    return () => clearTimeout(timer);
  }, [sceneIndex]);

  return (
    <div className="relative min-h-screen w-full font-sans text-slate-900 dark:text-slate-100 flex overflow-hidden">
      {/* 1. FULL-SCREEN VIDEO BACKGROUND LAYER */}
      <div className="fixed inset-0 z-0">
        <video
          key={currentScene.videoUrl}
          autoPlay
          muted
          playsInline
          onEnded={handleNextScene}
          poster={currentScene.poster}
          className="h-full w-full object-cover transition-all duration-1000 scale-[1.02] animate-in fade-in duration-700"
        >
          <source src={currentScene.videoUrl} type="video/mp4" />
        </video>

        {/* Multi-layered Atmospheric Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy/92 via-navy/70 to-navy/35 dark:from-slate-950/95 dark:via-slate-950/82 dark:to-slate-950/55 backdrop-blur-[1.5px]" />
        
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute top-1/4 left-1/4 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/20 blur-[130px] animate-pulse" />
        <div className="pointer-events-none absolute bottom-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[120px]" />
      </div>

      {/* 3. MAIN SPLIT CONTENT WRAPPER */}
      <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
        
        {/* LEFT PANEL: HERO TYPOGRAPHY & SCENIC CONTROLS (Hidden or Compact on small screens, Full on LG) */}
        <div className="hidden lg:flex w-full lg:w-1/2 flex-col justify-between p-8 xl:p-12 text-white">
          {/* Top Header Bar: Brand Logo */}
          <div className="flex items-center justify-between w-full">
            <StayHubLogo theme="light" linkTo={PATH.PUBLIC.HOME} />
          </div>

          {/* Center Hero Text & Features */}
          <div className="max-w-xl space-y-5 my-auto py-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-blue-200 backdrop-blur-md border border-white/20 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
              <span>{t("auth.luxuryTourExperience")}</span>
            </div>

            <h1 className="text-3xl xl:text-5xl font-black tracking-tight text-white leading-[1.12] drop-shadow-md">
              {heroTitle}
            </h1>

            <p className="text-sm xl:text-base font-medium text-slate-200 leading-relaxed drop-shadow">
              {heroSubtitle}
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 p-2.5 backdrop-blur-md border border-white/15">
                <Compass className="h-4 w-4 text-blue-400 shrink-0" />
                <span className="text-xs font-bold leading-tight">{t("auth.premiumJourney")}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 p-2.5 backdrop-blur-md border border-white/15">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold leading-tight">{t("auth.absoluteSecurity")}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 p-2.5 backdrop-blur-md border border-white/15">
                <Star className="h-4 w-4 text-amber-400 shrink-0 fill-amber-400" />
                <span className="text-xs font-bold leading-tight">{t("auth.satisfiedCustomers")}</span>
              </div>
            </div>
          </div>

          {/* Bottom Scenic Video Selector Bar */}
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-black/35 backdrop-blur-xl px-4 py-3 border border-white/15 max-w-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/30 text-white border border-brand/40">
                <MapPin className="h-4 w-4 text-blue-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{currentScene.name}</p>
                <p className="text-[11px] text-slate-300 truncate">{currentScene.location}</p>
              </div>
            </div>

            {/* Scene Cycling Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handlePrevScene}
                aria-label="Previous background scene"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white transition-all hover:bg-white/30 hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex gap-1 px-1.5">
                {SCENIC_SCENES.map((scene, idx) => (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => setSceneIndex(idx)}
                    aria-label={`Switch to ${scene.name}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === sceneIndex ? "w-5 bg-blue-400 shadow-sm" : "w-1.5 bg-white/30 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNextScene}
                aria-label="Next background scene"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white transition-all hover:bg-white/30 hover:scale-105 active:scale-95"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: GLASSMORPHISM AUTHENTICATION FORM CARD */}
        <div
          className={`flex w-full lg:w-1/2 items-center justify-center p-3 sm:p-6 lg:p-10 ${
            scrollable ? "overflow-y-auto max-h-screen py-8" : ""
          }`}
        >
          <div className="w-full max-w-[520px] my-auto">
            {/* Mobile Header Bar (Visible only on screens below LG) */}
            <div className="mb-4 flex justify-between items-center lg:hidden">
              <StayHubLogo theme="light" linkTo={PATH.PUBLIC.HOME} />
              <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/20">
                <MapPin className="h-3 w-3 text-blue-400" />
                <span className="truncate max-w-[150px]">{currentScene.location}</span>
              </div>
            </div>

            {/* Deluxe Glass Card Wrapper */}
            <div className="rounded-3xl border border-white/50 dark:border-slate-700/60 bg-white/92 dark:bg-slate-900/94 backdrop-blur-2xl p-6 sm:p-8 md:p-9 shadow-[0_24px_70px_rgba(5,7,60,0.38)] transition-all duration-300">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-black text-navy dark:text-white tracking-tight leading-snug mb-1.5">
                    {title}
                  </h2>
                  {subtitle ? <p className="text-sm text-text-muted leading-relaxed">{subtitle}</p> : null}
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 px-2.5 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-sm shrink-0 mt-0.5">
                  <LanguageSwitcher variant="icon" className="!h-8 !w-8 !min-w-[32px] !min-h-[32px] !rounded-full !text-slate-700 dark:!text-slate-200 hover:!bg-white dark:hover:!bg-slate-700 hover:shadow-sm !flex !items-center !justify-center !p-0" />
                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
                  <ThemeToggle className="!h-8 !w-8 !min-w-[32px] !min-h-[32px] !rounded-full !text-slate-700 dark:!text-slate-200 hover:!bg-white dark:hover:!bg-slate-700 hover:shadow-sm !flex !items-center !justify-center !p-0" />
                </div>
              </div>

              {/* Form Content & Social Auth */}
              <div className="space-y-4">
                {children}
              </div>

              {/* Footer Links */}
              {footer && (
                <div className="mt-4 border-t border-slate-200/60 dark:border-slate-800 pt-3">
                  {footer}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
