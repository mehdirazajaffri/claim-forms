'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const callbackUrl = searchParams.get('callbackUrl') || '/'

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/')
    }
  }, [status, router])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setError('Invalid username or password')
        setLoading(false)
        return
      }

      // Give NextAuth time to set cookies before navigating
      await new Promise(resolve => setTimeout(resolve, 100))
      router.push(callbackUrl)
    } catch (err) {
      setError('Invalid username or password')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md pt-16">
      <section className="surface-card p-8">
        <div className="eyebrow">Secure Access</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Sign in to Claims Workspace</h1>
        <p className="mt-2 text-sm text-slate-600">Use your username and password to continue.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="field-shell">
            <label htmlFor="username" className="field-label">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="field-input"
              required
            />
          </div>

          <div className="field-shell">
            <label htmlFor="password" className="field-label">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input"
              required
            />
          </div>

          {error ? <div className="notice-danger">{error}</div> : null}

          <button type="submit" disabled={loading} className="button-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md pt-16 text-sm text-slate-600">Loading login...</div>}>
      <LoginForm />
    </Suspense>
  )
}
