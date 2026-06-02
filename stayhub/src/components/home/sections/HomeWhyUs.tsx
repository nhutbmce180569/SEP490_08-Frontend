import React from "react";
import { Shield, Globe, Users, Zap, Star, Quote } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { HomeSection } from "./HomeSection";
import { getFreeApiImage, HOME_GLASS } from "./shared";

const FEATURES = [
  {
    icon: Shield,
    title: "Best price guarantee",
    description: "Found a lower price? We'll match it — simple and fair.",
  },
  {
    icon: Globe,
    title: "Across Vietnam",
    description: "Coast, highlands, heritage towns — routes for every style.",
  },
  {
    icon: Users,
    title: "Local expert guides",
    description: "Certified guides who know the stories behind every stop.",
  },
  {
    icon: Zap,
    title: "Book in seconds",
    description: "Real-time availability and instant confirmation.",
  },
];

const STATS = [
  { value: "50K+", label: "Happy travelers" },
  { value: "120+", label: "Destinations" },
  { value: "4.9", label: "Average rating" },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    location: "New York, USA",
    avatar: "avatar-sarah",
    text: "StayHub made our Da Nang trip smooth from start to finish. Every detail was handled — our best vacation yet.",
    featured: false,
  },
  {
    name: "Kenji T.",
    location: "Osaka, Japan",
    avatar: "avatar-kenji",
    text: "The local guides were incredible. Hidden gems we never would have found alone. Already planning our next booking.",
    featured: true,
  },
  {
    name: "Amara L.",
    location: "London, UK",
    avatar: "avatar-amara",
    text: "From booking to the last day, everything felt effortless. Support was genuinely there when we needed them.",
    featured: false,
  },
];

/** Why StayHub + stats + traveler stories — one cohesive block */
export const HomeWhyUs: React.FC = () => (
  <HomeSection>
    <SectionHeader
      eyebrow="Why StayHub"
      title="Travel smarter, stress less"
      subtitle="Planning, booking, and support in one place — so you can focus on the trip."
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
        eyebrow="Traveler stories"
        title="Real trips, real smiles"
        subtitle="What guests say after exploring with StayHub."
        centered
        compact
      />

      <div className="grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <article
            key={t.name}
            className={`relative flex flex-col gap-4 rounded-[1.25rem] p-6 transition duration-300 hover:-translate-y-0.5 ${
              t.featured ? "home-glass--accent md:-my-1 md:py-8" : HOME_GLASS
            }`}
          >
            <Quote
              size={28}
              className={t.featured ? "text-white/30" : "text-brand/25"}
            />
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star
                  key={j}
                  size={14}
                  className={
                    t.featured
                      ? "fill-white text-white"
                      : "fill-amber-400 text-amber-400"
                  }
                />
              ))}
            </div>
            <p
              className={`flex-1 text-sm font-medium leading-relaxed ${
                t.featured ? "text-white/95" : "text-slate-600"
              }`}
            >
              &ldquo;{t.text}&rdquo;
            </p>
            <div
              className={`flex items-center gap-3 border-t pt-4 ${
                t.featured ? "border-white/20" : "border-slate-200/80"
              }`}
            >
              <img
                src={getFreeApiImage(t.avatar, 80, 80)}
                alt=""
                className={`h-11 w-11 rounded-full object-cover ring-2 ${
                  t.featured ? "ring-white/40" : "ring-white"
                }`}
              />
              <div>
                <p
                  className={`text-sm font-bold ${t.featured ? "text-white" : "text-navy"}`}
                >
                  {t.name}
                </p>
                <p
                  className={`text-xs font-medium ${
                    t.featured ? "text-white/75" : "text-slate-400"
                  }`}
                >
                  {t.location}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </HomeSection>
);
