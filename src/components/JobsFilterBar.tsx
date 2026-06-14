'use client';

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, RotateCcw, Search } from "lucide-react";

type JobsFilterBarProps = {
  sourceOptions: string[];
  jobTypeOptions: string[];
  current: {
    q: string;
    source: string;
    jobType: string;
    minScore: string;
    recommended: string;
  };
  totalJobs: number;
  filteredJobs: number;
  hasCareerProfile: boolean;
};

const scoreOptions = [
  { label: "Semua", value: "0" },
  { label: "50%+", value: "50" },
  { label: "70%+", value: "70" },
  { label: "80%+", value: "80" },
];

export default function JobsFilterBar({
  sourceOptions,
  jobTypeOptions,
  current,
  totalJobs,
  filteredJobs,
  hasCareerProfile,
}: JobsFilterBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(current.q);
  const [source, setSource] = useState(current.source);
  const [jobType, setJobType] = useState(current.jobType);
  const [minScore, setMinScore] = useState(current.minScore);
  const [recommended, setRecommended] = useState(current.recommended);

  const activeCount = useMemo(() => {
    return [
      query.trim(),
      source !== "all" ? source : "",
      jobType !== "all" ? jobType : "",
      minScore !== "0" ? minScore : "",
      recommended === "1" ? recommended : "",
    ].filter(Boolean).length;
  }, [jobType, minScore, query, recommended, source]);

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (query.trim()) params.set("q", query.trim());
    if (source !== "all") params.set("source", source);
    if (jobType !== "all") params.set("jobType", jobType);
    if (minScore !== "0") params.set("minScore", minScore);
    if (recommended === "1") params.set("recommended", recommended);

    router.push(`/dashboard/jobs${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const resetFilters = () => {
    setQuery("");
    setSource("all");
    setJobType("all");
    setMinScore("0");
    setRecommended("0");
    router.push("/dashboard/jobs");
  };

  return (
    <section className="card space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-bold text-navy">Filter Lowongan</h2>
          <p className="mt-1 text-sm text-gray-600">
            Menampilkan {filteredJobs} dari {totalJobs} lowongan{activeCount > 0 ? ` dengan ${activeCount} filter aktif` : ""}.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 font-bold text-navy hover:bg-gray-50 transition-all"
          >
            <RotateCcw size={18} />
            Reset
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Filter size={18} />
            Terapkan
          </button>
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") applyFilters();
          }}
          className="input w-full pl-10"
          placeholder="Cari React, Frontend, Node, company, lokasi..."
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-bold text-navy">Source</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["all", ...sourceOptions].map((option) => {
            const selected = source === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setSource(option)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-all ${
                  selected
                    ? "border-primary bg-primary text-cream"
                    : "border-gray-300 bg-white text-navy hover:border-primary/50"
                }`}
              >
                {option === "all" ? "Semua source" : option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-navy">Rekomendasi personal</p>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Filter job yang paling dekat dengan target role, skill, lokasi, dan mode kerja Anda.
            </p>
          </div>
          <button
            type="button"
            disabled={!hasCareerProfile}
            onClick={() => setRecommended((currentValue) => currentValue === "1" ? "0" : "1")}
            className={`min-w-40 rounded-lg border px-4 py-3 text-sm font-bold transition-all ${
              recommended === "1"
                ? "border-primary bg-primary text-cream"
                : "border-gray-300 bg-white text-navy hover:border-primary/50"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {recommended === "1" ? "Aktif" : "Sesuai Profile"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-bold text-navy">Mode kerja</p>
          <div className="flex flex-wrap gap-2">
            {["all", ...jobTypeOptions.slice(0, 8)].map((option) => {
              const selected = jobType === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setJobType(option)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition-all ${
                    selected
                      ? "border-navy bg-navy text-cream"
                      : "border-gray-300 bg-white text-navy hover:border-navy/40"
                  }`}
                >
                  {option === "all" ? "Semua mode" : option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold text-navy">Minimum match</p>
          <div className="grid grid-cols-4 overflow-hidden rounded-lg border border-gray-300 bg-white">
            {scoreOptions.map((option) => {
              const selected = minScore === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMinScore(option.value)}
                  className={`px-3 py-3 text-sm font-bold transition-all ${
                    selected ? "bg-success text-cream" : "text-navy hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
