import React, { useMemo } from "react";
import { Shield, Globe, Users, Zap, Star, Quote } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { HomeSection } from "./HomeSection";
import { getFreeApiImage, HOME_GLASS } from "./shared";
import { useTranslation } from "../../../contexts/LocaleContext";

export const HomeWhyUs: React.FC = () => {
  const { t } = useTranslation();

  const FEATURES = useMemo(
    () => [
      {
        icon: Shield,
        title: t("home.bestPriceGuarantee"),
        description: t("home.bestPriceGuaranteeDesc"),
      },
      {
        icon: Globe,
        title: t("home.acrossVietnam"),
        description: t("home.acrossVietnamDesc"),
      },
      {
        icon: Users,
        title: t("home.localExpertGuides"),
        description: t("home.localExpertGuidesDesc"),
      },
      {
        icon: Zap,
        title: t("home.bookInSeconds"),
        description: t("home.bookInSecondsDesc"),
      },
    ],
    [t],
  );

  const STATS = useMemo(
    () => [
      { value: "50K+", label: t("home.happyTravelersLabel") },
      { value: "120+", label: t("home.destinationsLabel") },
      { value: "4.9", label: t("home.averageRatingLabel") },
    ],
    [t],
  );

  const TESTIMONIALS = useMemo(
    () => [
      {
        name: "Sarah M.",
        location: "New York, USA",
        avatar: "avatar-sarah",
        text: t("home.testimonialSarah"),
        featured: false,
      },
      {
        name: "Kenji T.",
        location: "Osaka, Japan",
        avatar: "avatar-kenji",
        text: t("home.testimonialKenji"),
        featured: true,
      },
      {
        name: "Amara L.",
        location: "London, UK",
        avatar: "avatar-amara",
        text: t("home.testimonialAmara"),
        featured: false,
      },
    ],
    [t],
  );

  return (
    <HomeSection>
      <SectionHeader
        eyebrow={t("home.whyStayhubEyebrow")}
        title={t("home.travelSmarter")}
        subtitle={t("home.whySubtitleLong")}
        compact
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <article key={f.title} className={`${HOME_GLASS} flex flex-col p-5 md:p-6`}>
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light/90 text-brand">
                <Icon size={20} strokeWidth={2.25} />
              </span>
              <h3 className="travel-heading mb-2 text-base text-navy md:text-lg">
                {f.title}
              </h3>
              <p className="text-sm font-medium leading-relaxed text-slate-500">
                {f.description}
              </p>
            </article>
          );
        })}
      </div>

      <div
        className={`${HOME_GLASS} mt-5 grid grid-cols-3 divide-x divide-slate-200/70 overflow-hidden md:mt-6`}
      >
        {STATS.map((s) => (
          <div key={s.label} className="px-3 py-4 text-center md:py-5">
            <p className="text-xl font-extrabold text-brand md:text-2xl">{s.value}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 md:text-xs">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="home-section-bridge" aria-hidden />

      <div className="pt-2 md:pt-4">
        <SectionHeader
          eyebrow={t("home.travelerStoriesEyebrow")}
          title={t("home.realTrips")}
          subtitle={t("home.testimonialsSubtitle")}
          centered
          compact
        />

        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <article
              key={item.name}
              className={`relative flex flex-col gap-4 rounded-[1.25rem] p-6 transition duration-300 hover:-translate-y-0.5 ${
                item.featured ? "home-glass--accent md:-my-1 md:py-8" : HOME_GLASS
              }`}
            >
              <Quote
                size={28}
                className={item.featured ? "text-white/30" : "text-brand/25"}
              />
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    size={14}
                    className={
                      item.featured
                        ? "fill-white text-white"
                        : "fill-amber-400 text-amber-400"
                    }
                  />
                ))}
              </div>
              <p
                className={`flex-1 text-sm font-medium leading-relaxed ${
                  item.featured ? "text-white/95" : "text-slate-600"
                }`}
              >
                &ldquo;{item.text}&rdquo;
              </p>
              <div
                className={`flex items-center gap-3 border-t pt-4 ${
                  item.featured ? "border-white/20" : "border-slate-200/80"
                }`}
              >
                <img
                  src={getFreeApiImage(item.avatar, 80, 80)}
                  alt=""
                  className={`h-11 w-11 rounded-full object-cover ring-2 ${
                    item.featured ? "ring-white/40" : "ring-white"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-bold ${item.featured ? "text-white" : "text-navy"}`}
                  >
                    {item.name}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      item.featured ? "text-white/75" : "text-slate-400"
                    }`}
                  >
                    {item.location}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </HomeSection>
  );
};
