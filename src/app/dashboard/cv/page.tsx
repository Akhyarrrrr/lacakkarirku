import CVUploadForm from "@/components/CVUploadForm";
import { asEducationArray, asExperienceArray, asStringArray } from "@/lib/cv-types";
import { db } from "@/lib/db";
import { cvData } from "@/lib/schema";
import { auth } from "@/lib/auth-session";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Award, Briefcase, Calendar, GraduationCap } from "lucide-react";

export default async function CVPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const allCvs = await db.query.cvData.findMany({
    where: eq(cvData.userId, userId),
    orderBy: [desc(cvData.isDefault), desc(cvData.updatedAt)],
  });
  const currentCV = allCvs[0];

  async function makeDefault(formData: FormData) {
    "use server";
    const { userId: actionUserId } = await auth();
    const cvId = String(formData.get("cvId") || "");
    if (!actionUserId || !cvId) return;
    const owned = await db.query.cvData.findFirst({ where: eq(cvData.id, cvId) });
    if (!owned || owned.userId !== actionUserId) return;
    await db.transaction(async (tx) => {
      await tx.update(cvData).set({ isDefault: false }).where(eq(cvData.userId, actionUserId));
      await tx.update(cvData).set({ isDefault: true }).where(eq(cvData.id, cvId));
    });
    revalidatePath("/dashboard/cv");
  }

  const skills = asStringArray(currentCV?.skills);
  const experiences = asExperienceArray(currentCV?.experience);
  const education = asEducationArray(currentCV?.education);
  const parsedAtLabel = currentCV?.parsedAt
    ? new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(currentCV.parsedAt))
    : "Belum tersedia";

  return (
    <div className="space-y-8 md:space-y-10">
      <div>
        <h1 className="text-3xl font-bold font-fraunces text-navy">Manajemen CV</h1>
        <p className="text-gray-600 mt-2">Kelola dan analisis CV Anda untuk pencocokan lowongan yang akurat.</p>
      </div>

      {allCvs.length > 0 && (
        <section className="card">
          <h2 className="text-xl font-bold font-fraunces text-navy">Versi CV</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {allCvs.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-bold text-navy">{item.name}</p><p className="text-sm text-gray-600">{item.targetRole || "Tanpa target role"}</p></div>
                  {item.isDefault ? <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-bold text-success">Default</span> : (
                    <form action={makeDefault}><input type="hidden" name="cvId" value={item.id} /><button className="text-sm font-bold text-primary" type="submit">Jadikan default</button></form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!currentCV ? (
        <CVUploadForm />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-1 space-y-6">
            <CVUploadForm />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="card p-4 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
                <h3 className="text-xl font-bold font-fraunces text-navy">Analisis Terakhir</h3>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar size={14} />
                  Dianalisis pada {parsedAtLabel}
                </span>
              </div>

              <div className="space-y-6 md:space-y-8">
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-navy mb-3">
                    <Award size={18} className="text-primary" />
                    Skills Terdeteksi
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.length > 0 ? skills.map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-primary/5 text-primary text-sm font-semibold rounded-full border border-primary/10">
                        {skill}
                      </span>
                    )) : (
                      <p className="text-sm text-gray-500">Belum ada skill yang terdeteksi.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 font-bold text-navy mb-3">
                    <Briefcase size={18} className="text-primary" />
                    Pengalaman Kerja
                  </h4>
                  <div className="space-y-4">
                    {experiences.length > 0 ? experiences.map((exp, index) => (
                      <div key={`${exp.role}-${index}`} className="border-l-2 border-gray-100 pl-4 py-1">
                        <p className="font-bold text-navy">{exp.role || "Role tidak terbaca"}</p>
                        <p className="text-sm text-gray-500">{exp.company || "Company tidak terbaca"} - {exp.duration || "Durasi tidak terbaca"}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500">Belum ada pengalaman yang terdeteksi.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 font-bold text-navy mb-3">
                    <GraduationCap size={18} className="text-primary" />
                    Pendidikan
                  </h4>
                  <div className="space-y-4">
                    {education.length > 0 ? education.map((edu, index) => (
                      <div key={`${edu.degree}-${index}`} className="border-l-2 border-gray-100 pl-4 py-1">
                        <p className="font-bold text-navy">{edu.degree || "Pendidikan tidak terbaca"}</p>
                        <p className="text-sm text-gray-500">{edu.school || "Institusi tidak terbaca"}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500">Belum ada pendidikan yang terdeteksi.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
