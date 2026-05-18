import VisitNoteForm from '@/components/VisitNoteForm'
import { Suspense } from 'react'

export const metadata = {
  title: 'New Visit Note',
  description: 'Create a doctor home visit note',
}

export default function NewVisitNotePage() {
  return (
    <main>
      <Suspense fallback={<div className="p-6 text-sm text-slate-600">Loading visit note form…</div>}>
        <VisitNoteForm />
      </Suspense>
    </main>
  )
}
