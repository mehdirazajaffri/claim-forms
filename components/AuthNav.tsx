'use client'

import { signOut, useSession } from 'next-auth/react'

export default function AuthNav() {
  const { data: session } = useSession()

  if (!session?.user) return null

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-slate-600">{session.user.name}</span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="app-nav__link"
      >
        Sign Out
      </button>
    </div>
  )
}
