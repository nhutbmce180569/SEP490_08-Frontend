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
      if (isEmpty(raw)) return `${field.label} is required.`;
      return null;

    case "multi_select": {
      const arr = Array.isArray(raw) ? raw : [];
      if (field.required && arr.length < 1)
        return "Please select at least one travel interest.";
      return null;
    }

    case "date":
      if (isEmpty(raw)) return `${field.label} is required.`;
      if (typeof raw === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(raw))
        return "Invalid date format (YYYY-MM-DD).";
      return null;

    case "number":
    case "counter": {
      if (isEmpty(raw)) return field.required ? `${field.label} is required.` : null;
      const n = Number(raw);
      if (Number.isNaN(n) || n < 0) return "Must be a non-negative number.";
      if (field.fieldKey === "adultCount" && n < 1) return "Must have at least 1 adult.";
      return null;
    }

    case "boolean":
      if (field.required && typeof raw !== "boolean")
        return `${field.label} is required.`;
      return null;

    case "text":
      if (field.required && isEmpty(raw)) return `${field.label} is required.`;
      if (typeof raw === "string" && raw.length > 100)
        return "Maximum 100 characters.";
      return null;

    default:
      if (field.required && isEmpty(raw)) return `${field.label} is required.`;
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


export const buildRecommendPayload = (
  values: QuestionnaireFormValues,
  sessionId: string,
): TourPreferenceQuestionnaire => {
  const travelInterests = Array.isArray(values.travelInterests)
    ? (values.travelInterests as string[])
    : values.travelInterests
      ? [String(values.travelInterests)]
      : [];

  const adultCount = Number(values.adultCount || 1);
  const elderlyCount = Number(values.elderlyCount || 0);
  const childrenCount = Number(values.childrenCount || 0);
  const total = adultCount + elderlyCount + childrenCount;

  let inferredCompanionType: TourPreferenceQuestionnaire["companionType"] = "group";
  if (total === 1) inferredCompanionType = "solo";
  else if (childrenCount > 0) inferredCompanionType = "family";

  const payload: TourPreferenceQuestionnaire = {
    companionType: inferredCompanionType,
    preferredStartDate: String(values.preferredStartDate),
    adultCount,
    elderlyCount,
    childrenCount,
    travelPace: String(values.travelPace || "moderate"),
    travelInterests,
    nationalityType:
      values.nationalityType as TourPreferenceQuestionnaire["nationalityType"],
    sessionId,
  };

  if (values.preferredEndDate)
    payload.preferredEndDate = String(values.preferredEndDate);
  if (values.maxBudgetPerPerson != null && values.maxBudgetPerPerson !== "") {
    const cleanBudget = String(values.maxBudgetPerPerson).replace(/[.,]/g, "");
    payload.maxBudgetPerPerson = Number(cleanBudget);
  }
  if (values.preferredCity) payload.preferredCity = String(values.preferredCity).trim();
  if (values.preferredCountry)
    payload.preferredCountry = String(values.preferredCountry).trim();
  if (values.top != null && values.top !== "") payload.top = Number(values.top);

  return payload;
};

export const isAiModelsNotReadyMessage = (message: string) =>
  message.toLowerCase().includes("ai models are not ready");
