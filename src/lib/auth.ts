import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import { authAccounts, authSessions, authUsers, authVerifications } from '@/lib/schema'
import { sendEmail } from '@/lib/email'

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000'

export const betterAuthInstance = betterAuth({
  appName: 'LacakKarirku',
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [baseURL],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user: authUsers, session: authSessions, account: authAccounts, verification: authVerifications },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => sendEmail({
      to: user.email,
      subject: 'Reset password LacakKarirku',
      html: `<p>Klik tautan berikut untuk mengatur ulang password:</p><p><a href="${url}">Reset password</a></p>`,
    }),
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => sendEmail({
      to: user.email,
      subject: 'Verifikasi email LacakKarirku',
      html: `<p>Selamat datang di LacakKarirku.</p><p><a href="${url}">Verifikasi email</a></p>`,
    }),
  },
  advanced: { database: { generateId: 'uuid' }, useSecureCookies: process.env.NODE_ENV === 'production' },
})
