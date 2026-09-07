import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

const publicPrefixes = ['/', '/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/api/auth', '/api/cron/scrape']

export default function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublic = path === '/' || publicPrefixes.slice(1).some((prefix) => path.startsWith(prefix))
  if (!isPublic && !getSessionCookie(request)) return NextResponse.redirect(new URL('/sign-in', request.url))
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
