export async function readJsonObject(request: Request) {
  const body: unknown = await request.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }

  return body as Record<string, unknown>;
}

export function readString(body: Record<string, unknown>, key: string) {
  const value = body[key];

  return typeof value === "string" ? value.trim() : "";
}

export function readStringArray(body: Record<string, unknown>, key: string) {
  const value = body[key];

  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function readInteger(body: Record<string, unknown>, key: string) {
  const value = body[key];
  const normalized = typeof value === "number" ? value : Number.parseInt(readString(body, key), 10);

  return Number.isFinite(normalized) ? normalized : null;
}

export function readOptionalDate(body: Record<string, unknown>, key: string) {
  const value = readString(body, key);
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${key} harus berupa tanggal yang valid.`);
  }

  return date;
}
