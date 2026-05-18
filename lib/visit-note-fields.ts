export const VISIT_NOTE_STRING_FIELDS = [
  'patientName',
  'ageGender',
  'dateOfVisit',
  'visitTime',
  'address',
  'contactNumber',
  'accompaniedBy',
  'temperature',
  'bloodPressure',
  'heartRate',
  'respiratoryRate',
  'spo2',
  'bloodSugar',
  'weight',
  'diagnosis',
  'chiefComplaints',
  'appearance',
  'hydration',
  'chest',
  'cvs',
  'perAbd',
  'cns',
  'musculoskeletal',
  'pallor',
  'icterus',
  'cyanosis',
  'clubbing',
  'koilonychia',
  'lymphadenopathy',
  'edema',
  'otherFindings',
  'medicationChanges',
  'laboratoryTests',
  'followUpPlan',
  'otherInstructions',
  'doctorName',
  'doctorContact',
  'doctorRegNo',
] as const

export type VisitNoteStringField = (typeof VISIT_NOTE_STRING_FIELDS)[number]

export function pickVisitNoteFields(body: Record<string, unknown>) {
  const data: Record<VisitNoteStringField, string | null> = {} as Record<VisitNoteStringField, string | null>
  for (const field of VISIT_NOTE_STRING_FIELDS) {
    const value = body[field]
    data[field] = typeof value === 'string' && value.trim() ? value : null
  }
  return data
}
