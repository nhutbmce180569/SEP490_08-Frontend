import React from "react";
import { Calendar, MapPin, Pencil, Users, Wallet } from "lucide-react";
import type { TourPreferenceQuestionnaire } from "../types/tourAssistant";
import { MoneyDisplay } from "../../currency/MoneyDisplay";
import { localizeInterestKey } from "../utils/localizeAiContent";
import { useLocale, useTranslation } from "../../../contexts/LocaleContext";

interface Props {
  profile: TourPreferenceQuestionnaire;
  onEdit: () => void;
}

const companionKey: Record<string, string> = {
  solo: "ai.companionSolo",
  couple: "ai.companionCouple",
  family: "ai.companionFamily",
  group: "ai.companionGroup",
};

export const TripSummaryChips: React.FC<Props> = ({ profile, onEdit }) => {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const end =
    profile.preferredEndDate?.slice(0, 10) ?? profile.preferredStartDate?.slice(0, 10);
  const start = profile.preferredStartDate?.slice(0, 10);
  const interests = (profile.travelInterests ?? [])
    .slice(0, 3)
    .map((k) => localizeInterestKey(k, locale))
    .join(", ");
  const moreInterests =
    (profile.travelInterests?.length ?? 0) > 3
      ? ` +${(profile.travelInterests?.length ?? 0) - 3}`
      : "";

  const chips = [
    {
      icon: Calendar,
      label: `${formatDate(start)} → ${formatDate(end)}`,
    },
    {
      icon: Users,
      label: t(companionKey[profile.companionType] ?? "ai.companionSolo"),
    },
    profile.preferredCity
      ? { icon: MapPin, label: profile.preferredCity }
      : null,
    profile.maxBudgetPerPerson != null
      ? { icon: Wallet, label: <MoneyDisplay amountVnd={profile.maxBudgetPerPerson} compact />, key: "budget" }
      : null,
    interests ? { icon: null, label: `${interests}${moreInterests}`, key: "interests" } : null,
  ].filter(Boolean) as { icon: React.ElementType | null; label: React.ReactNode; key: string }[];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-wrap gap-2">
        {chips.map((chip, idx) => (
          <span
            key={chip.key || idx}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
          >
            {chip.icon && <chip.icon size={13} className="shrink-0 text-brand" />}
            <span className="truncate">{chip.label}</span>
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand/25 bg-brand-light px-3 py-1.5 text-xs font-bold text-brand transition-colors hover:bg-brand/10"
      >
        <Pencil size={13} />
        {t("ai.editTrip")}
      </button>
    </div>
  );
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}
