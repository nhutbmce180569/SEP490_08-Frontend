type JsonObject = Record<string, unknown>;

export function mergeLocales(...parts: JsonObject[]): JsonObject {
  const result: JsonObject = {};
  for (const part of parts) {
    for (const [key, value] of Object.entries(part)) {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        result[key] &&
        typeof result[key] === "object" &&
        !Array.isArray(result[key])
      ) {
        result[key] = mergeLocales(result[key] as JsonObject, value as JsonObject);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}
