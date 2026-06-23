import React from "react";
import { Calendar, MapPin, Users, Wallet, Heart } from "lucide-react";
import type { TourPreferenceQuestionnaire } from "../types/tourAssistant";
import { formatVnd } from "../utils/formatters";
import { localizeInterestKey } from "../utils/localizeAiContent";
import { useLocale, useTranslation } from "../../../contexts/LocaleContext";

interface Props {
  profile: TourPreferenceQuestionnaire;
  compact?: boolean;
}

const companionKey: Record<string, string> = {
  solo: "ai.companionSolo",
  couple: "ai.companionCouple",
  family: "ai.companionFamily",
  group: "ai.companionGroup",
};

export const TripContextPanel: React.FC<Props> = ({ profile, compact }) => {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const endDate =
    profile.preferredEndDate?.slice(0, 10) ??
    profile.preferredStartDate?.slice(0, 10);

  const interests = (profile.travelInterests ?? [])
    .map((key) => localizeInterestKey(key, locale))
    .join(", ");

  if (compact) {
    return (
      <div className="space-y-2 text-xs">
        <InfoRow label={t("ai.travelDates")} value={`${formatDate(profile.preferredStartDate)} → ${formatDate(endDate)}`} />
        <InfoRow label={t("ai.travelParty")} value={t(companionKey[profile.companionType] ?? "ai.companionSolo")} />
        <InfoRow 
          label={t("ai.destination")} 
          value={profile.preferredCity || "Bất kỳ đâu (Surprise me!)"} 
        />
        {profile.maxBudgetPerPerson != null && (
          <InfoRow label={t("ai.budgetPerPerson")} value={formatVnd(profile.maxBudgetPerPerson, locale)} />
        )}
        {interests && <InfoRow label={t("ai.yourInterests")} value={interests} />}
      </div>
    );
  }

  return (
    <section className="glass-card mb-8 p-5 md:p-6">
      <p className="travel-eyebrow mb-1">{t("ai.yourTripPlan")}</p>
      <h2 className="mb-4 text-base font-black text-navy">{t("ai.yourTripPlanDesc")}</h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem
          icon={Calendar}
          label={t("ai.travelDates")}
          value={`${formatDate(profile.preferredStartDate)} → ${formatDate(endDate)}`}
        />
        <InfoItem
          icon={Users}
          label={t("ai.travelParty")}
          value={t(companionKey[profile.companionType] ?? "ai.companionSolo")}
        />
        <InfoItem 
          icon={MapPin} 
          label={t("ai.destination")} 
          value={profile.preferredCity || "Bất kỳ đâu (Surprise me!)"} 
        />
        {profile.maxBudgetPerPerson != null && (
          <InfoItem
            icon={Wallet}
            label={t("ai.budgetPerPerson")}
            value={formatVnd(profile.maxBudgetPerPerson, locale)}
          />
        )}
      </div>

      {interests && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-light/50 p-3">
          <Heart size={16} className="mt-0.5 shrink-0 text-brand" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {t("ai.yourInterests")}
            </p>
            <p className="text-sm font-medium text-slate-700">{interests}</p>
          </div>
        </div>
      )}
    </section>
  );
};

const InfoItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
}> = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
    <div className="mb-1 flex items-center gap-1.5 text-brand">
      <Icon size={14} />
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
    </div>
    <p className="text-sm font-bold text-slate-800">{value}</p>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="w-24 shrink-0 font-bold text-slate-500">{label}</span>
    <span className="font-medium text-slate-800">{value}</span>
  </div>
);

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
