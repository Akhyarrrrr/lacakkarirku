import { asStringArray } from "@/lib/cv-types";

export type MatchBreakdown = {
  matchedSkills: string[];
  missingSkills: string[];
  matchedKeywords: string[];
};

export function readMatchBreakdown(value: unknown): MatchBreakdown {
  const breakdown = Boolean(value) && typeof value === "object" ? value as Record<string, unknown> : {};

  return {
    matchedSkills: asStringArray(breakdown.matchedSkills),
    missingSkills: asStringArray(breakdown.missingSkills),
    matchedKeywords: asStringArray(breakdown.matchedKeywords),
  };
}
