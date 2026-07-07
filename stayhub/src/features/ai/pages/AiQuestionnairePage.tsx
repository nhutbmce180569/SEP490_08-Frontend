import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, X, MessageSquare, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IntelligentChatWizard } from "../components/IntelligentChatWizard";
import { QuestionnaireWizard } from "../components/QuestionnaireWizard";
import { AiModelsNotReadyBanner } from "../components/AiModelsNotReadyBanner";
import { useQuestionnaire } from "../hooks/useQuestionnaire";
import { useRecommendFromProfile } from "../hooks/useRecommendFromProfile";
import { ActionButton } from "../../../components/home/ActionButton";
import { PATH } from "../../../config/routes/route";
import { useAiPlanner } from "../../../contexts/AiPlannerContext";
import { useTranslation } from "../../../contexts/LocaleContext";

/** Inner drawer — rendered via portal with animation */
const AiQuestionnaireDialog: React.FC = () => {
  const { t } = useTranslation();
  const { close } = useAiPlanner();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"chat" | "form">("chat");

  const { data: questionnaire, isLoading, error, refetch } = useQuestionnaire();
  const { submit, isLoading: isSubmitting, modelsNotReady, retryLast } = useRecommendFromProfile();

  const handleSubmit = async (payload: any) => {
    try {
      const result = await submit(payload);
      close();
      navigate(PATH.PUBLIC.AI_RECOMMENDATIONS, { state: result });
    } catch {
      /* errors handled in hook */
    }
  };

  /* Close on Escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const questions = questionnaire?.questions ?? [];

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[200] bg-slate-900/10 backdrop-blur-[1px]"
        onClick={close}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 z-[210] h-screen w-full sm:w-[450px] md:w-[480px] bg-white shadow-2xl flex flex-col border-l border-slate-100"
        role="dialog"
        aria-modal="true"
        aria-label={t("ai.travelPlanner")}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4 bg-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand shadow-sm">
              <Sparkles size={20} strokeWidth={2.25} />
            </span>
            <div>
              <p className="travel-eyebrow leading-none">StayHub AI Assistant</p>
              <h2 className="mt-0.5 text-base font-bold text-[var(--color-navy)]">
                {t("ai.aiConsultTitle")}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="icon-btn !h-9 !w-9 rounded-xl hover:bg-slate-50 transition-colors"
            aria-label={t("ai.close")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex shrink-0">
          <div className="flex bg-slate-200/60 p-1 rounded-xl w-full">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === "chat"
                  ? "bg-white text-brand shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquare size={14} />
              {t("ai.aiChatTab")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("form")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === "form"
                  ? "bg-white text-brand shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ClipboardList size={14} />
              {t("ai.aiFormTab")}
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[var(--surface-dashboard)]">
          {activeTab === "chat" ? (
            <IntelligentChatWizard />
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4 py-20">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
                  <p className="text-sm font-semibold text-[var(--text-muted)]">{t("ai.loadingSurvey")}</p>
                </div>
              ) : error ? (
                <div className="m-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
                  <p className="mb-4 font-bold text-rose-500">{t("ai.failedLoadSurvey")}</p>
                  <ActionButton variant="primary" onClick={() => refetch()}>
                    {t("common.tryAgain")}
                  </ActionButton>
                </div>
              ) : modelsNotReady ? (
                <div className="p-6">
                  <AiModelsNotReadyBanner
                    onRetry={async () => {
                      try {
                        const result = await retryLast();
                        if (result) {
                          close();
                          navigate(PATH.PUBLIC.AI_RECOMMENDATIONS, { state: result });
                        }
                      } catch { /* stay on banner */ }
                    }}
                  />
                </div>
              ) : questions.length === 0 ? (
                <div className="m-6 rounded-2xl border border-[var(--border-default)] bg-white p-10 text-center shadow-sm">
                  <Sparkles size={32} className="mx-auto mb-3 text-[var(--text-placeholder)]" />
                  <p className="font-medium text-[var(--text-muted)]">{t("ai.noQuestions")}</p>
                </div>
              ) : (
                <QuestionnaireWizard
                  questions={questions}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>,
    document.body,
  );
};

/**
 * Legacy route shim: /ai-assistant opens the modal then returns to the page
 * the user came from (stored in location.state.from or openerPath).
 */
export const AiQuestionnairePage: React.FC = () => {
  const { open, openerPath } = useAiPlanner();
  const navigate = useNavigate();
  const location = useLocation();
  const openedRef = React.useRef(false);

  useEffect(() => {
    const from =
      (location.state as { from?: string } | null)?.from ??
      openerPath ??
      PATH.PUBLIC.HOME;

    open(from);
    openedRef.current = true;
    navigate(from, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

/** Global portal modal — mount once in App.tsx */
export const AiPlannerModal: React.FC = () => {
  const { isOpen } = useAiPlanner();
  return (
    <AnimatePresence>
      {isOpen && <AiQuestionnaireDialog />}
    </AnimatePresence>
  );
};

export default AiQuestionnairePage;
