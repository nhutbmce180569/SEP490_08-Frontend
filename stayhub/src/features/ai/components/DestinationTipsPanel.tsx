import React, { useMemo } from "react";
import { MapPin } from "lucide-react";
import type { CulturalFact } from "../types/tourAssistant";
import {
  citiesMatch,
  formatDestinationFact,
  shouldShowFactHeadline,
} from "../utils/destinationFactFormat";
import { useTranslation } from "../../../contexts/LocaleContext";
import { DynamicText } from "../../../components/DynamicText";

interface Props {
  facts: CulturalFact[];
  /** Only show tips for cities present in recommended tours */
  allowedCities?: string[];
}

type CityGroup = {
  city: string;
  facts: CulturalFact[];
};

function cityMatchesAllowed(factCity: string | undefined, allowed: string[]): boolean {
  if (allowed.length === 0) return true;
  if (!factCity?.trim()) return false;
  return allowed.some((c) => citiesMatch(factCity, c));
}

export const DestinationTipsPanel: React.FC<Props> = ({ facts, allowedCities = [] }) => {
  const { t } = useTranslation();

  const groups = useMemo(() => {
    const map = new Map<string, CityGroup>();
    const scopedFacts = facts.filter((fact) => cityMatchesAllowed(fact.city, allowedCities));

    scopedFacts.forEach((fact) => {
      const city = fact.city?.trim();
      if (!city) return;
      if (!map.has(city)) map.set(city, { city, facts: [] });
      map.get(city)!.facts.push(fact);
    });

    return [...map.values()].filter((g) => g.facts.length > 0);
  }, [facts, allowedCities]);

  if (groups.length === 0) return null;

  return (
    <section className="glass-card mb-8 p-5 md:p-6">
      <div className="mb-5 flex items-center gap-2">
        <MapPin size={18} className="text-brand" />
        <div>
          <h2 className="text-base font-black text-navy">{t("ai.destinationTipsTitle")}</h2>
          <p className="text-xs font-medium text-slate-500">
            {allowedCities.length > 0 ? t("ai.destinationTipsFiltered") : t("ai.destinationTipsDesc")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <div
            key={group.city}
            className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
          >
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-2.5 py-1 text-xs font-bold text-brand">
              <MapPin size={12} />
              <DynamicText text={group.city} />
            </p>

            <ul className="space-y-3">
              {group.facts.map((fact, i) => {
                const { headline, body } = formatDestinationFact(fact.fact);
                const showHeadline = shouldShowFactHeadline(headline, group.city);

                return (
                  <li key={`${group.city}-${i}`} className="rounded-xl bg-white p-3">
                    {showHeadline && (
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-brand">
                        <DynamicText text={headline} />
                      </p>
                    )}
                    <p className="text-sm leading-relaxed text-slate-700"><DynamicText text={body} /></p>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};
