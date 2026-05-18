import VisitNotesList from '@/components/VisitNotesList'

export const metadata = {
  title: 'Visit Notes',
  description: 'All doctor home visit notes',
}

export default function VisitNotesPage() {
  return (
    <main>
      <VisitNotesList />
    </main>
  )
}
