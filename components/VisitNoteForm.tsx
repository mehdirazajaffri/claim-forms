'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import VisitNoteSendActions from './VisitNoteSendActions'

interface PatientLite {
  id: string
  cardNumber: string
  name: string
  birthDate?: string | null
  sex?: string | null
}

interface PatientWithRelations extends PatientLite {
  visitNotes?: Array<{
    id: string
    createdAt?: string
    dateOfVisit?: string | null
    shareToken?: string | null
  }>
}

interface VisitNoteFormValues {
  patientName: string
  ageGender: string
  dateOfVisit: string
  visitTime: string
  address: string
  contactNumber: string
  accompaniedBy: string

  temperature: string
  bloodPressure: string
  heartRate: string
  respiratoryRate: string
  spo2: string
  bloodSugar: string
  weight: string

  diagnosis: string
  chiefComplaints: string

  appearance: string
  hydration: string
  chest: string
  cvs: string
  perAbd: string
  cns: string
  musculoskeletal: string
  pallor: string
  icterus: string
  cyanosis: string
  clubbing: string
  koilonychia: string
  lymphadenopathy: string
  edema: string
  otherFindings: string

  medicationChanges: string
  laboratoryTests: string
  followUpPlan: string
  otherInstructions: string

  doctorName: string
  doctorContact: string
  doctorRegNo: string
}

const DEFAULT_DOCTOR = {
  doctorName: 'Dr. Syeda Ramsha Batool',
  doctorContact: '+971 52 323 9489',
  doctorRegNo: '73456119',
}

const EMPTY: VisitNoteFormValues = {
  patientName: '',
  ageGender: '',
  dateOfVisit: new Date().toISOString().slice(0, 10),
  visitTime: '',
  address: '',
  contactNumber: '',
  accompaniedBy: '',
  temperature: '',
  bloodPressure: '',
  heartRate: '',
  respiratoryRate: '',
  spo2: '',
  bloodSugar: '',
  weight: '',
  diagnosis: '',
  chiefComplaints: '',
  appearance: '',
  hydration: '',
  chest: '',
  cvs: '',
  perAbd: '',
  cns: '',
  musculoskeletal: '',
  pallor: '',
  icterus: '',
  cyanosis: '',
  clubbing: '',
  koilonychia: '',
  lymphadenopathy: '',
  edema: '',
  otherFindings: '',
  medicationChanges: '',
  laboratoryTests: '',
  followUpPlan: '',
  otherInstructions: '',
  ...DEFAULT_DOCTOR,
}

const inputCls = 'border border-slate-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white'
const labelCls = 'block text-xs font-semibold text-slate-700 mb-1'

function describePatient(p: PatientLite) {
  return `${p.name} — ${p.cardNumber}`
}

