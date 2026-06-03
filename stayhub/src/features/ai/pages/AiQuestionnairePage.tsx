import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { QuestionnaireWizard } from "../components/QuestionnaireWizard";
import { AiModelsNotReadyBanner } from "../components/AiModelsNotReadyBanner";
import { useQuestionnaire } from "../hooks/useQuestionnaire";
import { useRecommendFromProfile } from "../hooks/useRecommendFromProfile";
import type { TourPreferenceQuestionnaire } from "../types/tourAssistant";
import { PATH } from "../../../config/routes/route";
import { ActionButton } from "../../../components/home/ActionButton";
import { useAiPlanner } from "../../../contexts/AiPlannerContext";

/** Inner dialog — rendered via portal, fully outside the layout tree */
const AiQuestionnaireDialog: React.FC = () => {
  const { close } = useAiPlanner();
  const navigate = useNavigate();
  const { data: questionnaire, isLoading, error, refetch } = useQuestionnaire();
  const { submit, isLoading: isSubmitting, modelsNotReady, retryLast } =
    useRecommendFromProfile();

  const handleSubmit = async (payload: TourPreferenceQuestionnaire) => {
    try {
      const result = await submit(payload);
      close();
      navigate(PATH.PUBLIC.AI_RECOMMENDATIONS, { state: result });
    } catch {
      /* errors handled in hook */
    }
  };

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  /* Close on Escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const questions = questionnaire?.questions ?? [];

  return ReactDOM.createPortal(
    /* Backdrop — z-[200] to sit above everything (header z-50, chat widget z-50) */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--overlay-backdrop)] p-4 backdrop-blur-md md:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      role="dialog"
      aria-modal="true"
      aria-label="AI Travel Planner"
    >
      {/* Dialog */}
      <div
        className="ai-planner-dialog relative flex w-full max-w-xl flex-col overflow-hidden rounded-3xl"
        style={{ maxHeight: "min(90vh, 680px)" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Sparkles size={20} strokeWidth={2.25} />
            </span>
            <div>
              <p className="travel-eyebrow leading-none">AI Travel Planner</p>
              <h2 className="mt-0.5 text-base font-bold text-[var(--color-navy)]">
                Find your perfect tour
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="icon-btn !h-9 !w-9 rounded-xl"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
              <p className="text-sm font-semibold text-[var(--text-muted)]">Loading survey…</p>
            </div>
          ) : error ? (
            <div className="m-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center dark:bg-rose-950/30">
              <p className="mb-4 font-bold text-rose-500 dark:text-rose-400">Failed to load survey</p>
              <ActionButton variant="primary" onClick={() => refetch()}>
                Try again
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
            <div className="m-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-dashboard)] p-10 text-center">
              <Sparkles size={32} className="mx-auto mb-3 text-[var(--text-placeholder)]" />
              <p className="font-medium text-[var(--text-muted)]">No questions available from server.</p>
            </div>
          ) : (
            <QuestionnaireWizard
              questions={questions}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

/** Route-level shim: opening /ai-assistant just triggers the modal then redirects */
export const AiQuestionnairePage: React.FC = () => {
  const { open, isOpen } = useAiPlanner();
  const navigate = useNavigate();
  const openedRef = React.useRef(false);

  useEffect(() => {
    open();
    openedRef.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* After the modal was opened and then closed, go back to home */
  useEffect(() => {
    if (openedRef.current && !isOpen) {
      navigate(PATH.PUBLIC.HOME, { replace: true });
    }
  }, [isOpen, navigate]);

  return null;
};

/** Global portal modal — mount once in App.tsx */
export const AiPlannerModal: React.FC = () => {
  const { isOpen } = useAiPlanner();
  if (!isOpen) return null;
  return <AiQuestionnaireDialog />;
};

export default AiQuestionnairePage;
