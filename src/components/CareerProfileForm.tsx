'use client';

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";

type CareerProfileFormData = {
  targetRole: string;
  targetLevel: string;
  preferredLocation: string;
  workModes: string[];
  salaryMin: string;
  salaryMax: string;
  currency: string;
  skills: string;
  industries: string;
  notes: string;
};

type CareerProfileInitialData = Omit<Partial<CareerProfileFormData>, "skills" | "industries" | "workModes"> & {
  skills?: string[] | string;
  industries?: string[] | string;
  workModes?: string[];
};

type CareerProfileFormProps = {
  initialData?: CareerProfileInitialData | null;
};

type SaveResponse = {
  success?: boolean;
  error?: string;
};

const workModeOptions = ["Remote", "Hybrid", "On-site", "Freelance", "Contract", "Full-time"];
const levelOptions = ["Fresh Graduate", "Junior", "Mid-level", "Senior", "Lead"];

function joinArray(value: string[] | string | undefined) {
  if (Array.isArray(value)) return value.join(", ");

  return value || "";
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function CareerProfileForm({ initialData }: CareerProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CareerProfileFormData>({
    targetRole: initialData?.targetRole || "",
    targetLevel: initialData?.targetLevel || "Junior",
    preferredLocation: initialData?.preferredLocation || "Indonesia / Remote",
    workModes: initialData?.workModes || ["Remote", "Hybrid"],
    salaryMin: initialData?.salaryMin || "",
    salaryMax: initialData?.salaryMax || "",
    currency: initialData?.currency || "IDR",
    skills: joinArray(initialData?.skills),
    industries: joinArray(initialData?.industries),
    notes: initialData?.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completionScore = useMemo(() => {
    const fields = [
      form.targetRole,
      form.targetLevel,
      form.preferredLocation,
      form.workModes.length > 0 ? "work modes" : "",
      form.skills,
    ];

    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [form]);

  const updateField = (field: keyof CareerProfileFormData, value: string | string[]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleWorkMode = (mode: string) => {
    setForm((current) => ({
      ...current,
      workModes: current.workModes.includes(mode)
        ? current.workModes.filter((item) => item !== mode)
        : [...current.workModes, mode],
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/career-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetRole: form.targetRole,
          targetLevel: form.targetLevel,
          preferredLocation: form.preferredLocation,
          workModes: form.workModes,
          salaryMin: form.salaryMin,
          salaryMax: form.salaryMax,
          currency: form.currency,
          skills: splitCsv(form.skills),
          industries: splitCsv(form.industries),
          notes: form.notes,
        }),
      });
      const data = await response.json() as SaveResponse;

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan career profile.");
      }

      setMessage("Career profile tersimpan. Rekomendasi job akan makin personal.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan career profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold font-fraunces text-navy">Career Profile</h2>
          <p className="mt-2 text-sm text-gray-600">
            Isi target karier Anda agar job discovery, match score, dan saran AI punya konteks yang jelas.
          </p>
        </div>
        <div className="rounded-lg bg-primary/5 px-4 py-3 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Profile readiness</p>
          <p className="text-2xl font-black text-primary">{completionScore}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-bold text-navy">Target role</span>
          <input
            required
            value={form.targetRole}
            onChange={(event) => updateField("targetRole", event.target.value)}
            className="input w-full"
            placeholder="Frontend Developer, Fullstack Developer"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-navy">Level</span>
          <select
            value={form.targetLevel}
            onChange={(event) => updateField("targetLevel", event.target.value)}
            className="input w-full"
          >
            {levelOptions.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-bold text-navy">Lokasi / preferensi area</span>
          <input
            value={form.preferredLocation}
            onChange={(event) => updateField("preferredLocation", event.target.value)}
            className="input w-full"
            placeholder="Indonesia, Jakarta, Bandung, Remote global"
          />
        </label>

        <fieldset className="space-y-3 md:col-span-2">
          <legend className="text-sm font-bold text-navy">Mode kerja yang dicari</legend>
          <div className="flex flex-wrap gap-2">
            {workModeOptions.map((mode) => {
              const selected = form.workModes.includes(mode);

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => toggleWorkMode(mode)}
                  aria-pressed={selected}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    selected
                      ? "border-primary bg-primary text-cream"
                      : "border-gray-300 bg-white text-navy hover:border-primary/50"
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="space-y-2">
          <span className="text-sm font-bold text-navy">Salary minimum</span>
          <input
            inputMode="numeric"
            value={form.salaryMin}
            onChange={(event) => updateField("salaryMin", event.target.value)}
            className="input w-full"
            placeholder="5000000"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-navy">Salary maksimum</span>
          <input
            inputMode="numeric"
            value={form.salaryMax}
            onChange={(event) => updateField("salaryMax", event.target.value)}
            className="input w-full"
            placeholder="12000000"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-bold text-navy">Skills utama</span>
          <input
            value={form.skills}
            onChange={(event) => updateField("skills", event.target.value)}
            className="input w-full"
            placeholder="React, Next.js, TypeScript, Tailwind, Node.js"
          />
          <span className="block text-xs font-medium text-gray-500">Pisahkan dengan koma.</span>
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-bold text-navy">Industri yang diminati</span>
          <input
            value={form.industries}
            onChange={(event) => updateField("industries", event.target.value)}
            className="input w-full"
            placeholder="SaaS, fintech, edtech, agency, remote startup"
          />
          <span className="block text-xs font-medium text-gray-500">Opsional, pisahkan dengan koma.</span>
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-bold text-navy">Catatan target karier</span>
          <textarea
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            className="input min-h-28 w-full resize-y"
            placeholder="Contoh: ingin fokus frontend React, terbuka freelance remote, hindari sales-heavy role."
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

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex min-w-44 items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : message ? <CheckCircle2 size={18} /> : <Save size={18} />}
          {loading ? "Menyimpan" : "Simpan Profile"}
        </button>
      </div>
    </form>
  );
}
