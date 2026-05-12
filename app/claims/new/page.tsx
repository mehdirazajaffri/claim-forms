import ClaimForm from '@/components/ClaimForm'
import { Suspense } from 'react'

export const metadata = {
  title: 'Create Claim - Almadallah Claims',
  description: 'Create a new healthcare claim',
}

export default function NewClaimPage() {
  return (
    <main>
      <Suspense fallback={<div className="p-6 text-sm text-slate-600">Loading claim form...</div>}>
        <ClaimForm />
      </Suspense>
    </main>
  )
}