import CareerProfileForm from "@/components/CareerProfileForm";
import { db } from "@/lib/db";
import { careerProfiles } from "@/lib/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { BriefcaseBusiness, MapPin, SlidersHorizontal, Target } from "lucide-react";

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) return null;

  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, userId),
  });

  const workModes = Array.isArray(profile?.workModes) ? profile.workModes : [];
  const skills = Array.isArray(profile?.skills) ? profile.skills : [];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-fraunces text-navy">Career Profile</h1>
          <p className="text-gray-600 mt-2">
            Jadikan LacakKarirku paham target kerja Anda sebelum mencari dan menilai lowongan.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <Target size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Target Role</p>
            <p className="text-lg font-bold text-navy line-clamp-1">{profile?.targetRole || "Belum diisi"}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-success/10 p-3 text-success">
            <BriefcaseBusiness size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Level</p>
            <p className="text-lg font-bold text-navy">{profile?.targetLevel || "Belum diisi"}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-warning/10 p-3 text-warning">
            <MapPin size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Lokasi</p>
            <p className="text-lg font-bold text-navy line-clamp-1">{profile?.preferredLocation || "Belum diisi"}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <SlidersHorizontal size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Mode Kerja</p>
            <p className="text-lg font-bold text-navy">{workModes.length || 0}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CareerProfileForm
            initialData={profile ? {
              targetRole: profile.targetRole || "",
              targetLevel: profile.targetLevel || "",
              preferredLocation: profile.preferredLocation || "",
              workModes,
              salaryMin: profile.salaryMin?.toString() || "",
              salaryMax: profile.salaryMax?.toString() || "",
              currency: profile.currency || "IDR",
              skills,
              industries: Array.isArray(profile.industries) ? profile.industries : [],
              notes: profile.notes || "",
            } : null}
          />
        </div>

        <aside className="space-y-6">
          <section className="card">
            <h2 className="text-xl font-bold font-fraunces text-navy">Kenapa ini penting?</h2>
            <div className="mt-5 space-y-4 text-sm text-gray-600">
              <p>
                Career profile membuat sistem tahu lowongan seperti apa yang benar-benar layak ditampilkan untuk Anda.
              </p>
              <p>
                Nanti data ini akan dipakai untuk ranking job, rekomendasi keyword CV, dan prioritas apply harian.
              </p>
            </div>
          </section>

          <section className="card">
            <h2 className="text-xl font-bold font-fraunces text-navy">Skills target</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.length > 0 ? skills.map((skill) => (
                <span key={skill} className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-sm font-bold text-primary">
                  {skill}
                </span>
              )) : (
                <p className="text-sm text-gray-500">
                  Tambahkan skill utama agar rekomendasi job lebih tajam.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
