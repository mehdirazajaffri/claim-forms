import PatientsList from '@/components/PatientsList'

export const metadata = {
  title: 'Patients',
  description: 'View and search all patients and their claims',
}

export default function PatientsPage() {
  return <PatientsList />
}
