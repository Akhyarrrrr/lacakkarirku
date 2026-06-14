'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/application-status";

type ApplicationStatusSelectProps = {
  applicationId: string;
  currentStatus: ApplicationStatus;
};

type UpdateResponse = {
  success?: boolean;
  error?: string;
};

export default function ApplicationStatusSelect({
  applicationId,
  currentStatus,
}: ApplicationStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (nextStatus: ApplicationStatus) => {
    setStatus(nextStatus);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json() as UpdateResponse;

      if (!response.ok) {
        throw new Error(data.error || "Gagal memperbarui status.");
      }

      router.refresh();
    } catch (updateError) {
      setStatus(currentStatus);
      setError(updateError instanceof Error ? updateError.message : "Gagal memperbarui status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="sr-only" htmlFor={`status-${applicationId}`}>
        Update status lamaran
      </label>
      <div className="relative">
        <select
          id={`status-${applicationId}`}
          value={status}
          disabled={loading}
          onChange={(event) => handleChange(event.target.value as ApplicationStatus)}
          className="input w-full appearance-none pr-10 text-sm font-bold"
        >
          {APPLICATION_STATUSES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        {loading && (
          <Loader2
            aria-hidden="true"
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary"
          />
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}
