export type CVExperience = {
  role: string;
  company: string;
  duration: string;
};

export type CVEducation = {
  degree: string;
  school: string;
};

export type ParsedCVData = {
  skills: string[];
  experience: CVExperience[];
  education: CVEducation[];
  certifications: string[];
  keywords: string[];
};

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readObjectString(value: Record<string, unknown>, key: string) {
  const item = value[key];

  return typeof item === "string" ? item.trim() : "";
}

export function asExperienceArray(value: unknown): CVExperience[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      role: readObjectString(item, "role"),
      company: readObjectString(item, "company"),
      duration: readObjectString(item, "duration"),
    }))
    .filter((item) => item.role || item.company || item.duration);
}

export function asEducationArray(value: unknown): CVEducation[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      degree: readObjectString(item, "degree"),
      school: readObjectString(item, "school"),
    }))
    .filter((item) => item.degree || item.school);
}

export function normalizeParsedCV(value: unknown): ParsedCVData {
  const data = Boolean(value) && typeof value === "object" ? value as Record<string, unknown> : {};

  return {
    skills: asStringArray(data.skills),
    experience: asExperienceArray(data.experience),
    education: asEducationArray(data.education),
    certifications: asStringArray(data.certifications),
    keywords: asStringArray(data.keywords),
  };
}
