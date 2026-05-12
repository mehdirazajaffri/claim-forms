'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

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

export default function ClaimForm() {
  const { register, handleSubmit, reset, setValue } = useForm<FormData>()
  const searchParams = useSearchParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [cardNumber, setCardNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lastSavedClaimId, setLastSavedClaimId] = useState<string | null>(null)
  const [searchFeedback, setSearchFeedback] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    const claimId = searchParams.get('claimId')
    if (!claimId) return

    loadClaimById(claimId)
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
      setSearchFeedback(`Loaded claim for ${selectedPatient.name}.`)
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
      setSearchFeedback('Enter a patient name or card number to search.')
      return
    }

    setSearchFeedback('')
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

      const foundPatient = exactCardMatch || partialMatches[0]

      if (foundPatient) {
        setPatient(foundPatient)
        setSearchFeedback(
          partialMatches.length > 1
            ? `Multiple matches found (${partialMatches.length}). Showing ${foundPatient.name}.`
            : 'Patient found. Form prefilled from latest claim if available.'
        )
        setValue('cardNumber', foundPatient.cardNumber)
        setValue('name', foundPatient.name)
        if (foundPatient.birthDate) setValue('birthDate', foundPatient.birthDate)
        if (foundPatient.sex) setValue('sex', foundPatient.sex)
        if (foundPatient.policyNo) setValue('policyNo', foundPatient.policyNo)

        if (foundPatient.claims && foundPatient.claims.length > 0) {
          const latestClaim = [...foundPatient.claims].sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return bTime - aTime
          })[0]

          applyClaimToForm(latestClaim)
        }
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

  const getLatestClaimId = (claims: Patient['claims'] | undefined) => {
    if (!claims || claims.length === 0) return null

    return [...claims]
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })[0]?.id || null
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
        patientId: patientData.id,
        ...data,
      })

      setLastSavedClaimId(claimResponse.data.id)

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      reset()
      setCardNumber('')
      setPatient(null)
      setSearchFeedback('')
      fetchPatients()
    } catch (error) {
      console.error('Failed to submit claim:', error)
      setSubmitError('Error submitting claim. Please review required details and retry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 via-white to-amber-50 px-6 py-5 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 [font-family:var(--font-display),sans-serif]">
            Almadallah Claims Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Submit new healthcare claims, prefill from prior records, and download claim PDFs in one flow.
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-6 flex justify-end gap-3">
          <Link
            href="/patients"
            className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 font-medium text-sm"
          >
            View All Patients →
          </Link>
        </div>

        {/* Search Section */}
        {!success && (
          <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-300 rounded">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Search Patient</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter patient name or card number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPatient()}
                className="flex-1 px-4 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={searchPatient}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {patient && (
              <div className="mt-4 p-3 bg-white border border-blue-300 rounded text-sm">
                <strong>Patient:</strong> {patient.name} | <strong>Card:</strong> {patient.cardNumber} | <strong>Claims:</strong> {patient.claims?.length || 0}
                {getLatestClaimId(patient.claims) && (
                  <a
                    href={`/print/${getLatestClaimId(patient.claims)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 inline-block px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-semibold"
                  >
                    Download Latest Claim PDF
                  </a>
                )}
              </div>
            )}

            {searchFeedback && (
              <p className="mt-3 text-sm text-slate-700">{searchFeedback}</p>
            )}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border-2 border-green-400 text-green-700 rounded text-center font-semibold">
            ✅ Claim submitted successfully!
            {lastSavedClaimId && (
              <div className="mt-3">
                <a
                  href={`/print/${lastSavedClaimId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                  Download Submitted Claim PDF
                </a>
              </div>
            )}
          </div>
        )}

        {submitError && (
          <div className="mb-6 p-4 bg-red-100 border-2 border-red-300 text-red-700 rounded text-center font-semibold">
            {submitError}
          </div>
        )}

        {/* PDF-Style Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="claim-paper p-8 bg-white">
          {/* Header */}
          <div className="grid grid-cols-3 gap-4 mb-6 pb-4 border-b-4 border-amber-900">
            {/* Left: Logo/Company */}
            <div>
              <div className="font-bold text-amber-900 text-xl">ALMADALLAH</div>
              <div className="text-xs text-amber-700 font-semibold">HEALTHCARE MANAGEMENT</div>
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
          <div className="bg-amber-200 px-4 py-2 font-bold text-xs text-gray-900 mb-0 border border-gray-400">PATIENT INFORMATION</div>
          <div className="border-l border-r border-b border-gray-400 p-4">
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-900 mb-2">Patient&apos;s Name(as on card):</label>
              <input
                type="text"
                {...register('name')}
                className="border-b border-gray-400 px-2 py-2 w-full text-sm"
              />
            </div>
            {/* Card, Policy, BirthDate, Sex in one row */}
            <div className="grid grid-cols-4 gap-0 border border-gray-400">
              <div className="border-r border-gray-400 p-3">
                <label className="block text-xs font-semibold text-gray-900 mb-1">Card #</label>
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
          <div className="bg-amber-200 px-4 py-2 font-bold text-xs text-gray-900 mb-0 border-l border-r border-t border-gray-400 flex justify-between items-center">
            <span>INFORMATION</span>
            <span className="text-xs font-normal italic">To be completed by physician</span>
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
              <div className="p-4">
                <label className="block text-xs font-semibold text-gray-900 mb-2">Symptom(s) as described by patient:</label>
                <textarea
                  {...register('symptoms')}
                  rows={2}
                  className="border-b border-gray-400 px-2 py-1 w-full text-sm resize-none"
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
              <div className="p-4">
                <label className="block text-xs font-semibold text-gray-900 mb-2">If Yes</label>
                <label className="block text-xs font-semibold text-gray-900 mb-2">Specify:</label>
                <textarea
                  {...register('additionalNotes')}
                  rows={3}
                  className="border-b border-gray-400 px-2 py-1 w-full text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* OBJECTIVE/ASSESSMENT */}
          <div className="bg-amber-200 px-4 py-2 font-bold text-xs text-gray-900 mb-0 border-l border-r border-t border-gray-400 flex justify-between items-center">
            <span>OBJECTIVE/ASSESSMENT</span>
            <span className="text-xs font-normal italic">To be completed by physician</span>
          </div>
          <div className="border-l border-r border-b border-gray-400 p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">Clinical</label>
              <label className="block text-xs font-semibold text-gray-900 mb-2">Findings:</label>
              <textarea
                {...register('clinicalFindings')}
                rows={2}
                className="border-b border-gray-400 px-2 py-1 w-full text-sm resize-none"
              />
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
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">Other(s), Explain</label>
              <textarea
                {...register('otherCause')}
                rows={2}
                className="border-b border-gray-400 px-2 py-1 w-full text-sm resize-none"
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
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">Comments</label>
              <textarea
                {...register('comments')}
                rows={2}
                className="border-b border-gray-400 px-2 py-1 w-full text-sm resize-none"
              />
            </div>
          </div>

          {/* MEDICAL PLAN */}
          <div className="bg-amber-200 px-4 py-2 font-bold text-xs text-gray-900 mb-0 border-l border-r border-t border-gray-400">
            <div>MEDICAL PLAN</div>
            <div className="text-xs font-normal italic">Itemized original invoices & Applicable Prescriptions/Reports/Results Must be enclosed to consider the claim</div>
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
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-2">Pre Authorization Required for:</label>
                <textarea
                  {...register('preAuthorizationDetails')}
                  rows={3}
                  className="border-b border-gray-400 px-2 py-1 w-full text-sm resize-none"
                />
              </div>
              <div className="bg-amber-100 border border-gray-400 p-3">
                <div className="text-xs font-semibold text-gray-900 mb-3">For Almadallah&apos;s Use Only</div>
                <div className="text-xs text-gray-700 mb-3">As per agreed tariff</div>
                <label className="block text-xs font-semibold text-gray-900 mb-2">ApprovalCode:</label>
                <input
                  type="text"
                  {...register('approvalCode')}
                  className="border-b border-gray-400 px-2 py-1 w-full text-sm"
                />
              </div>
            </div>

            {/* Full Details of Treatment */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">Full details of proposed treatment/ Surgery/ Medicine:</label>
              <textarea
                {...register('proposedTreatment')}
                rows={3}
                className="border-b border-gray-400 px-2 py-1 w-full text-sm resize-none"
              />
            </div>

            {/* Estimated Cost */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">EstimatedCost</label>
              <input
                type="text"
                {...register('estimatedCost')}
                className="border-b border-gray-400 px-2 py-1 w-full text-sm"
              />
            </div>
          </div>

          {/* IN-PATIENT */}
          <div className="bg-amber-200 px-4 py-2 font-bold text-xs text-gray-900 mb-0 border-l border-r border-t border-gray-400">
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
          <div className="bg-amber-100 border border-gray-400 p-3 mb-6 text-xs text-gray-900 italic leading-relaxed">
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
                <div className="h-16 border border-gray-400 mb-3"></div>
              </div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">Date</label>
              <input
                type="date"
                className="border-b border-gray-400 px-2 py-1 w-full text-sm"
              />
            </div>

            {/* Right Column - Patient/Guardian */}
            <div>
              <div className="text-xs font-bold text-gray-900 mb-4">Patient/Guardian signature</div>
              <div className="h-16 border border-gray-400 mb-3"></div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">Date</label>
              <input
                type="date"
                className="border-b border-gray-400 px-2 py-1 w-full text-sm"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-400">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 font-semibold text-sm"
            >
              {loading ? 'Submitting...' : 'SUBMIT CLAIM'}
            </button>
            <button
              type="button"
              onClick={() => {
                reset()
                setCardNumber('')
                setPatient(null)
              }}
              className="px-8 py-3 bg-gray-400 text-gray-900 rounded hover:bg-gray-500 font-semibold text-sm"
            >
              CLEAR FORM
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
