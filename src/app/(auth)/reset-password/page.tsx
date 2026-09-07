import { Suspense } from 'react'
import AuthForm from '@/components/AuthForm'
export default function ResetPasswordPage() { return <main className="grid min-h-screen place-items-center bg-navy p-4"><Suspense><AuthForm mode="reset" /></Suspense></main> }
