'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import ConfirmDialog from './ConfirmDialog'

type ClaimRecord = Partial<FormData> & {
  id: string
  createdAt?: string
  [key: string]: unknown
}

interface Patient {
  id: string
  cardNumber: string
  name: string
  birthDate?: string
  sex?: string
  policyNo?: string
  claims: ClaimRecord[]
}

interface FormData {
  cardNumber: string
  name: string
  birthDate: string
  sex: string
  policyNo: string
  date: string
  provider: string
  serviceDate: string
  symptoms: string
  preExistingCondition: boolean
  chronicMedications: boolean
  familyHistory: boolean
  additionalNotes: string
  clinicalFindings: string
  cause: string
  otherCause: string
  assessmentAcute: boolean
  assessmentChronic: boolean
  assessmentConfirmed: boolean
  assessmentSuspected: boolean
  comments: string
  consultation: boolean
  physiotherapy: boolean
  laboratory: boolean
  radiology: boolean
  pharmacy: boolean
  otherMedical: string
  preAuthorizationRequired: boolean
  preAuthorizationDetails: string
  proposedTreatment: string
  estimatedCost: string
  lengthOfStay: string
  inPatientProvider: string
  inPatientCost: string
  treatingPhysicianName: string
  telFax: string
  approvedTariff: boolean
  approvalCode: string
}

