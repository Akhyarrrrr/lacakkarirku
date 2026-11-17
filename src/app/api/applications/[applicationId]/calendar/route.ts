import { auth } from '@/lib/auth-session';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { applications, jobs } from '@/lib/schema';

function icsText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function icsDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export async function GET(_request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });
  const { applicationId } = await params;
  const [row] = await db.select({ application: applications, job: jobs })
    .from(applications).innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId))).limit(1);
  if (!row?.application.followUpAt) return new Response('Follow-up belum dijadwalkan', { status: 404 });
  const start = row.application.followUpAt;
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LacakKarirku//Follow-up//ID', 'BEGIN:VEVENT',
    `UID:${row.application.id}@lacakkarirku`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(start)}`, `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(`Follow-up lamaran ${row.job.title}`)}`, `DESCRIPTION:${icsText(`${row.job.company} — ${row.job.link}`)}`,
    'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="follow-up-${applicationId}.ics"` } });
}
