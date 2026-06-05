import { ChevronRight } from "lucide-react";
import { SYSTEM_FAQ_CATALOG } from "../config/systemFaqCatalog";
import { useTranslation } from "../../../contexts/LocaleContext";

interface SystemFaqBrowserProps {
  onSelectQuestion: (question: string) => void;
}

export const SystemFaqBrowser = ({ onSelectQuestion }: SystemFaqBrowserProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="px-1">
        <p className="text-sm font-bold text-[var(--color-navy)]">{t("ai.systemFaq.title")}</p>
        <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">
          {t("ai.systemFaq.subtitle")}
        </p>
      </div>

      {SYSTEM_FAQ_CATALOG.map((category) => (
        <section key={category.categoryKey}>
          <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-brand">
            {t(`ai.systemFaq.categories.${category.categoryKey}`)}
          </h3>
          <ul className="space-y-1.5">
            {category.questionKeys.map((questionKey) => {
              const question = t(`ai.systemFaq.questions.${questionKey}`);
              return (
                <li key={questionKey}>
                  <button
                    type="button"
                    onClick={() => onSelectQuestion(question)}
                    className="group flex w-full items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-left text-xs font-semibold text-[var(--color-navy)] shadow-sm transition-colors hover:border-brand/30 hover:bg-brand-light/40"
                  >
                    <span className="leading-snug">{question}</span>
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
};
