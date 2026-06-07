'use client';

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlusCircle, Save } from "lucide-react";

type ManualJobFormState = {
  title: string;
  company: string;
  link: string;
  description: string;
  requirements: string;
  location: string;
  jobType: string;
};

type ManualJobResponse = {
  success?: boolean;
  error?: string;
  source?: string;
  matchScore?: number | null;
};

const initialState: ManualJobFormState = {
  title: "",
  company: "",
  link: "",
  description: "",
  requirements: "",
  location: "",
  jobType: "Remote",
};

export default function ManualJobForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof ManualJobFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/jobs/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json() as ManualJobResponse;

      if (!response.ok) {
        setError(data.error || "Gagal menyimpan lowongan.");
        return;
      }

      const matchText = typeof data.matchScore === "number" ? ` Match ${data.matchScore}%.` : "";
      setMessage(`Lowongan tersimpan dari ${data.source || "Manual"}.${matchText}`);
      setForm(initialState);
      router.refresh();
    } catch {
      setError("Koneksi gagal saat menyimpan lowongan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold font-fraunces text-navy">Tambah Lowongan Manual</h2>
          <p className="text-sm text-gray-600 mt-1">
            Simpan lowongan dari LinkedIn, JobStreet, Google, atau link apa pun.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <PlusCircle size={18} />
          {open ? "Tutup Form" : "Tambah Job"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-navy">Job</span>
            <input
              required
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="input w-full"
              placeholder="Frontend Developer"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-navy">Company</span>
            <input
              value={form.company}
              onChange={(event) => updateField("company", event.target.value)}
              className="input w-full"
              placeholder="Nama perusahaan"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-navy">Link</span>
            <input
              required
              type="url"
              value={form.link}
              onChange={(event) => updateField("link", event.target.value)}
              className="input w-full"
              placeholder="https://..."
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-navy">Lokasi</span>
            <input
              value={form.location}
              onChange={(event) => updateField("location", event.target.value)}
              className="input w-full"
              placeholder="Remote, Jakarta, Bandung"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-navy">Mode Kerja</span>
            <select
              value={form.jobType}
              onChange={(event) => updateField("jobType", event.target.value)}
              className="input w-full"
            >
              <option>Remote</option>
              <option>Hybrid</option>
              <option>On-site</option>
              <option>Freelance</option>
              <option>Contract</option>
              <option>Full-time</option>
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-navy">Deskripsi</span>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              className="input min-h-32 w-full resize-y"
              placeholder="Paste deskripsi lowongan di sini"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-navy">Requirements</span>
            <textarea
              value={form.requirements}
              onChange={(event) => updateField("requirements", event.target.value)}
              className="input min-h-24 w-full resize-y"
              placeholder="Skill, pengalaman, tools, atau requirement penting"
            />
          </label>

          {(message || error) && (
            <div className={`md:col-span-2 rounded-lg border p-3 text-sm font-semibold ${
              error ? "border-error/20 bg-error/5 text-error" : "border-success/20 bg-success/5 text-success"
            }`}>
              {error || message}
            </div>
          )}

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 min-w-36"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {loading ? "Menyimpan" : "Simpan Job"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
