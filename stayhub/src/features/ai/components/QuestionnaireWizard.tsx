import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import type { QuestionnaireField, QuestionnaireFormValues } from "../types/tourAssistant";
import {
  buildRecommendPayload,
  validateQuestionnaireStep,
} from "../utils/questionnaireValidation";
import { getOrCreateAiSessionId } from "../utils/sessionId";
import {
  buildInitialQuestionnaireValues,
  clearQuestionnaireDraft,
  loadQuestionnaireDraft,
  saveQuestionnaireDraft,
} from "../utils/questionnaireDraft";
import { QuestionnaireFieldInput } from "./QuestionnaireFieldInput";
import { useTranslation } from "../../../contexts/LocaleContext";

const STEPS_PER_PAGE = 3;

interface Props {
  questions: QuestionnaireField[];
  onSubmit: (payload: ReturnType<typeof buildRecommendPayload>) => void;
  isSubmitting?: boolean;
}

export const QuestionnaireWizard: React.FC<Props> = ({
  questions,
  onSubmit,
  isSubmitting,
}) => {
  const { t } = useTranslation();
  const draft = useMemo(() => loadQuestionnaireDraft(), []);
  const [step, setStep] = useState(() => draft?.step ?? 0);
  const [values, setValues] = useState<QuestionnaireFormValues>(() =>
    buildInitialQuestionnaireValues(questions, draft),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = useMemo(() => {
    const chunks: QuestionnaireField[][] = [];
    for (let i = 0; i < questions.length; i += STEPS_PER_PAGE)
      chunks.push(questions.slice(i, i + STEPS_PER_PAGE));
    chunks.push([]); // extra step for group size + top
    return chunks;
  }, [questions]);

  const totalSteps = steps.length;
  const currentFields = steps[step] ?? [];
  const isLastStep = step === totalSteps - 1;
  const progress = ((step + 1) / totalSteps) * 100;
  
  // Custom animation variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };
  const [direction, setDirection] = useState(1);

  const handleChange = (fieldKey: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldKey]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const validateCurrent = () => {
    const fieldErrors = isLastStep && currentFields.length === 0
      ? {}
      : validateQuestionnaireStep(currentFields, values);
      
    // Custom check for dates if both present
    const start = values.preferredStartDate as string;
    const end = values.preferredEndDate as string;
    if (start && end && end < start) {
      fieldErrors.preferredEndDate = "End date must be after start date.";
    }
    
    // Check Top constraint manually since ExtraCountFields is removed
    if (isLastStep) {
      const top = values.top;
      if (top != null && top !== "") {
        const n = Number(top);
        if (Number.isNaN(n) || n < 1 || n > 30) {
          fieldErrors.top = "Number of results must be between 1 and 30.";
        }
      }
    }

    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrent()) return;
    if (isLastStep) {
      const allErrors = {
        ...validateQuestionnaireStep(questions, values),
      };
      setErrors(allErrors);
      if (Object.keys(allErrors).length > 0) return;
      clearQuestionnaireDraft();
      onSubmit(buildRecommendPayload(values, getOrCreateAiSessionId()));
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  };
  
  const handleBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  useEffect(() => { setErrors({}); }, [step]);

  useEffect(() => {
    saveQuestionnaireDraft(values, step);
  }, [values, step]);

  return (
    <div>
      {/* Progress bar */}
      <div className="px-6 pt-5 pb-1">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-brand" />
            <span className="text-xs font-bold text-[var(--color-navy)]">
              {t("ai.stepOf", { current: step + 1, total: totalSteps })}
            </span>
          </div>
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {t("ai.percentComplete", { percent: Math.round(progress) })}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Fields */}
      <div className="relative min-h-[300px] overflow-hidden px-6 py-5">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            {isLastStep ? (
              <>
                <div className="mb-2">
                  <p className="travel-eyebrow mb-1 text-brand">Final Step</p>
                  <p className="text-[15px] font-medium text-[var(--text-muted)]">
                    Almost there! How many options should we curate for you?
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-[var(--color-navy)]">
                    Max tours to show{" "}
                    <span className="font-normal text-[var(--text-muted)]">(default 8)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    placeholder="8"
                    value={values.top != null && values.top !== "" ? String(values.top) : ""}
                    onChange={(e) => handleChange("top", e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-input)] px-4 py-3 text-sm font-medium text-[var(--color-navy)] outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10"
                  />
                  {errors.top && <p className="mt-1 text-xs font-bold text-rose-500">{errors.top}</p>}
                </div>
              </>
            ) : (
              currentFields.map((field) => (
                <div key={field.fieldKey}>
                  <label className="mb-1.5 block text-[15px] font-bold text-[var(--color-navy)]">
                    {field.label}
                    {field.required && <span className="ml-1 text-rose-500">*</span>}
                  </label>
                  {field.hint && (
                    <p className="mb-3 text-[13px] font-medium leading-relaxed text-[var(--text-muted)]">
                      {field.hint}
                    </p>
                  )}
                  <QuestionnaireFieldInput
                    field={{
                      ...field,
                      inputType: ["adultCount", "childrenCount", "elderlyCount"].includes(field.fieldKey) ? "counter" : field.inputType
                    }}
                    value={values[field.fieldKey] ?? (["adultCount", "childrenCount", "elderlyCount"].includes(field.fieldKey) ? 0 : "")}
                    error={errors[field.fieldKey] ?? (field.fieldKey === "preferredEndDate" ? errors.preferredEndDate : undefined)}
                    onChange={handleChange}
                  />
                </div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] px-6 py-4">
        <ActionButton
          variant="outline"
          onClick={handleBack}
          disabled={step === 0 || isSubmitting}
          className="!px-4 flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          {t("common.back")}
        </ActionButton>

        <ActionButton
          variant="primary"
          onClick={handleNext}
          disabled={isSubmitting}
          className="!px-7 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {t("ai.analysing")}
            </>
          ) : isLastStep ? (
            <>
              {t("ai.getRecommendations")}
              <Sparkles size={15} />
            </>
          ) : (
            <>
              {t("common.next")}
              <ChevronRight size={16} />
            </>
          )}
        </ActionButton>
      </div>
    </div>
  );
};
