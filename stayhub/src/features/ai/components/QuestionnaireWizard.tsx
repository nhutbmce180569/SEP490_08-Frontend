import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import type { QuestionnaireField, QuestionnaireFormValues } from "../types/tourAssistant";
import {
  buildRecommendPayload,
  validateExtraCounts,
  validateQuestionnaireStep,
} from "../utils/questionnaireValidation";
import { getOrCreateAiSessionId } from "../utils/sessionId";
import { ExtraCountFields, QuestionnaireFieldInput } from "./QuestionnaireFieldInput";

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
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<QuestionnaireFormValues>(() => {
    const init: QuestionnaireFormValues = { hasElderly: false, hasChildren: false, top: 8 };
    questions.forEach((q) => {
      if (q.inputType === "boolean") init[q.fieldKey] = false;
      if (q.inputType === "multi_select") init[q.fieldKey] = [];
    });
    return init;
  });
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

  const handleChange = (fieldKey: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldKey]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const validateCurrent = () => {
    const fieldErrors = isLastStep
      ? validateExtraCounts(values)
      : validateQuestionnaireStep(currentFields, values);
    if (!isLastStep) {
      const dateErr = validateExtraCounts(values);
      if (dateErr.preferredEndDate) fieldErrors.preferredEndDate = dateErr.preferredEndDate;
    }
    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrent()) return;
    if (isLastStep) {
      const allErrors = {
        ...validateQuestionnaireStep(questions, values),
        ...validateExtraCounts(values),
      };
      setErrors(allErrors);
      if (Object.keys(allErrors).length > 0) return;
      onSubmit(buildRecommendPayload(values, getOrCreateAiSessionId()));
      return;
    }
    setStep((s) => s + 1);
  };

  useEffect(() => { setErrors({}); }, [step]);

  return (
    <div>
      {/* Progress bar */}
      <div className="px-6 pt-5 pb-1">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-brand" />
            <span className="text-xs font-bold text-[var(--color-navy)]">
              Step {step + 1} of {totalSteps}
            </span>
          </div>
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {Math.round(progress)}% complete
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
      <div className="min-h-[260px] space-y-5 px-6 py-5">
        {isLastStep ? (
          <>
            <div className="mb-1">
              <p className="travel-eyebrow mb-1">Extra details</p>
              <p className="text-sm font-medium text-[var(--text-muted)]">
                Help AI personalise results for every member of your group.
              </p>
            </div>
            <ExtraCountFields values={values} errors={errors} onChange={handleChange} />
          </>
        ) : (
          currentFields.map((field) => (
            <div key={field.fieldKey}>
              <label className="mb-1 block text-sm font-bold text-[var(--color-navy)]">
                {field.label}
                {field.required && <span className="ml-1 text-rose-500">*</span>}
              </label>
              {field.hint && (
                <p className="mb-2.5 text-xs font-medium leading-relaxed text-[var(--text-muted)]">
                  {field.hint}
                </p>
              )}
              <QuestionnaireFieldInput
                field={field}
                value={values[field.fieldKey]}
                error={errors[field.fieldKey] ?? errors.preferredEndDate}
                onChange={handleChange}
              />
            </div>
          ))
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] px-6 py-4">
        <ActionButton
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || isSubmitting}
          className="!px-4 flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          Back
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
              Analysing…
            </>
          ) : isLastStep ? (
            <>
              Get AI recommendations
              <Sparkles size={15} />
            </>
          ) : (
            <>
              Next
              <ChevronRight size={16} />
            </>
          )}
        </ActionButton>
      </div>
    </div>
  );
};