export default function ClaimForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>()

  const commentsRef = useRef<HTMLTextAreaElement | null>(null)
  const additionalNotesRef = useRef<HTMLTextAreaElement | null>(null)
  const clinicalFindingsRef = useRef<HTMLTextAreaElement | null>(null)
  const [commentsOverflow, setCommentsOverflow] = useState(false)
  const [additionalNotesOverflow, setAdditionalNotesOverflow] = useState(false)
  const [clinicalFindingsOverflow, setClinicalFindingsOverflow] = useState(false)

  const commentsValue = watch('comments')
  const additionalNotesValue = watch('additionalNotes')
  const clinicalFindingsValue = watch('clinicalFindings')

  const checkOverflow = (el: HTMLTextAreaElement | null) =>
    !!el && el.scrollHeight > el.clientHeight + 1

  useEffect(() => {
    setCommentsOverflow(checkOverflow(commentsRef.current))
  }, [commentsValue])

  useEffect(() => {
    setAdditionalNotesOverflow(checkOverflow(additionalNotesRef.current))
  }, [additionalNotesValue])

  useEffect(() => {
    setClinicalFindingsOverflow(checkOverflow(clinicalFindingsRef.current))
  }, [clinicalFindingsValue])

  const commentsRegister = register('comments')
  const additionalNotesRegister = register('additionalNotes')
  const clinicalFindingsRegister = register('clinicalFindings')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientMatches, setPatientMatches] = useState<Patient[]>([])
  const [cardNumber, setCardNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lastSavedClaimId, setLastSavedClaimId] = useState<string | null>(null)
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [searchFeedback, setSearchFeedback] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [pendingClaimDeletion, setPendingClaimDeletion] = useState<string | null>(null)
  const [physicianSignatureImage, setPhysicianSignatureImage] = useState<string | null>(null)


  const handlePhysicianSignaturePaste = () => {
    setPhysicianSignatureImage('/signature.png')
  }

  useEffect(() => {
    fetchPatients()
  }, [])






  useEffect(() => {
    const claimId = searchParams.get('claimId')
    const patientId = searchParams.get('patientId')

    if (claimId) {
      loadClaimById(claimId)
      return
    }

    if (patientId) {
      loadPatientById(patientId)
    }
  }, [searchParams, patients])

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/patients')
      setPatients(response.data)
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    }
  }

  const applyClaimToForm = (claim: ClaimRecord) => {
    Object.keys(claim).forEach((key) => {
      if (!['id', 'patientId', 'createdAt', 'updatedAt', 'patient'].includes(key)) {
        try {
          setValue(key as keyof FormData, claim[key] as never)
        } catch (e) {
          // Skip unknown keys
        }
      }
    })
  }

  const prefillFromPatient = (selectedPatient: Patient, feedbackMessage: string) => {
    reset()
    setPatient(selectedPatient)
    setPatientMatches([])
    setCardNumber(selectedPatient.cardNumber)
    setEditingClaimId(null)

    setValue('cardNumber', selectedPatient.cardNumber)
    setValue('name', selectedPatient.name)
    setValue('birthDate', selectedPatient.birthDate || '')
    setValue('sex', selectedPatient.sex || '')
    setValue('policyNo', selectedPatient.policyNo || '')

    if (selectedPatient.claims && selectedPatient.claims.length > 0) {
      const latestClaim = [...selectedPatient.claims].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })[0]

      applyClaimToForm(latestClaim)
    }

    setSearchFeedback(feedbackMessage)
  }

  const choosePatientMatch = (selectedPatient: Patient) => {
    prefillFromPatient(selectedPatient, `Loaded ${selectedPatient.name}. Form prefilled from the selected patient record.`)
  }

  const loadPatientById = async (patientId: string) => {
    try {
      setLoading(true)

      const matchedPatient = patients.find((entry) => entry.id === patientId)
      const selectedPatient = matchedPatient || (await axios.get(`/api/patients/${patientId}`)).data

      if (!selectedPatient) {
        setSearchFeedback('Unable to load selected patient.')
        return
      }

      prefillFromPatient(selectedPatient, `Loaded patient ${selectedPatient.name}. Form prefilled from latest claim if available.`)
    } catch (error) {
      console.error('Failed to load patient by id:', error)
      setSearchFeedback('Unable to load selected patient.')
    } finally {
      setLoading(false)
    }
  }

  const loadClaimById = async (claimId: string) => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/claims/${claimId}`)
      const claim = response.data as ClaimRecord & {
        patient?: {
          id: string
          cardNumber?: string
          name?: string
          birthDate?: string
          sex?: string
          policyNo?: string
        }
      }

      if (!claim?.patient) {
        setSearchFeedback('Claim loaded, but patient data is missing.')
        return
      }

      const matchedPatient = patients.find((p) => p.id === claim.patient?.id)
      const fallbackPatient: Patient = {
        id: claim.patient.id,
        cardNumber: claim.patient.cardNumber || '',
        name: claim.patient.name || '',
        birthDate: claim.patient.birthDate,
        sex: claim.patient.sex,
        policyNo: claim.patient.policyNo,
        claims: [{ id: claim.id, createdAt: claim.createdAt as string | undefined }],
      }

      const selectedPatient = matchedPatient || fallbackPatient
      setPatient(selectedPatient)
      setCardNumber(selectedPatient.cardNumber)

      setValue('cardNumber', selectedPatient.cardNumber)
      setValue('name', selectedPatient.name)
      if (selectedPatient.birthDate) setValue('birthDate', selectedPatient.birthDate)
      if (selectedPatient.sex) setValue('sex', selectedPatient.sex)
      if (selectedPatient.policyNo) setValue('policyNo', selectedPatient.policyNo)

      applyClaimToForm(claim)
      setEditingClaimId(claim.id)
      setLastSavedClaimId(claim.id)
      setSearchFeedback(`Editing claim for ${selectedPatient.name}.`)
    } catch (error) {
      console.error('Failed to load claim by id:', error)
      setSearchFeedback('Unable to load selected claim.')
    } finally {
      setLoading(false)
    }
  }

  const searchPatient = async () => {
    const query = cardNumber.trim().toLowerCase()
    if (!query) {
      setSearchFeedback('Enter a patient name or Emirates ID to search.')
      return
    }

    setSearchFeedback('')
    setPatientMatches([])
    setLoading(true)
    try {
      const exactCardMatch = patients.find(
        (p) => p.cardNumber.toLowerCase() === query
      )

      const partialMatches = patients.filter(
        (p) =>
          p.cardNumber.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query)
      )

      if (exactCardMatch) {
        prefillFromPatient(
          exactCardMatch,
          'Patient found. Form prefilled from latest claim if available.'
        )
      } else if (partialMatches.length === 1) {
        prefillFromPatient(
          partialMatches[0],
          'Patient found. Form prefilled from latest claim if available.'
        )
      } else if (partialMatches.length > 1) {
        setPatient(null)
        setPatientMatches(partialMatches)
        setSearchFeedback(`Multiple matches found (${partialMatches.length}). Select the correct patient record to prefill the form.`)
      } else {
        setPatient(null)
        setSearchFeedback('No existing patient found. Fill the form to create a new patient and claim.')
      }
    } catch (error) {
      console.error('Failed to search patient:', error)
      setSearchFeedback('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setSubmitError('')
    try {
      let patientData = patient
      if (!patientData) {
        const patientResponse = await axios.post('/api/patients', {
          cardNumber: data.cardNumber,
          name: data.name,
          birthDate: data.birthDate,
          sex: data.sex,
          policyNo: data.policyNo,
        })
        patientData = patientResponse.data
        setPatient(patientData)
      }

      const claimResponse = await axios.post('/api/claims', {
        patientId: patientData!.id,
        ...data,
         physicianSignature: physicianSignatureImage,
      })

      const newClaimId = claimResponse.data.id as string
      setLastSavedClaimId(newClaimId)
      setEditingClaimId(newClaimId)

      setSuccess(true)
      if (onSuccess) onSuccess()
      setTimeout(() => setSuccess(false), 3000)
      setSearchFeedback('Claim saved. You can now download or update it below.')
      fetchPatients()
      router.replace(`/claims/new?claimId=${newClaimId}`)
    } catch (error) {
      console.error('Failed to submit claim:', error)
      setSubmitError('Error submitting claim. Please review required details and retry.')
    } finally {
      setLoading(false)
    }
  }

  const onUpdate = async (data: FormData) => {
    if (!editingClaimId) return
    setUpdateLoading(true)
    setSubmitError('')
    try {
      const claimResponse = await axios.put(`/api/claims/${editingClaimId}`, {
        ...data,
        physicianSignature: physicianSignatureImage,
      })

      setLastSavedClaimId(claimResponse.data.id)
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 3000)
      setSearchFeedback('Claim updated successfully.')
      fetchPatients()
    } catch (error) {
      console.error('Failed to update claim:', error)
      setSubmitError('Error updating claim. Please review required details and retry.')
    } finally {
      setUpdateLoading(false)
    }
  }

  const deleteClaim = async (claimId: string) => {
    setLoading(true)
    try {
      await axios.delete(`/api/claims/${claimId}`)
      setPendingClaimDeletion(null)
      setSearchFeedback('Claim deleted successfully.')
      reset()
      setCardNumber('')
      setPatient(null)
      fetchPatients()
    } catch (error) {
      console.error('Failed to delete claim:', error)
      setSubmitError('Error deleting claim. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={Boolean(pendingClaimDeletion)}
        title="Delete claim?"
        description="Are you sure you want to delete this claim? This action cannot be undone."
        busy={loading}
        onCancel={() => setPendingClaimDeletion(null)}
        onConfirm={() => {
          if (!pendingClaimDeletion) return
          deleteClaim(pendingClaimDeletion)
        }}
      />

      <section className="hero-panel px-6 py-7 md:px-8 md:py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="eyebrow">Claim workflow</div>
            <h1 className="section-title text-slate-950">Create a new claim or prefill from prior patient history.</h1>
            <p className="text-sm leading-6 text-slate-600 md:text-base">
              Search for a patient first to preload demographics, then complete the claim form that mirrors the final printable document.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/" className="button-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {!success && (
        <section className="surface-card p-6 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="eyebrow">Patient lookup</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Find a patient before starting the form</h2>
              <p className="mt-2 text-sm text-slate-600">Use a patient name or card number to prefill the form with existing member information and latest history.</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <div className="field-shell flex-1">
              <label className="field-label" htmlFor="claim-patient-search">Patient name or Emirates ID</label>
              <input
                id="claim-patient-search"
                type="text"
                placeholder="Enter patient name or Emirates ID"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPatient()}
                className="field-input"
              />
            </div>

            <button
              type="button"
              onClick={searchPatient}
              disabled={loading}
              className="button-primary md:self-end"
            >
              {loading ? 'Searching...' : 'Search Patient'}
            </button>
          </div>

          {patientMatches.length > 1 && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Select a patient record</div>
              <div className="mt-3 space-y-3">
                {patientMatches.map((match) => (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => choosePatientMatch(match)}
                    className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-teal-300 hover:bg-teal-50"
                  >
                    <div className="font-semibold text-slate-950">{match.name}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                      <span className="rounded-full bg-slate-100 px-2 py-1">Card {match.cardNumber}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1">Policy {match.policyNo || 'N/A'}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1">Birth {match.birthDate || 'N/A'}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1">Claims {match.claims?.length || 0}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

            {patient && (
              <div className="notice-neutral mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm">
                  <strong>Patient:</strong> {patient.name} | <strong>Card:</strong> {patient.cardNumber} | <strong>Claims:</strong> {patient.claims?.length || 0}
                </div>
                {(editingClaimId || lastSavedClaimId) && (
                  <a
                    href={`/print/${editingClaimId || lastSavedClaimId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-secondary min-h-[38px] px-3 text-xs"
                  >
                    Download Claim PDF
                  </a>
                )}
              </div>
            )}

            {searchFeedback && (
              <div className="notice-neutral mt-4">{searchFeedback}</div>
            )}
        </section>
      )}

      {success && (
        <div className="notice-success text-center font-semibold">
          Claim submitted successfully.
          {lastSavedClaimId && (
            <div className="mt-4 flex justify-center">
              <a
                href={`/print/${lastSavedClaimId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary"
              >
                Download Claim PDF
              </a>
            </div>
          )}
        </div>
      )}

      {submitError && <div className="notice-danger text-center font-semibold">{submitError}</div>}

      {/* PDF-Style Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="claim-paper bg-white p-6 md:p-8 lg:p-10">
        {/* Header */}
        <div className="grid grid-cols-3 gap-4 mb-6 pb-4 border-b-4 border-amber-900">
          {/* Left: Logo/Company */}
          <div className="flex items-center">
            <Image
              src="/logo_original.svg"
              alt="Almadallah Healthcare Management"
              width={280}
              height={74}
              className="h-auto w-full max-w-[280px]"
              priority
            />
          </div>
          {/* Center: Title */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">Claim Form</div>
          </div>
          {/* Right: Form Number */}
          <div className="text-right">
            <div className="text-xs text-gray-600 mb-1">No.</div>
            <input
              type="text"
              placeholder="GYFOFO"
              className="border-b border-gray-400 px-2 py-1 w-24 text-sm font-semibold text-right"
            />
          </div>
        </div>

          {/* Date and Provider Top Row - Table Style */}
          <div className="grid grid-cols-2 gap-0 mb-6 border border-gray-400">
            <div className="border-r border-gray-400 p-3">
              <label className="block text-xs font-semibold text-gray-900 mb-2">Date:</label>
              <input
                type="date"
                {...register('date')}
                className="border-b border-gray-400 px-2 py-1 w-full text-sm"
              />
            </div>
            <div className="p-3">
              <label className="block text-xs font-semibold text-gray-900 mb-2">Provider:</label>
              <input
                type="text"
                {...register('provider')}
                className="border-b border-gray-400 px-2 py-1 w-full text-sm"
              />
            </div>
          </div>

          {/* PATIENT INFORMATION */}
          <div className="bg-[#dcccb6] px-4 py-2 font-bold text-xs text-[#3d2f1e] mb-0 border border-gray-400">PATIENT INFORMATION</div>
          <div className="border-l border-r border-b border-gray-400 p-4">
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-900 mb-2">Patient&apos;s Name (as on ID):</label>
              <input
                type="text"
                {...register('name')}
                className="border-b border-gray-400 px-2 py-2 w-full text-sm"
              />
            </div>
            {/* Card, Policy, BirthDate, Sex in one row */}
            <div className="grid grid-cols-4 gap-0 border border-gray-400">
              <div className="border-r border-gray-400 p-3">
                <label className="block text-xs font-semibold text-gray-900 mb-1">Emirates ID</label>
                <input
                  type="text"
                  {...register('cardNumber')}
                  className="border-b border-gray-400 px-2 py-1 w-full text-sm"
                />
              </div>
              <div className="border-r border-gray-400 p-3">
                <label className="block text-xs font-semibold text-gray-900 mb-1">policy No.</label>
                <input
                  type="text"
                  {...register('policyNo')}
                  className="border-b border-gray-400 px-2 py-1 w-full text-sm"
                />
              </div>
              <div className="border-r border-gray-400 p-3">
                <label className="block text-xs font-semibold text-gray-900 mb-1">BirthDate:</label>
                <input
                  type="date"
                  {...register('birthDate')}
                  className="border-b border-gray-400 px-2 py-1 w-full text-sm"
                />
              </div>
              <div className="p-3">
                <label className="block text-xs font-semibold text-gray-900 mb-1">Sex:</label>
                <select
                  {...register('sex')}
                  className="border-b border-gray-400 px-2 py-1 w-full text-sm"
                >
                  <option value="">Select</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </div>
            </div>
          </div>

          {/* INFORMATION */}
          <div className="bg-[#dcccb6] px-4 py-2 font-bold text-xs text-[#3d2f1e] mb-0 border-l border-r border-t border-gray-400 flex justify-between items-center">
            <span>INFORMATION</span>
            <span className="text-xs font-normal italic text-gray-600">To be completed by physician</span>
          </div>
          <div className="border-l border-r border-b border-gray-400 p-0">
            {/* Service Date and Symptoms Row */}
            <div className="grid grid-cols-2 gap-0 border-b border-gray-400">
              <div className="border-r border-gray-400 p-4">
                <label className="block text-xs font-semibold text-gray-900 mb-2">Service</label>
                <label className="block text-xs font-semibold text-gray-900 mb-2">Date</label>
                <input
                  type="date"
                  {...register('serviceDate')}
                  className="border-b border-gray-400 px-2 py-1 w-full text-sm"
                />
              </div>
              <div className="p-4 flex gap-2 items-start">
                <span className="shrink-0 w-max max-w-[min(42%,12rem)] pr-1 text-xs font-normal text-gray-900 leading-snug pt-0.5">
                  Symptom(s) as described by patient:
                </span>
                <textarea
                  {...register('symptoms')}
                  rows={2}
                  className="flex-1 min-w-0 border-b border-gray-400 px-2 py-1 text-sm resize-none"
                />
              </div>
            </div>

            {/* Checkboxes and Notes Row */}
            <div className="grid grid-cols-2 gap-0">
              <div className="border-r border-gray-400 p-4 space-y-2">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('preExistingCondition')}
                    className="w-4 h-4 border border-gray-400 mt-0.5 flex-shrink-0"
                    id="preExisting"
                  />
                  <label htmlFor="preExisting" className="text-xs text-gray-900 ml-2">Pre-existing Condition(s) being treated</label>
                </div>
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('chronicMedications')}
                    className="w-4 h-4 border border-gray-400 mt-0.5 flex-shrink-0"
                    id="chronic"
                  />
                  <label htmlFor="chronic" className="text-xs text-gray-900 ml-2">Chronic Medications</label>
                </div>
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('familyHistory')}
                    className="w-4 h-4 border border-gray-400 mt-0.5 flex-shrink-0"
                    id="family"
                  />
                  <label htmlFor="family" className="text-xs text-gray-900 ml-2">Family History of any Illness</label>
                </div>
              </div>
              <div className="p-4 flex gap-2 items-start">
                <span className="shrink-0 w-max max-w-[min(40%,10rem)] pr-1 text-xs font-normal text-gray-900 leading-snug pt-0.5">
                  If Yes Specify:
                </span>
                <div className="flex-1 min-w-0">
                  <textarea
                    {...additionalNotesRegister}
                    ref={(el) => {
                      additionalNotesRegister.ref(el)
                      additionalNotesRef.current = el
                    }}
                    onChange={(e) => {
                      additionalNotesRegister.onChange(e)
                      setAdditionalNotesOverflow(checkOverflow(e.currentTarget))
                    }}
                    rows={4}
                    className="w-full border-b border-gray-400 px-2 py-1 text-sm resize-none"
                  />
                  {additionalNotesOverflow && (
                    <p className="mt-1 text-[11px] text-amber-600">
                      Warning: text may not fit in the available space. try to keep it in 4 rows
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* OBJECTIVE/ASSESSMENT */}
          <div className="bg-[#dcccb6] px-4 py-2 font-bold text-xs text-[#3d2f1e] mb-0 border-l border-r border-t border-gray-400 flex justify-between items-center">
            <span>OBJECTIVE/ASSESSMENT</span>
            <span className="text-xs font-normal italic text-gray-600">To be completed by physician</span>
          </div>
          <div className="border-l border-r border-b border-gray-400 p-4 space-y-4">
            <div className="flex gap-2 items-start">
              <span className="shrink-0 w-max max-w-[min(40%,10rem)] pr-1 text-xs font-normal text-gray-900 leading-snug pt-0.5">
                Clinical Findings:
              </span>
              <div className="flex-1 min-w-0">
                <textarea
                  {...clinicalFindingsRegister}
                  ref={(el) => {
                    clinicalFindingsRegister.ref(el)
                    clinicalFindingsRef.current = el
                  }}
                  onChange={(e) => {
                    clinicalFindingsRegister.onChange(e)
                    setClinicalFindingsOverflow(checkOverflow(e.currentTarget))
                  }}
                  rows={3}
                  className="w-full border-b border-gray-400 px-2 py-1 text-sm resize-none"
                />
                {clinicalFindingsOverflow && (
                  <p className="mt-1 text-[11px] text-amber-600">
                    Warning: text may not fit in the available space. try to keep it in 3 rows
                  </p>
                )}
              </div>
            </div>

            {/* Cause Row */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">Cause</label>
              <div className="flex flex-wrap gap-3">
                {['Accident', 'Dental', 'Maternity', 'Physical Illness', 'Preventive', 'Psychiatry', 'Work Related'].map((opt) => (
                  <div key={opt} className="flex items-center">
                    <input
                      type="checkbox"
                      value={opt}
                      {...register('cause')}
                      className="w-3 h-3 border border-gray-400"
                      id={`cause-${opt}`}
                    />
                    <label htmlFor={`cause-${opt}`} className="text-xs text-gray-900 ml-1">{opt}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Other(s) Explain */}
            <div className="flex gap-2 items-start">
              <span className="shrink-0 w-max max-w-[min(40%,10rem)] pr-1 text-xs font-normal text-gray-900 leading-snug pt-0.5">
                Other(s), Explain
              </span>
              <textarea
                {...register('otherCause')}
                rows={2}
                className="flex-1 min-w-0 border-b border-gray-400 px-2 py-1 text-sm resize-none"
              />
            </div>

            {/* Assessment/Diagnosis Row */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">Assessment /Diagnosis</label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('assessmentAcute')}
                    className="w-3 h-3 border border-gray-400"
                    id="assess-Acute"
                  />
                  <label htmlFor="assess-Acute" className="text-xs text-gray-900 ml-1">Acute</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('assessmentChronic')}
                    className="w-3 h-3 border border-gray-400"
                    id="assess-Chronic"
                  />
                  <label htmlFor="assess-Chronic" className="text-xs text-gray-900 ml-1">Chronic</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('assessmentConfirmed')}
                    className="w-3 h-3 border border-gray-400"
                    id="assess-Confirmed"
                  />
                  <label htmlFor="assess-Confirmed" className="text-xs text-gray-900 ml-1">Confirmed</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('assessmentSuspected')}
                    className="w-3 h-3 border border-gray-400"
                    id="assess-Suspected"
                  />
                  <label htmlFor="assess-Suspected" className="text-xs text-gray-900 ml-1">Suspected</label>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="flex gap-2 items-start">
              <span className="shrink-0 w-max pr-1 text-xs font-normal text-gray-900 leading-snug pt-0.5">
                Comments
              </span>
              <div className="flex-1 min-w-0">
                <textarea
                  {...commentsRegister}
                  ref={(el) => {
                    commentsRegister.ref(el)
                    commentsRef.current = el
                  }}
                  onChange={(e) => {
                    commentsRegister.onChange(e)
                    setCommentsOverflow(checkOverflow(e.currentTarget))
                  }}
                  rows={3}
                  className="w-full border-b border-gray-400 px-2 py-1 text-sm resize-none"
                />
                {commentsOverflow && (
                  <p className="mt-1 text-[11px] text-amber-600">
                    Warning: text may not fit in the available space. try to keep it in 3 rows
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* MEDICAL PLAN */}
          <div className="bg-[#dcccb6] px-4 py-2 font-bold text-xs text-[#3d2f1e] mb-0 border-l border-r border-t border-gray-400">
            <div>MEDICAL PLAN</div>
            <div className="text-xs font-normal italic text-gray-600">Itemized original invoices & Applicable Prescriptions/Reports/Results Must be enclosed to consider the claim</div>
          </div>
          <div className="border-l border-r border-b border-gray-400 p-4 space-y-4">
            {/* Medical Plan Checkboxes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <input type="checkbox" {...register('consultation')} className="w-3 h-3 border border-gray-400" id="consultation" />
                  <label htmlFor="consultation" className="text-xs text-gray-900 ml-2">Consultation</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" {...register('physiotherapy')} className="w-3 h-3 border border-gray-400" id="physiotherapy" />
                  <label htmlFor="physiotherapy" className="text-xs text-gray-900 ml-2">Physiotherapy</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" {...register('laboratory')} className="w-3 h-3 border border-gray-400" id="laboratory" />
                  <label htmlFor="laboratory" className="text-xs text-gray-900 ml-2">Laboratory</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" {...register('radiology')} className="w-3 h-3 border border-gray-400" id="radiology" />
                  <label htmlFor="radiology" className="text-xs text-gray-900 ml-2">Radiology</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" {...register('pharmacy')} className="w-3 h-3 border border-gray-400" id="pharmacy" />
                  <label htmlFor="pharmacy" className="text-xs text-gray-900 ml-2">Pharmacy</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="w-3 h-3 border border-gray-400" id="other-medical" />
                  <label htmlFor="other-medical" className="text-xs text-gray-900 ml-2">Other</label>
                </div>
              </div>
              <div></div>
            </div>

            {/* Pre-Authorization and Almadallah Use Only Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex gap-2 items-start">
                <span className="shrink-0 w-max max-w-[min(44%,13rem)] pr-1 text-xs font-normal text-gray-900 leading-snug pt-0.5">
                  Pre Authorization Required for:
                </span>
                <textarea
                  {...register('preAuthorizationDetails')}
                  rows={3}
                  className="flex-1 min-w-0 border-b border-gray-400 px-2 py-1 text-sm resize-none"
                />
              </div>
              <div className="bg-[#eedfce] border border-gray-400 p-3">
                <div className="text-xs font-bold text-[#3d2f1e] mb-3">For Almadallah&apos;s Use Only</div>
                <div className="text-xs text-gray-700 mb-3">As per agreed tariff</div>
                <div className="flex gap-2 items-center">
                  <span className="shrink-0 w-max pr-1 text-xs font-normal text-gray-900">ApprovalCode:</span>
                  <input
                    type="text"
                    {...register('approvalCode')}
                    className="flex-1 min-w-0 border-b border-gray-400 px-2 py-1 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Full Details of Treatment */}
            <div className="flex gap-2 items-start">
              <span className="shrink-0 w-max max-w-[min(44%,13rem)] pr-1 text-xs font-normal text-gray-900 leading-snug pt-0.5">
                Full details of proposed treatment/ Surgery/ Medicine:
              </span>
              <textarea
                {...register('proposedTreatment')}
                rows={3}
                className="flex-1 min-w-0 border-b border-gray-400 px-2 py-1 text-sm resize-none"
              />
            </div>

            {/* Estimated Cost */}
            <div className="flex gap-2 items-center">
              <span className="shrink-0 w-max pr-1 text-xs font-normal text-gray-900">EstimatedCost</span>
              <input
                type="text"
                {...register('estimatedCost')}
                className="flex-1 min-w-0 border-b border-gray-400 px-2 py-1 text-sm"
              />
            </div>
          </div>

          {/* IN-PATIENT */}
          <div className="bg-[#dcccb6] px-4 py-2 font-bold text-xs text-[#3d2f1e] mb-0 border-l border-r border-t border-gray-400">
            <div>IN-PATIENT</div>
            <div className="text-xs font-normal italic">Discharge summary. Itemized Invoices, Report, Results should be attached</div>
          </div>
          <div className="border-l border-r border-b border-gray-400 p-0">
            <div className="grid grid-cols-3 gap-0">
              <div className="border-r border-gray-400 p-4">
                <label className="block text-xs font-semibold text-gray-900 mb-2">Length of stay</label>
                <input
                  type="text"
                  {...register('lengthOfStay')}
                  className="border-b border-gray-400 px-2 py-1 w-full text-sm"
                />
              </div>
              <div className="border-r border-gray-400 p-4">
                <label className="block text-xs font-semibold text-gray-900 mb-2">Provider</label>
                <input
                  type="text"
                  {...register('inPatientProvider')}
                  className="border-b border-gray-400 px-2 py-1 w-full text-sm"
                />
              </div>
              <div className="p-4">
                <label className="block text-xs font-semibold text-gray-900 mb-2">Cost</label>
                <input
                  type="text"
                  {...register('inPatientCost')}
                  className="border-b border-gray-400 px-2 py-1 w-full text-sm"
                />
              </div>
            </div>
          </div>

          {/* Declaration */}
          <div className="bg-[#dcccb6] border border-gray-400 p-3 mb-6 text-xs text-[#3d2f1e] italic leading-relaxed">
            The above information is true to the best of my knowledge. I hereby authorize any Healthcare Provider, Insurer, Employer or other Organization to release any information regarding my medical conditions &amp; history to ALMADALLAH for the purpose of determining insurance benefits
          </div>

          {/* Signature Section */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Left Column - Treating Physician */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">Treating Physician Name:</label>
              <input
                type="text"
                {...register('treatingPhysicianName')}
                className="border-b border-gray-400 px-2 py-1 w-full text-sm mb-4"
              />
              <label className="block text-xs font-semibold text-gray-900 mb-2">Tel/Fax</label>
              <input
                type="text"
                {...register('telFax')}
                className="border-b border-gray-400 px-2 py-1 w-full text-sm mb-6"
              />
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-2">Signature and stamp</label>
                <div 
                  className="h-20 border border-gray-300 mb-2 flex items-center justify-center overflow-hidden bg-white"
                >
                  {physicianSignatureImage ? (
                    <img src={physicianSignatureImage} alt="Physician signature" className="max-h-full max-w-full object-contain p-1" />
                  ) : null}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handlePhysicianSignaturePaste}
                    aria-label="Sign"
                    title="Sign"
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 rounded border border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                      <path d="M3 21h6" />
                      <path d="M14.5 4.5a2.1 2.1 0 0 1 3 3L8 17l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhysicianSignatureImage(null)}
                    disabled={!physicianSignatureImage}
                    aria-label="Remove physician signature"
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 rounded border border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    x
                  </button>
                </div>
              </div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">Date</label>
              <input
                type="date"
                aria-label="Physician signature date"
                className="border-b border-gray-400 px-2 py-1 w-full text-sm"
              />
            </div>

            {/* Right Column - Patient/Guardian */}
            <div>
              <div className="text-xs font-bold text-gray-900 mb-4">Patient/Guardian signature</div>
              <div className="h-20 border border-gray-300 mb-3" />
              <label className="block text-xs font-semibold text-gray-900 mb-1">Date</label>
              <input
                type="date"
                aria-label="Patient or guardian signature date"
                className="border-b border-gray-400 px-2 py-1 w-full text-sm"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-400 flex-wrap">
            {editingClaimId && (
              <button
                type="button"
                onClick={handleSubmit(onUpdate)}
                disabled={updateLoading || loading}
                className="button-primary"
              >
                {updateLoading ? 'Updating...' : updateSuccess ? 'Updated' : 'Update Claim'}
              </button>
            )}
            <button
              type="submit"
              disabled={loading || updateLoading}
              className={editingClaimId ? 'button-secondary' : 'button-primary'}
            >
              {loading ? 'Submitting...' : 'Save Claim'}
            </button>
            <button
              type="button"
              onClick={() => {
                reset()
                setCardNumber('')
                setPatient(null)
                setEditingClaimId(null)
                setLastSavedClaimId(null)
                setSearchFeedback('')
              }}
              className="button-secondary"
            >
              Clear Form
            </button>
            {patient && lastSavedClaimId && (
              <button
                type="button"
                onClick={() => setPendingClaimDeletion(lastSavedClaimId)}
                disabled={loading || updateLoading}
                className="button-danger"
              >
                {loading ? 'Deleting...' : 'Delete Claim'}
              </button>
            )}
          </div>
      </form>
    </div>
  )
}