export default function VisitNoteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const visitNoteIdParam = searchParams.get('visitNoteId')
  const patientIdParam = searchParams.get('patientId')

  const [patients, setPatients] = useState<PatientWithRelations[]>([])
  const [patientId, setPatientId] = useState<string>('')
  const [patientSearch, setPatientSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(visitNoteIdParam)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [feedback, setFeedback] = useState<string>('')
  const [error, setError] = useState<string>('')

  const { register, handleSubmit, reset, setValue, watch } = useForm<VisitNoteFormValues>({
    defaultValues: EMPTY,
  })

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === patientId) || null,
    [patientId, patients]
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    axios
      .get('/api/patients')
      .then((res) => {
        if (cancelled) return
        setPatients(res.data)
      })
      .catch((err) => {
        console.error('Failed to load patients', err)
        if (!cancelled) setError('Unable to load patients.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!visitNoteIdParam) return
    setLoading(true)
    axios
      .get(`/api/visit-notes/${visitNoteIdParam}`)
      .then((res) => {
        const data = res.data
        setEditingId(data.id)
        setShareToken(data.shareToken ?? null)
        setPatientId(data.patientId)
        reset({
          ...EMPTY,
          ...Object.fromEntries(
            Object.keys(EMPTY).map((key) => [key, data[key] ?? ''])
          ),
        } as VisitNoteFormValues)
      })
      .catch((err) => {
        console.error('Failed to load visit note', err)
        setError('Unable to load this visit note.')
      })
      .finally(() => setLoading(false))
  }, [visitNoteIdParam, reset])

  useEffect(() => {
    if (visitNoteIdParam) return
    if (patientIdParam && !patientId) {
      setPatientId(patientIdParam)
    }
  }, [patientIdParam, patientId, visitNoteIdParam])

  useEffect(() => {
    if (!selectedPatient || editingId) return
    if (!watch('patientName')) setValue('patientName', selectedPatient.name)
    const ageGenderParts: string[] = []
    if (selectedPatient.birthDate) {
      const birth = new Date(selectedPatient.birthDate)
      if (!Number.isNaN(birth.getTime())) {
        const ageMs = Date.now() - birth.getTime()
        const ageYears = Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000))
        if (ageYears > 0) ageGenderParts.push(`${ageYears} yrs`)
      }
    }
    if (selectedPatient.sex) ageGenderParts.push(selectedPatient.sex)
    if (ageGenderParts.length && !watch('ageGender')) {
      setValue('ageGender', ageGenderParts.join(' / '))
    }
  }, [selectedPatient, setValue, watch, editingId])

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase()
    if (!q) return patients
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.cardNumber.toLowerCase().includes(q)
    )
  }, [patientSearch, patients])

  const onSubmit = async (values: VisitNoteFormValues) => {
    if (!patientId) {
      setError('Please choose a patient first.')
      return
    }
    setSubmitting(true)
    setError('')
    setFeedback('')
    try {
      if (editingId) {
        const res = await axios.put(`/api/visit-notes/${editingId}`, values)
        setShareToken(res.data.shareToken ?? shareToken)
        setSavedAt(new Date())
        setFeedback('Visit note updated.')
      } else {
        const res = await axios.post('/api/visit-notes', {
          patientId,
          ...values,
        })
        setEditingId(res.data.id)
        setShareToken(res.data.shareToken ?? null)
        setSavedAt(new Date())
        setFeedback('Visit note saved.')
        router.replace(`/visit-notes/new?visitNoteId=${res.data.id}`)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to save visit note. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formValues = watch()

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="eyebrow">Home visit workflow</div>
            <h1 className="section-title text-slate-950">Doctor Home Visit Note</h1>
            <p className="text-sm leading-6 text-slate-600 md:text-base">
              Capture vitals, examination, and the plan of action for an at-home consultation, then share by email or WhatsApp.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/visit-notes" className="button-secondary">All visit notes</Link>
            <Link href="/" className="button-secondary">Dashboard</Link>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="surface-card p-6 md:p-7 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Patient</h2>
            <p className="text-xs text-slate-500">Pick the patient this visit was for.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_2fr] md:items-start">
            <input
              type="text"
              placeholder="Search by name or Emirates ID"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className={inputCls}
              disabled={!!editingId}
            />
            <select
              className={inputCls}
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              disabled={!!editingId}
            >
              <option value="">Select a patient…</option>
              {filteredPatients.map((p) => (
                <option key={p.id} value={p.id}>{describePatient(p)}</option>
              ))}
            </select>
          </div>

          {selectedPatient && (
            <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {selectedPatient.name} • Emirates ID {selectedPatient.cardNumber}
              {selectedPatient.sex ? ` • ${selectedPatient.sex}` : ''}
            </div>
          )}
        </section>

        <section className="surface-card p-6 md:p-7 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Visit details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Patient name</label>
              <input className={inputCls} {...register('patientName')} />
            </div>
            <div>
              <label className={labelCls}>Age / Gender</label>
              <input className={inputCls} {...register('ageGender')} placeholder="e.g. 62 yrs / Female" />
            </div>
            <div>
              <label className={labelCls}>Date of visit</label>
              <input type="date" className={inputCls} {...register('dateOfVisit')} />
            </div>
            <div>
              <label className={labelCls}>Visit time</label>
              <input type="time" className={inputCls} {...register('visitTime')} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Address</label>
              <input className={inputCls} {...register('address')} />
            </div>
            <div>
              <label className={labelCls}>Contact number</label>
              <input className={inputCls} {...register('contactNumber')} placeholder="+9715…" />
            </div>
            <div>
              <label className={labelCls}>Accompanied by</label>
              <input className={inputCls} {...register('accompaniedBy')} />
            </div>
          </div>
        </section>

        <section className="surface-card p-6 md:p-7 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Vitals</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelCls}>Temperature</label>
              <input className={inputCls} {...register('temperature')} placeholder="e.g. 37.2 °C" />
            </div>
            <div>
              <label className={labelCls}>Blood pressure</label>
              <input className={inputCls} {...register('bloodPressure')} placeholder="e.g. 120/80 mmHg" />
            </div>
            <div>
              <label className={labelCls}>Heart rate (pulse)</label>
              <input className={inputCls} {...register('heartRate')} placeholder="e.g. 78 bpm" />
            </div>
            <div>
              <label className={labelCls}>Respiratory rate</label>
              <input className={inputCls} {...register('respiratoryRate')} placeholder="breaths/min" />
            </div>
            <div>
              <label className={labelCls}>SpO₂</label>
              <input className={inputCls} {...register('spo2')} placeholder="e.g. 98%" />
            </div>
            <div>
              <label className={labelCls}>Blood sugar (Random/Fasting)</label>
              <input className={inputCls} {...register('bloodSugar')} placeholder="e.g. 110 mg/dL" />
            </div>
            <div>
              <label className={labelCls}>Weight</label>
              <input className={inputCls} {...register('weight')} placeholder="e.g. 72 kg" />
            </div>
          </div>
        </section>

        <section className="surface-card p-6 md:p-7 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Diagnosis</h2>
          <textarea rows={4} className={inputCls} {...register('diagnosis')} placeholder="Working / final diagnosis" />
          <div>
            <label className={labelCls}>Chief complaints</label>
            <textarea rows={4} className={inputCls} {...register('chiefComplaints')} placeholder="Symptoms the patient reports" />
          </div>
        </section>

        <section className="surface-card p-6 md:p-7 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">General examination</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['appearance', 'Appearance'],
              ['hydration', 'Hydration'],
              ['chest', 'Chest'],
              ['cvs', 'CVS'],
              ['perAbd', 'Per/Abd'],
              ['cns', 'CNS'],
              ['musculoskeletal', 'Musculoskeletal'],
              ['pallor', 'Pallor'],
              ['icterus', 'Icterus'],
              ['cyanosis', 'Cyanosis'],
              ['clubbing', 'Clubbing'],
              ['koilonychia', 'Koilonychia'],
              ['lymphadenopathy', 'Lymphadenopathy'],
              ['edema', 'Edema'],
            ].map(([field, label]) => (
              <div key={field}>
                <label className={labelCls}>{label}</label>
                <input
                  className={inputCls}
                  {...register(field as keyof VisitNoteFormValues)}
                />
              </div>
            ))}
          </div>
          <div>
            <label className={labelCls}>Other findings</label>
            <textarea rows={3} className={inputCls} {...register('otherFindings')} />
          </div>
        </section>

        <section className="surface-card p-6 md:p-7 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Recommendations / plan of action</h2>
          <div className="grid gap-4">
            <div>
              <label className={labelCls}>Medication changes</label>
              <textarea rows={2} className={inputCls} {...register('medicationChanges')} />
            </div>
            <div>
              <label className={labelCls}>Laboratory tests suggested</label>
              <textarea rows={2} className={inputCls} {...register('laboratoryTests')} />
            </div>
            <div>
              <label className={labelCls}>Follow-up plan</label>
              <textarea rows={2} className={inputCls} {...register('followUpPlan')} />
            </div>
            <div>
              <label className={labelCls}>Other instructions</label>
              <textarea rows={2} className={inputCls} {...register('otherInstructions')} />
            </div>
          </div>
        </section>

        <section className="surface-card p-6 md:p-7 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Doctor’s details</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelCls}>Doctor name</label>
              <input className={inputCls} {...register('doctorName')} />
            </div>
            <div>
              <label className={labelCls}>Contact No.</label>
              <input className={inputCls} {...register('doctorContact')} />
            </div>
            <div>
              <label className={labelCls}>Reg. No.</label>
              <input className={inputCls} {...register('doctorRegNo')} />
            </div>
          </div>
        </section>

        <section className="surface-card p-6 md:p-7 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {loading && 'Loading…'}
            {!loading && savedAt && `Last saved ${savedAt.toLocaleTimeString()}`}
            {!loading && feedback && <span className="ml-2 text-emerald-600">{feedback}</span>}
            {!loading && error && <span className="ml-2 text-rose-600">{error}</span>}
          </div>
          <div className="flex flex-wrap gap-3">
            {editingId && (
              <a
                href={`/api/visit-notes/${editingId}/download`}
                className="button-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download PDF
              </a>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : editingId ? 'Update visit note' : 'Save visit note'}
            </button>
          </div>
        </section>
      </form>

      {editingId && shareToken && (
        <VisitNoteSendActions
          shareToken={shareToken}
          patientContactNumber={formValues.contactNumber || ''}
          patientName={formValues.patientName || selectedPatient?.name || 'patient'}
          doctorName={formValues.doctorName}
          dateOfVisit={formValues.dateOfVisit}
        />
      )}
    </div>
  )
}
