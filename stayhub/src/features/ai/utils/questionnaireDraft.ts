import type { QuestionnaireFormValues } from "../types/tourAssistant";

const DRAFT_KEY = "stayhub_ai_questionnaire_draft";

export interface QuestionnaireDraft {
  values: QuestionnaireFormValues;
  step: number;
  savedAt: string;
}

export function loadQuestionnaireDraft(): QuestionnaireDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuestionnaireDraft;
    if (!parsed?.values || typeof parsed.step !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveQuestionnaireDraft(values: QuestionnaireFormValues, step: number) {
  try {
    const draft: QuestionnaireDraft = {
      values,
      step,
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* quota / private mode */
  }
}

export function clearQuestionnaireDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* noop */
  }
}

export function buildInitialQuestionnaireValues(
  questions: { fieldKey: string; inputType: string }[],
  draft?: QuestionnaireDraft | null,
): QuestionnaireFormValues {
  if (draft?.values) {
    return { ...draft.values };
  }

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
}
