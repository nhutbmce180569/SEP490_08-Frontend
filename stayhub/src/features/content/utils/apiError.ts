const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getResponseData = (error: unknown): unknown => {
  if (!isRecord(error) || !isRecord(error.response)) return undefined;

  return error.response.data;
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  const data = getResponseData(error);

  if (typeof data === "string" && data) return data;

  if (isRecord(data)) {
    if (typeof data.message === "string" && data.message) return data.message;
    if (typeof data.title === "string" && data.title) return data.title;
  }

  if (isRecord(error) && typeof error.message === "string" && error.message) {
    return error.message;
  }

  return fallback;
};

export const getApiValidationErrors = (error: unknown) => {
  const data = getResponseData(error);

  if (isRecord(data) && isRecord(data.errors)) {
    return data.errors;
  }

  return null;
};

export const normalizeServerErrors = (errors: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [key.split(".").pop() ?? key, value]),
  );
