'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/application-status";

type ApplicationDetailFormProps = {
  application: {
    id: string;
    status: ApplicationStatus;
    notes: string | null;
    contactName: string | null;
    contactEmail: string | null;
    appliedAt: Date | null;
    followUpAt: Date | null;
  };
};

type SaveResponse = {
  success?: boolean;
  error?: string;
};

function toDateInputValue(date?: Date | null) {
  if (!date) return "";

  return new Date(date).toISOString().slice(0, 10);
}

export default function ApplicationDetailForm({ application }: ApplicationDetailFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [appliedAt, setAppliedAt] = useState(toDateInputValue(application.appliedAt));
  const [followUpAt, setFollowUpAt] = useState(toDateInputValue(application.followUpAt));
  const [contactName, setContactName] = useState(application.contactName || "");
  const [contactEmail, setContactEmail] = useState(application.contactEmail || "");
  const [notes, setNotes] = useState(application.notes || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          appliedAt,
          followUpAt,
          contactName,
          contactEmail,
          notes,
        }),
      });
      const data = await response.json() as SaveResponse;

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan detail lamaran.");
      }

      setMessage("Detail lamaran tersimpan.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan detail lamaran.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-4 md:p-6">
      <div>
        <h2 className="text-xl font-bold font-fraunces text-navy">Detail Lamaran</h2>
        <p className="mt-1 text-sm text-gray-600">
          Catat progress, follow-up, dan kontak agar proses apply tidak tercecer.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-bold text-navy">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ApplicationStatus)}
            className="input min-h-11 w-full focus:ring-2 focus:ring-primary"
          >
            {APPLICATION_STATUSES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-navy">Tanggal apply</span>
          <input
            type="date"
            value={appliedAt}
            onChange={(event) => setAppliedAt(event.target.value)}
            className="input min-h-11 w-full focus:ring-2 focus:ring-primary"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-navy">Follow-up berikutnya</span>
          <input
            type="date"
            value={followUpAt}
            onChange={(event) => setFollowUpAt(event.target.value)}
            className="input min-h-11 w-full focus:ring-2 focus:ring-primary"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-navy">Nama kontak</span>
          <input
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            className="input min-h-11 w-full focus:ring-2 focus:ring-primary"
            placeholder="Nama recruiter / hiring manager"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-bold text-navy">Email / kontak</span>
          <input
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            className="input min-h-11 w-full focus:ring-2 focus:ring-primary"
            placeholder="recruiter@company.com"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-bold text-navy">Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="input min-h-40 w-full resize-y focus:ring-2 focus:ring-primary"
            placeholder="Contoh: Apply via LinkedIn, follow-up 5 hari lagi, highlight project portfolio React."
          />
        </label>
      </div>

      {(message || error) && (
        <div
          role="status"
          className={`rounded-lg border p-3 text-sm font-semibold ${
            error ? "border-error/20 bg-error/5 text-error" : "border-success/20 bg-success/5 text-success"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="flex justify-stretch md:justify-end">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex min-h-11 w-full items-center justify-center gap-2 md:w-auto md:min-w-40"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : message ? <CheckCircle2 size={18} /> : <Save size={18} />}
          {loading ? "Menyimpan" : "Simpan Detail"}
        </button>
      </div>
    </form>
  );
}
