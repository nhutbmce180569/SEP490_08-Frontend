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
    const init: QuestionnaireFormValues = {
      hasElderly: false,
      hasChildren: false,
      top: 8,
    };
    questions.forEach((q) => {
      if (q.inputType === "boolean") init[q.fieldKey] = false;
      if (q.inputType === "multi_select") init[q.fieldKey] = [];
    });
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = useMemo(() => {
    const chunks: QuestionnaireField[][] = [];
    for (let i = 0; i < questions.length; i += STEPS_PER_PAGE) {
      chunks.push(questions.slice(i, i + STEPS_PER_PAGE));
    }
    chunks.push([]); // extra step for counts + top
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
      const allFieldErrors = {
        ...validateQuestionnaireStep(questions, values),
        ...validateExtraCounts(values),
      };
      setErrors(allFieldErrors);
      if (Object.keys(allFieldErrors).length > 0) return;

      onSubmit(buildRecommendPayload(values, getOrCreateAiSessionId()));
      return;
    }
    setStep((s) => s + 1);
  };

  useEffect(() => {
    setErrors({});
  }, [step]);

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: "#fff",
        border: "1px solid rgba(5,7,60,0.08)",
        boxShadow: "0 4px 24px rgba(5,7,60,0.06)",
        fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* Progress */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: "#EB662B" }} />
            <span className="text-sm font-black text-slate-800">
              Bước {step + 1}/{totalSteps}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {Math.round(progress)}% hoàn thành
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "rgba(5,7,60,0.06)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "#EB662B" }}
          />
        </div>
      </div>

      {/* Fields */}
      <div className="px-6 py-6 space-y-6 min-h-[320px]">
        {isLastStep ? (
          <>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-2" style={{ color: "#EB662B" }}>
                Tùy chọn bổ sung
              </p>
              <p className="text-sm text-slate-500 font-medium">
                Cung cấp thêm chi tiết để AI gợi ý chính xác hơn cho cả nhóm du lịch.
              </p>
            </div>
            <ExtraCountFields values={values} errors={errors} onChange={handleChange} />
          </>
        ) : (
          currentFields.map((field) => (
            <div key={field.fieldKey}>
              <label className="block text-sm font-black text-slate-800 mb-1">
                {field.label}
                {field.required && <span className="text-rose-500 ml-1">*</span>}
              </label>
              {field.hint && (
                <p className="text-xs text-slate-400 font-medium mb-3 leading-relaxed">
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

      {/* Actions */}
      <div
        className="flex items-center justify-between gap-4 px-6 py-5"
        style={{ borderTop: "1px solid rgba(5,7,60,0.07)" }}
      >
        <ActionButton
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || isSubmitting}
          className="!px-5 flex items-center gap-1"
        >
          <ChevronLeft size={16} /> Quay lại
        </ActionButton>

        <ActionButton
          variant="primary"
          onClick={handleNext}
          disabled={isSubmitting}
          className="!px-8 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang phân tích...
            </>
          ) : isLastStep ? (
            <>
              Nhận gợi ý AI <Sparkles size={16} />
            </>
          ) : (
            <>
              Tiếp theo <ChevronRight size={16} />
            </>
          )}
        </ActionButton>
      </div>
    </div>
  );
};
