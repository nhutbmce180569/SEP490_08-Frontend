import { Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAiPlanner } from "../../../contexts/AiPlannerContext";
import { useTranslation } from "../../../contexts/LocaleContext";

export const AiGuideFloatingButton = () => {
  const { pathname } = useLocation();
  const { open: openAiPlanner } = useAiPlanner();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => openAiPlanner(pathname)}
      className="ai-fab fixed bottom-24 right-6 z-40 flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white transition-transform hover:scale-105"
      aria-label={t("header.aiGuideTitle")}
      title={t("header.aiGuideTitle")}
    >
      <Sparkles size={20} />
      <span className="hidden sm:inline">{t("header.aiGuide")}</span>
    </button>
  );
};
