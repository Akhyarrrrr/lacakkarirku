export const APPLICATION_STATUSES = [
  "Saved",
  "Applied",
  "Assessment",
  "Interview",
  "Offer",
  "Rejected",
  "Archived",
] as const;

export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && APPLICATION_STATUSES.includes(value as ApplicationStatus);
}

export function getAppliedAtForStatus(status: ApplicationStatus, currentAppliedAt?: Date | null) {
  if (currentAppliedAt) return currentAppliedAt;

  return status === "Applied" || status === "Assessment" || status === "Interview" || status === "Offer"
    ? new Date()
    : null;
}
