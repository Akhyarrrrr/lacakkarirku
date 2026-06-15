import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FileSearch,
  KanbanSquare,
  Lightbulb,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";

const workflow = [
  {
    title: "Upload CV",
    description: "AI membaca skill, pengalaman, pendidikan, dan keyword penting dari CV Anda.",
    icon: FileSearch,
  },
  {
    title: "Temukan job",
    description: "Kumpulkan lowongan dari berbagai sumber atau tambah job manual dari link apa pun.",
    icon: Search,
  },
  {
    title: "Pilih yang paling cocok",
    description: "Lihat CV Match, Profile Fit, skill cocok, dan gap yang perlu ditonjolkan.",
    icon: Target,
  },
  {
    title: "Track sampai selesai",
    description: "Simpan status Saved, Applied, Assessment, Interview, Offer, Rejected, dan follow-up.",
    icon: KanbanSquare,
  },
];

const benefits = [
  "Tidak kehilangan jejak lamaran yang sudah dikirim",
  "Tahu job mana yang paling worth applying",
  "Punya saran konkret sebelum menyesuaikan CV",
  "Follow-up lebih rapi dengan tanggal dan catatan",
  "Bisa jadi habit tracker untuk proses cari kerja",
  "Cocok untuk developer, fresh graduate, dan job seeker aktif",
];

const previewJobs = [
  { role: "Frontend Developer", company: "Remote Startup", match: "86%", status: "Saved" },
  { role: "Fullstack Engineer", company: "SaaS Company", match: "78%", status: "Applied" },
  { role: "React Developer", company: "Product Team", match: "72%", status: "Interview" },
];

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-navy text-cream">
      <header className="border-b border-cream/10">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-6">
          <Link href="/" className="text-xl font-black font-fraunces text-primary md:text-2xl">
            LacakKarirku
          </Link>
          <div className="flex items-center gap-3">
            {userId ? (
              <Link href="/dashboard" className="btn-primary">
                Ke Dashboard
              </Link>
            ) : (
              <>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
                  <button className="min-h-10 rounded-lg px-3 font-semibold text-cream transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-navy">
                    Masuk
                  </button>
                </SignInButton>
                <SignUpButton mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
                  <button className="btn-primary min-h-10 px-4 py-2">
                    Daftar
                  </button>
                </SignUpButton>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-82px)] max-w-7xl grid-cols-1 items-center gap-12 px-5 py-12 md:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
              <Sparkles size={16} />
              AI job tracker untuk cari kerja lebih terarah
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black font-fraunces leading-tight text-cream md:text-6xl">
              Cari kerja jangan cuma kirim lamaran. Track, analisis, dan apply dengan strategi.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300 md:text-xl">
              LacakKarirku membantu Anda menemukan lowongan, mengukur kecocokan CV, menyimpan progress lamaran, dan tahu langkah berikutnya tanpa spreadsheet berantakan.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {userId ? (
                <Link href="/dashboard" className="btn-primary inline-flex min-h-12 items-center justify-center gap-2 px-6">
                  Buka Dashboard
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <SignUpButton mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
                    <button className="btn-primary inline-flex min-h-12 items-center justify-center gap-2 px-6 text-base font-bold">
                      Mulai Gratis
                      <ArrowRight size={18} />
                    </button>
                  </SignUpButton>
                  <SignInButton mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
                    <button className="inline-flex min-h-12 items-center justify-center rounded-lg border border-primary/40 px-6 text-base font-bold text-primary transition-all hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-navy">
                      Masuk ke akun
                    </button>
                  </SignInButton>
                </>
              )}
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {["CV match score", "Application pipeline", "Follow-up reminder"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border border-cream/10 bg-cream/5 px-3 py-3 text-sm font-bold text-gray-200">
                  <CheckCircle2 size={16} className="text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-cream/10 bg-cream/5 p-4 shadow-2xl shadow-black/20 md:p-5">
            <div className="rounded-lg bg-cream p-4 text-navy md:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-primary">Action Center</p>
                  <h2 className="mt-1 text-xl font-bold font-fraunces">Hari ini harus ngapain?</h2>
                </div>
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <Bell size={22} />
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-bold text-navy">Cek follow-up lamaran</p>
                <p className="mt-1 text-sm text-gray-600">2 lamaran punya jadwal follow-up minggu ini.</p>
              </div>

              <div className="mt-5 space-y-3">
                {previewJobs.map((job) => (
                  <div key={`${job.role}-${job.company}`} className="rounded-lg border border-gray-100 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-bold text-navy">{job.role}</p>
                        <p className="mt-1 text-sm font-semibold text-primary">{job.company}</p>
                      </div>
                      <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-black text-success">
                        {job.match}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-bold text-gray-500">
                      <span>{job.status}</span>
                      <span>AI suggestion ready</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-cream px-5 py-20 text-navy md:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-black uppercase tracking-wider text-primary">Cara kerjanya</p>
              <h2 className="mt-3 text-3xl font-black font-fraunces md:text-5xl">
                Dari CV sampai follow-up, semua dalam satu alur.
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {workflow.map((item, index) => {
                const Icon = item.icon;

                return (
                  <article key={item.title} className="card">
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-primary/10 p-3 text-primary">
                        <Icon size={24} />
                      </div>
                      <span className="text-sm font-black text-gray-300">0{index + 1}</span>
                    </div>
                    <h3 className="mt-6 text-xl font-bold font-fraunces text-navy">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-gray-600">{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-20 text-navy md:px-6">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-primary">Kenapa berguna</p>
              <h2 className="mt-3 text-3xl font-black font-fraunces md:text-5xl">
                Dibuat untuk job seeker yang ingin lebih rapi, bukan cuma lebih sibuk.
              </h2>
              <p className="mt-5 text-base leading-7 text-gray-600">
                Aplikasi ini membantu Anda mengambil keputusan: job mana yang layak disimpan, CV bagian mana yang perlu ditonjolkan, dan lamaran mana yang harus di-follow-up.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex gap-3 rounded-lg border border-gray-100 bg-cream p-4">
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" />
                  <p className="text-sm font-semibold leading-6 text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-navy px-5 py-16 text-center text-cream md:px-6">
          <div className="mx-auto max-w-3xl">
            <Lightbulb size={34} className="mx-auto text-primary" />
            <h2 className="mt-5 text-3xl font-black font-fraunces md:text-5xl">
              Siap cari kerja dengan sistem yang lebih rapi?
            </h2>
            <p className="mt-4 text-gray-300">
              Mulai dari upload CV, simpan job pertama, lalu biarkan dashboard membantu menentukan langkah berikutnya.
            </p>
            <div className="mt-8 flex justify-center">
              {userId ? (
                <Link href="/dashboard" className="btn-primary inline-flex min-h-12 items-center gap-2 px-6">
                  Ke Dashboard
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <SignUpButton mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
                  <button className="btn-primary inline-flex min-h-12 items-center gap-2 px-6 text-base font-bold">
                    Buat Akun Gratis
                    <ArrowRight size={18} />
                  </button>
                </SignUpButton>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-cream/10 px-5 py-8 text-gray-400 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm md:flex-row">
          <div className="font-bold font-fraunces text-primary">LacakKarirku</div>
          <p>(c) 2026 LacakKarirku. Built as an AI job tracking portfolio project.</p>
        </div>
      </footer>
    </div>
  );
}
