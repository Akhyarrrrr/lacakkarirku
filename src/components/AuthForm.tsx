'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export default function AuthForm({ mode }: Readonly<{ mode: 'sign-in' | 'sign-up' | 'forgot' | 'reset' }>) {
  const router = useRouter(), searchParams = useSearchParams()
  const [loading, setLoading] = useState(false), [message, setMessage] = useState('')
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage('')
    const data = new FormData(event.currentTarget), email = String(data.get('email') || '').trim(), password = String(data.get('password') || ''), name = String(data.get('name') || '').trim()
    try {
      if (mode === 'sign-in') { const r = await authClient.signIn.email({ email, password, callbackURL: '/dashboard' }); if (r.error) throw new Error(r.error.message); router.push('/dashboard'); router.refresh() }
      else if (mode === 'sign-up') { const r = await authClient.signUp.email({ name, email, password, callbackURL: '/dashboard' }); if (r.error) throw new Error(r.error.message); setMessage('Akun dibuat. Periksa email untuk verifikasi sebelum masuk.') }
      else if (mode === 'forgot') { const r = await authClient.requestPasswordReset({ email, redirectTo: '/reset-password' }); if (r.error) throw new Error(r.error.message); setMessage('Jika email terdaftar, tautan reset sudah dikirim.') }
      else { const r = await authClient.resetPassword({ newPassword: password, token: searchParams.get('token') || '' }); if (r.error) throw new Error(r.error.message); setMessage('Password berhasil diperbarui. Silakan masuk.') }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Permintaan gagal.') } finally { setLoading(false) }
  }
  const title = mode === 'sign-in' ? 'Masuk' : mode === 'sign-up' ? 'Buat akun' : mode === 'forgot' ? 'Lupa password' : 'Reset password'
  return <form onSubmit={submit} className="card w-full max-w-md space-y-5" aria-label={title}>
    <div><h1 className="text-3xl font-bold font-fraunces text-navy">{title}</h1><p className="mt-2 text-sm text-gray-600">LacakKarirku public beta</p></div>
    {mode === 'sign-up' && <label className="block text-sm font-bold text-navy">Nama<input name="name" required autoComplete="name" className="input mt-2 min-h-11 w-full" /></label>}
    {mode !== 'reset' && <label className="block text-sm font-bold text-navy">Email<input name="email" type="email" required autoComplete="email" className="input mt-2 min-h-11 w-full" /></label>}
    {(mode === 'sign-in' || mode === 'sign-up' || mode === 'reset') && <label className="block text-sm font-bold text-navy">Password<input name="password" type="password" minLength={8} maxLength={128} required autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} className="input mt-2 min-h-11 w-full" /></label>}
    <button disabled={loading} className="btn-primary min-h-12 w-full disabled:opacity-60">{loading ? 'Memproses…' : title}</button>
    {message && <p role="status" className="rounded-lg bg-primary/5 p-3 text-sm font-semibold text-navy">{message}</p>}
    <div className="flex justify-between text-sm font-semibold text-primary">{mode === 'sign-in' && <><Link href="/forgot-password">Lupa password?</Link><Link href="/sign-up">Daftar</Link></>}{mode !== 'sign-in' && <Link href="/sign-in">Kembali ke login</Link>}</div>
  </form>
}
