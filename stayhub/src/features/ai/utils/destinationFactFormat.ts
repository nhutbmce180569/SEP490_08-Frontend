/** Match city names across accents/spacing (Can Tho ≈ Cần Thơ) */
export function normalizeCityKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function citiesMatch(a: string, b: string): boolean {
  return normalizeCityKey(a) === normalizeCityKey(b);
}

/** Split "Title: body" facts from RAG/ContentAPI into customer-friendly parts */
export function formatDestinationFact(fact: string): { headline?: string; body: string } {
  const trimmed = fact.trim();
  const colonIdx = trimmed.indexOf(":");

  if (colonIdx > 0 && colonIdx < 72) {
    const headline = trimmed.slice(0, colonIdx).trim();
    const body = trimmed.slice(colonIdx + 1).trim();
    if (body.length > 0) {
      return { headline, body };
    }
  }

  return { body: trimmed };
}

/** Hide duplicate city label when headline repeats the group city */
export function shouldShowFactHeadline(headline: string | undefined, city: string): boolean {
  if (!headline) return false;
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const h = normalize(headline);
  const c = normalize(city);
  return h !== c && !h.startsWith(`mẹo khi đến ${c}`) && !h.startsWith(`tips for ${c}`);
}
