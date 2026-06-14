'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark, CheckCircle2, Loader2 } from "lucide-react";

type JobApplicationActionsProps = {
  jobId: string;
  applicationStatus?: string | null;
};

type ApplicationResponse = {
  success?: boolean;
  error?: string;
};

async function trackJob(jobId: string, status: "Saved" | "Applied") {
  const response = await fetch("/api/applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jobId, status }),
  });

  const data = await response.json() as ApplicationResponse;

  if (!response.ok) {
    throw new Error(data.error || "Gagal memperbarui tracker.");
  }

  return data;
}

export default function JobApplicationActions({
  jobId,
  applicationStatus,
}: JobApplicationActionsProps) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<"Saved" | "Applied" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (status: "Saved" | "Applied") => {
    setError(null);
    setLoadingStatus(status);

    try {
      await trackJob(jobId, status);
      router.refresh();
    } catch (trackError) {
      setError(trackError instanceof Error ? trackError.message : "Gagal memperbarui tracker.");
    } finally {
      setLoadingStatus(null);
    }
  };

  const isSaved = Boolean(applicationStatus);
  const isApplied = applicationStatus === "Applied"
    || applicationStatus === "Assessment"
    || applicationStatus === "Interview"
    || applicationStatus === "Offer";

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleTrack("Saved")}
          disabled={loadingStatus !== null}
          aria-label={isSaved ? `Job sudah masuk tracker dengan status ${applicationStatus}` : "Simpan job ke tracker"}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            isSaved
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-gray-200 bg-white text-navy hover:border-primary/50 hover:bg-primary/5"
          }`}
        >
          {loadingStatus === "Saved" ? <Loader2 size={16} className="animate-spin" /> : <Bookmark size={16} />}
          {isSaved ? applicationStatus : "Save"}
        </button>

        <button
          type="button"
          onClick={() => handleTrack("Applied")}
          disabled={loadingStatus !== null}
          aria-label={isApplied ? "Job sudah ditandai applied" : "Tandai job sebagai applied"}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2 ${
            isApplied
              ? "bg-success/10 text-success"
              : "bg-navy text-cream hover:bg-navy/90"
          }`}
        >
          {loadingStatus === "Applied" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {isApplied ? "Applied" : "Mark Applied"}
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}
