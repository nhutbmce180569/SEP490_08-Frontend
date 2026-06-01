import type {
  QuestionnaireField,
  QuestionnaireFormValues,
  TourPreferenceQuestionnaire,
} from "../types/tourAssistant";

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

export const validateQuestionnaireField = (
  field: QuestionnaireField,
  values: QuestionnaireFormValues,
): string | null => {
  const raw = values[field.fieldKey];

  if (!field.required && isEmpty(raw)) return null;

  switch (field.inputType) {
    case "single_select":
      if (isEmpty(raw)) return `${field.label} là bắt buộc.`;
      return null;

    case "multi_select": {
      const arr = Array.isArray(raw) ? raw : [];
      if (field.required && arr.length < 1)
        return "Chọn ít nhất một sở thích du lịch.";
      return null;
    }

    case "date":
      if (isEmpty(raw)) return `${field.label} là bắt buộc.`;
      if (typeof raw === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(raw))
        return "Ngày không hợp lệ (YYYY-MM-DD).";
      return null;

    case "number": {
      if (isEmpty(raw)) return field.required ? `${field.label} là bắt buộc.` : null;
      const n = Number(raw);
      if (Number.isNaN(n) || n < 0) return "Số tiền phải là số không âm.";
      return null;
    }

    case "boolean":
      if (field.required && typeof raw !== "boolean")
        return `${field.label} là bắt buộc.`;
      return null;

    case "text":
      if (field.required && isEmpty(raw)) return `${field.label} là bắt buộc.`;
      if (typeof raw === "string" && raw.length > 100)
        return "Tối đa 100 ký tự.";
      return null;

    default:
      if (field.required && isEmpty(raw)) return `${field.label} là bắt buộc.`;
      return null;
  }
};

export const validateQuestionnaireStep = (
  fields: QuestionnaireField[],
  values: QuestionnaireFormValues,
): Record<string, string> => {
  const errors: Record<string, string> = {};
  fields.forEach((field) => {
    const msg = validateQuestionnaireField(field, values);
    if (msg) errors[field.fieldKey] = msg;
  });
  return errors;
};

export const validateFullQuestionnaire = (
  questions: QuestionnaireField[],
  values: QuestionnaireFormValues,
): Record<string, string> => validateQuestionnaireStep(questions, values);

/** Conditional: elderly/children counts when toggles are true */
export const validateExtraCounts = (
  values: QuestionnaireFormValues,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (values.hasElderly === true) {
    const count = values.elderlyCount;
    if (count == null || Number(count) < 1)
      errors.elderlyCount = "Nhập số người cao tuổi (≥ 1).";
    else if (Number(count) > 20) errors.elderlyCount = "Tối đa 20 người.";
  }

  if (values.hasChildren === true) {
    const count = values.childrenCount;
    if (count == null || Number(count) < 1)
      errors.childrenCount = "Nhập số trẻ em (≥ 1).";
    else if (Number(count) > 20) errors.childrenCount = "Tối đa 20 người.";
  }

  const start = values.preferredStartDate as string | undefined;
  const end = values.preferredEndDate as string | undefined;
  if (start && end && end < start) {
    errors.preferredEndDate = "Ngày kết thúc phải sau ngày bắt đầu.";
  }

  const top = values.top;
  if (top != null && top !== "") {
    const n = Number(top);
    if (Number.isNaN(n) || n < 1 || n > 30)
      errors.top = "Số tour gợi ý từ 1 đến 30.";
  }

  return errors;
};

export const buildRecommendPayload = (
  values: QuestionnaireFormValues,
  sessionId: string,
): TourPreferenceQuestionnaire => {
  const travelInterests = Array.isArray(values.travelInterests)
    ? (values.travelInterests as string[])
    : values.travelInterests
      ? [String(values.travelInterests)]
      : [];

  const payload: TourPreferenceQuestionnaire = {
    companionType: values.companionType as TourPreferenceQuestionnaire["companionType"],
    preferredStartDate: String(values.preferredStartDate),
    hasElderly: Boolean(values.hasElderly),
    hasChildren: Boolean(values.hasChildren),
    travelInterests,
    nationalityType:
      values.nationalityType as TourPreferenceQuestionnaire["nationalityType"],
    sessionId,
  };

  if (values.preferredEndDate)
    payload.preferredEndDate = String(values.preferredEndDate);
  if (values.maxBudgetPerPerson != null && values.maxBudgetPerPerson !== "")
    payload.maxBudgetPerPerson = Number(values.maxBudgetPerPerson);
  if (values.hasElderly && values.elderlyCount != null)
    payload.elderlyCount = Number(values.elderlyCount);
  if (values.hasChildren && values.childrenCount != null)
    payload.childrenCount = Number(values.childrenCount);
  if (values.preferredCity) payload.preferredCity = String(values.preferredCity).trim();
  if (values.preferredCountry)
    payload.preferredCountry = String(values.preferredCountry).trim();
  if (values.top != null && values.top !== "") payload.top = Number(values.top);

  return payload;
};

export const isAiModelsNotReadyMessage = (message: string) =>
  message.toLowerCase().includes("ai models are not ready");
