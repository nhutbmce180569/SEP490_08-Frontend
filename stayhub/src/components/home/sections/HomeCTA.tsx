import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ActionButton } from "../ActionButton";
import { PATH } from "../../../config/routes/route";
import { getFreeApiImage } from "./shared";
import { HomeSection } from "./HomeSection";
import { useTranslation } from "../../../contexts/LocaleContext";

export const HomeCTA: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <HomeSection className="!pb-16 md:!pb-20">
      <div className="home-glass--accent relative overflow-hidden rounded-[1.75rem]">
        <img
          src={getFreeApiImage("vietnam-travel-cta", 1200, 400)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 flex flex-col items-start justify-between gap-8 px-6 py-10 md:flex-row md:items-center md:px-12 md:py-12">
          <div className="max-w-lg">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/95 backdrop-blur-sm">
              <Sparkles size={12} />
              {t("home.ctaStartToday")}
            </span>
            <h2 className="travel-heading mb-3 text-3xl text-white md:text-4xl">
              {t("home.ctaTitleLong")}
            </h2>
            <p className="text-sm font-medium leading-relaxed text-white/85 md:text-base">
              {t("home.ctaSubtitleLong")}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ActionButton
              variant="outline"
              onClick={() => navigate(PATH.PUBLIC.REGISTER)}
              className="!h-12 !w-full gap-2 !rounded-xl !border-0 !bg-white !px-6 !text-brand shadow-lg sm:!w-auto"
            >
              {t("home.getStartedFree")}
              <ArrowRight size={16} />
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
              className="!h-12 !w-full !rounded-xl !border-2 !border-white/35 !px-6 !text-white hover:!bg-white/10 sm:!w-auto"
            >
              {t("home.ctaBrowse")}
            </ActionButton>
          </div>
        </div>
      </div>
    </HomeSection>
  );
};
