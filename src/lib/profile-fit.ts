type CareerProfileLike = {
  targetRole?: string | null;
  preferredLocation?: string | null;
  workModes?: unknown;
  skills?: unknown;
};

type JobLike = {
  title: string;
  description?: string | null;
  requirements?: string | null;
  location?: string | null;
  jobType?: string | null;
};

export type ProfileFit = {
  score: number;
  matchedSkills: string[];
  matchedSignals: string[];
};

function asStrings(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9.+#]+/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function includesAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value.toLowerCase()));
}

export function calculateProfileFit(profile: CareerProfileLike | null | undefined, job: JobLike): ProfileFit {
  if (!profile) {
    return { score: 0, matchedSkills: [], matchedSignals: [] };
  }

  const jobText = [
    job.title,
    job.description,
    job.requirements,
    job.location,
    job.jobType,
  ].filter(Boolean).join(" ").toLowerCase();
  const matchedSignals: string[] = [];

  const targetRoleTokens = tokenize(profile.targetRole || "");
  const roleScore = targetRoleTokens.length > 0 && includesAny(job.title.toLowerCase(), targetRoleTokens)
    ? 30
    : 0;

  if (roleScore > 0) matchedSignals.push("Role target cocok");

  const skills = asStrings(profile.skills);
  const matchedSkills = skills.filter((skill) => jobText.includes(skill.toLowerCase()));
  const skillScore = skills.length > 0 ? Math.min((matchedSkills.length / skills.length) * 35, 35) : 0;

  if (matchedSkills.length > 0) matchedSignals.push(`${matchedSkills.length} skill cocok`);

  const workModes = asStrings(profile.workModes);
  const modeScore = workModes.length > 0 && includesAny(`${job.jobType || ""} ${job.title}`, workModes)
    ? 20
    : 0;

  if (modeScore > 0) matchedSignals.push("Mode kerja cocok");

  const locationTokens = tokenize(profile.preferredLocation || "");
  const locationScore = locationTokens.length > 0 && includesAny(job.location || "", locationTokens)
    ? 15
    : 0;

  if (locationScore > 0) matchedSignals.push("Lokasi cocok");

  return {
    score: Math.min(Math.round(roleScore + skillScore + modeScore + locationScore), 100),
    matchedSkills,
    matchedSignals,
  };
}
