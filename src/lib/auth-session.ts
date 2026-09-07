import { headers } from 'next/headers'
import { betterAuthInstance } from '@/lib/auth'

export async function auth() {
  const session = await betterAuthInstance.api.getSession({ headers: await headers() })
  return { userId: session?.user.id ?? null }
}

export async function currentUser() {
  const session = await betterAuthInstance.api.getSession({ headers: await headers() })
  return session?.user ?? null
}
