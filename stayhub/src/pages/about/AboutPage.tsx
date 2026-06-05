import { Link } from "react-router-dom";
import {
  ArrowRight,
  Cpu,
  Globe,
  GraduationCap,
  Layers,
  Map,
  Sparkles,
  Users,
} from "lucide-react";
import { PATH } from "../../config/routes/route";
import { useTranslation } from "../../contexts/LocaleContext";
import { getAboutContent } from "./getAboutContent";
import { TeamMemberCard } from "./components/TeamMemberCard";

const FEATURE_ICONS = [Map, Sparkles, Users, Layers, Cpu, Globe] as const;

export default function AboutPage() {
  const { locale } = useTranslation();
  const content = getAboutContent(locale);

  return (
    <div className="about-page pb-12 md:pb-16">
      {/* Hero — compact */}
      <section className="relative overflow-hidden bg-[#05073C]">
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 50% at 15% 30%, rgba(0,104,224,0.5), transparent 60%)",
          }}
        />
        <div className="page-container relative z-10 py-10 md:py-14">
          <span className="travel-eyebrow mb-2 text-white/80">{content.hero.eyebrow}</span>
          <h1 className="travel-heading mb-2 text-2xl text-white md:text-3xl">
            {content.hero.title}
          </h1>
          <p className="mb-6 max-w-xl text-sm leading-relaxed text-white/70">
            {content.hero.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to={PATH.PUBLIC.TOURS}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white !no-underline transition-colors hover:bg-brand-hover"
            >
              {content.hero.exploreTours}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="flex flex-wrap gap-3">
              {content.hero.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-baseline gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5"
                >
                  <span className="text-lg font-bold text-white">{stat.value}</span>
                  <span className="text-xs text-white/60">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="page-container -mt-6 space-y-8 pt-2 md:space-y-10">
        {/* Intro + Features — one card */}
        <section className="glass-card overflow-hidden">
          <div className="border-b border-slate-100 p-5 md:p-6">
            <p className="text-sm leading-relaxed text-slate-600">{content.system.summary}</p>
          </div>

          <div className="p-5 md:p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-brand">
              {content.features.title}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {content.features.items.map((feature, index) => {
                const Icon = FEATURE_ICONS[index] ?? Sparkles;
                return (
                  <div
                    key={feature.title}
                    className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-colors hover:border-brand/20 hover:bg-brand-light/30"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-navy">{feature.title}</h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Mentor */}
        <section
          id="mentor"
          className="overflow-hidden rounded-2xl border-2 border-brand/20 bg-gradient-to-br from-brand-light/50 via-white to-brand-light/20 p-5 md:p-6"
        >
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/25">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="travel-eyebrow mb-0.5 text-brand">
                {content.people.mentorSection.eyebrow}
              </span>
              <h2 className="travel-heading text-lg text-navy md:text-xl">
                {content.people.mentorSection.title}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {content.people.mentorSection.subtitle}
              </p>
            </div>
          </div>

          <TeamMemberCard
            member={content.people.mentorSection.member}
            variant="mentor"
            mentorBadge={content.people.mentorSection.badge}
            cardLabels={content.card}
          />
        </section>

        {/* Development team */}
        <section
          id="team"
          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 md:p-6"
        >
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/15 bg-white text-brand shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="travel-eyebrow mb-0.5">{content.people.teamSection.eyebrow}</span>
              <h2 className="travel-heading text-lg text-navy md:text-xl">
                {content.people.teamSection.title}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {content.people.teamSection.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {content.people.teamSection.members.map((dev) => (
              <TeamMemberCard key={dev.id} member={dev} variant="member" cardLabels={content.card} />
            ))}
          </div>
        </section>

        {/* Tech — compact chips */}
        <section className="glass-card p-5 md:p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-brand">
            {content.tech.title}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.tech.groups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-xs font-bold text-navy">{group.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-md border border-brand/10 bg-brand-light/50 px-2 py-0.5 text-xs font-medium text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA — slim */}
        <section className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-brand-gradient px-5 py-6 sm:flex-row md:px-8">
          <p className="text-lg font-bold text-white">{content.cta.title}</p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to={PATH.PUBLIC.TOURS}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-brand !no-underline hover:bg-brand-light"
            >
              {content.cta.browseTours}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to={PATH.PUBLIC.AI_ASSISTANT}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 px-4 py-2 text-sm font-bold text-white !no-underline hover:bg-white/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {content.cta.aiAssistant}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
