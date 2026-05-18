'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmDialog from './ConfirmDialog'

interface Claim {
  id: string
  date: string
  symptoms: string
  cause: string
  createdAt: string
}

interface VisitNote {
  id: string
  dateOfVisit?: string | null
  visitTime?: string | null
  chiefComplaints?: string | null
  doctorName?: string | null
  shareToken?: string | null
  createdAt: string
}

interface Patient {
  id: string
  cardNumber: string
  name: string
  birthDate?: string
  sex?: string
  policyNo?: string
  assessmentFileLink?: string
  createdAt: string
  claims: Claim[]
  visitNotes?: VisitNote[]
}

type StatusTone = 'success' | 'danger' | 'neutral'

interface StatusState {
  tone: StatusTone
  text: string
}

interface PendingClaimDeletion {
  claimId: string
  patientName: string
}

interface PatientFormState {
  cardNumber: string
  name: string
  birthDate: string
  sex: string
  policyNo: string
  assessmentFileLink: string
}

const emptyForm: PatientFormState = {
  cardNumber: '',
  name: '',
  birthDate: '',
  sex: '',
  policyNo: '',
  assessmentFileLink: '',
}

const toFormState = (patient: Patient): PatientFormState => ({
  cardNumber: patient.cardNumber || '',
  name: patient.name || '',
  birthDate: patient.birthDate || '',
  sex: patient.sex || '',
  policyNo: patient.policyNo || '',
  assessmentFileLink: patient.assessmentFileLink || '',
})

export default function PatientsList() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [status, setStatus] = useState<StatusState | null>(null)
  const [pendingClaimDeletion, setPendingClaimDeletion] = useState<PendingClaimDeletion | null>(null)
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<PatientFormState>(emptyForm)
  const [savingEdit, setSavingEdit] = useState(false)
  const [formData, setFormData] = useState<PatientFormState>(emptyForm)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/patients')
      setPatients(response.data)
      setFilteredPatients(response.data)
    } catch (error) {
      console.error('Failed to fetch patients:', error)
      setStatus({ tone: 'danger', text: 'Unable to load patients right now. Please refresh and try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const filtered = patients.filter((patient) =>
      patient.cardNumber.toLowerCase().includes(value.toLowerCase()) ||
      patient.name.toLowerCase().includes(value.toLowerCase()) ||
      patient.policyNo?.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredPatients(filtered)
  }

  const toggleExpanded = (patientId: string) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId)
  }

  const deleteClaim = async (claimId: string, patientName: string) => {
    try {
      setLoading(true)
      await axios.delete(`/api/claims/${claimId}`)
      setPendingClaimDeletion(null)
      setStatus({ tone: 'success', text: `Claim removed for ${patientName}.` })
      fetchPatients()
    } catch (error) {
      console.error('Failed to delete claim:', error)
      setStatus({ tone: 'danger', text: 'Error deleting claim. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const deleteVisitNote = async (visitNoteId: string, patientName: string) => {
    if (!confirm(`Delete this visit note for ${patientName}? This cannot be undone.`)) return
    try {
      setLoading(true)
      await axios.delete(`/api/visit-notes/${visitNoteId}`)
      setStatus({ tone: 'success', text: `Visit note removed for ${patientName}.` })
      fetchPatients()
    } catch (error) {
      console.error('Failed to delete visit note:', error)
      setStatus({ tone: 'danger', text: 'Error deleting visit note. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const startEditPatient = (patient: Patient) => {
    setEditingPatientId(patient.id)
    setEditForm(toFormState(patient))
    setExpandedPatient(patient.id)
    setStatus(null)
  }

  const cancelEditPatient = () => {
    setEditingPatientId(null)
    setEditForm(emptyForm)
  }

  const saveEditPatient = async (patientId: string) => {
    if (!editForm.cardNumber.trim() || !editForm.name.trim()) {
      setStatus({ tone: 'danger', text: 'Emirates ID and patient name are required.' })
      return
    }

    try {
      setSavingEdit(true)
      await axios.put(`/api/patients/${patientId}`, {
        cardNumber: editForm.cardNumber.trim(),
        name: editForm.name.trim(),
        birthDate: editForm.birthDate || null,
        sex: editForm.sex || null,
        policyNo: editForm.policyNo.trim() || null,
        assessmentFileLink: editForm.assessmentFileLink.trim() || null,
      })
      setEditingPatientId(null)
      setEditForm(emptyForm)
      setStatus({ tone: 'success', text: 'Patient updated successfully.' })
      fetchPatients()
    } catch (error: any) {
      console.error('Failed to update patient:', error)
      const errorMsg = error.response?.data?.error || 'Failed to update patient.'
      setStatus({ tone: 'danger', text: errorMsg })
    } finally {
      setSavingEdit(false)
    }
  }

  const deletePatient = async (patientId: string, patientName: string) => {
    if (!confirm(`Delete patient "${patientName}" and all their claims? This action cannot be undone.`)) return

    try {
      setLoading(true)
      await axios.delete(`/api/patients/${patientId}`)
      setExpandedPatient(null)
      setStatus({ tone: 'success', text: `${patientName} and all related claims were deleted.` })
      fetchPatients()
    } catch (error) {
      console.error('Failed to delete patient:', error)
      setStatus({ tone: 'danger', text: 'Error deleting patient. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.cardNumber.trim() || !formData.name.trim()) {
      setStatus({ tone: 'danger', text: 'Emirates ID and patient name are required before saving.' })
      return
    }

    try {
      setLoading(true)
      await axios.post('/api/patients', {
        cardNumber: formData.cardNumber.trim(),
        name: formData.name.trim(),
        birthDate: formData.birthDate || null,
        sex: formData.sex || null,
        policyNo: formData.policyNo.trim() || null,
      })

      setFormData(emptyForm)
      setShowAddForm(false)
      setStatus({ tone: 'success', text: 'Patient created successfully and added to the patient list.' })
      fetchPatients()
    } catch (error: any) {
      console.error('Failed to add patient:', error)
      const errorMsg = error.response?.data?.error || 'Failed to add patient.'
      setStatus({ tone: 'danger', text: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  const statusClassName =
    status?.tone === 'success'
      ? 'notice-success'
      : status?.tone === 'danger'
        ? 'notice-danger'
        : 'notice-neutral'

  const formatDate = (value?: string) => {
    if (!value) return 'Not provided'
    return new Date(value).toLocaleDateString()
  }

  const summarizeSymptoms = (symptoms?: string) => {
    if (!symptoms) return 'No notes provided'
    return symptoms.length > 56 ? `${symptoms.slice(0, 56)}...` : symptoms
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={Boolean(pendingClaimDeletion)}
        title="Delete claim?"
        description={pendingClaimDeletion ? `Delete claim for ${pendingClaimDeletion.patientName}? This action cannot be undone.` : ''}
        busy={loading}
        onCancel={() => setPendingClaimDeletion(null)}
        onConfirm={() => {
          if (!pendingClaimDeletion) return
          deleteClaim(pendingClaimDeletion.claimId, pendingClaimDeletion.patientName)
        }}
      />

      <section className="hero-panel px-6 py-7 md:px-8 md:py-8">
        <div className="space-y-4">
          <div className="eyebrow">Claims operations dashboard</div>
          <div className="space-y-3">
            <h1 className="section-title text-slate-950">Patient list, claim intake, and document access in one workspace.</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Review patients, open prior claims as templates, add new members, and move straight into claim submission without losing context.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/claims/new" className="button-primary">
              Create Claim
            </Link>
            <button
              type="button"
              onClick={() => setShowAddForm((current) => !current)}
              className="button-secondary"
            >
              {showAddForm ? 'Hide Patient Form' : 'Create Patient'}
            </button>
          </div>
        </div>
      </section>

      {status && <div className={statusClassName}>{status.text}</div>}

      <section className="space-y-6">
        <div className="space-y-6">
          {showAddForm && (
            <section className="surface-card p-6">
              <div className="eyebrow">Create patient</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Patient form</h2>

              <form onSubmit={handleAddPatient} className="mt-5 space-y-4">
                <div className="field-shell">
                  <label className="field-label" htmlFor="card-number">Emirates ID *</label>
                  <input
                    id="card-number"
                    type="text"
                    placeholder="784-1990-1234567-8"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                    className="field-input"
                    required
                  />
                </div>
                <div className="field-shell">
                  <label className="field-label" htmlFor="patient-name">Full Name *</label>
                  <input
                    id="patient-name"
                    type="text"
                    placeholder="Fatima Al-Mansouri"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="field-input"
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="field-shell">
                    <label className="field-label" htmlFor="patient-birthdate">Birth Date</label>
                    <input
                      id="patient-birthdate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="field-input"
                    />
                  </div>
                  <div className="field-shell">
                    <label className="field-label" htmlFor="patient-sex">Sex</label>
                    <select
                      id="patient-sex"
                      value={formData.sex}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                      className="field-select"
                    >
                      <option value="">Select</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                </div>
                <div className="field-shell">
                  <label className="field-label" htmlFor="policy-number">Policy Number</label>
                  <input
                    id="policy-number"
                    type="text"
                    placeholder="POL-2024-5403"
                    value={formData.policyNo}
                    onChange={(e) => setFormData({ ...formData, policyNo: e.target.value })}
                    className="field-input"
                  />
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button type="submit" disabled={loading} className="button-primary">
                    {loading ? 'Saving...' : 'Save Patient'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(emptyForm)}
                    className="button-secondary"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </section>
          )}

          <div className="surface-card p-6 md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="eyebrow">Patient search</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Find a patient by card, name, or policy number</h2>
                <p className="mt-2 text-sm text-slate-600">The patient list updates live as you type, so you can jump into an existing profile quickly.</p>
              </div>
              {searchTerm && (
                <button type="button" onClick={() => handleSearch('')} className="button-secondary">
                  Clear Search
                </button>
              )}
            </div>

            <div className="mt-5 field-shell">
              <label className="field-label" htmlFor="patient-search">Search patients</label>
              <input
                id="patient-search"
                type="text"
                placeholder="Start typing an Emirates ID, patient name, or policy number"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="field-input"
              />
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="surface-card px-6 py-10 text-center text-sm text-slate-600">Loading patients...</div>
            ) : filteredPatients.length === 0 ? (
              <div className="surface-card px-6 py-10 text-center">
                <h3 className="text-xl font-semibold text-slate-950">{patients.length === 0 ? 'No patients yet' : 'No matching patients found'}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {patients.length === 0
                    ? 'Create the first patient profile to start managing claims.'
                    : 'Try a broader search term or clear the filter to return to the full patient list.'}
                </p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <article key={patient.id} className="surface-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(patient.id)}
                    className="flex w-full flex-col gap-4 px-6 py-5 text-left transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Patient profile</div>
                        <h3 className="mt-1 text-xl font-semibold text-slate-950">{patient.name}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">Card {patient.cardNumber}</span>
                        {patient.policyNo && <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-800">Policy {patient.policyNo}</span>}
                        <span className="rounded-full bg-teal-50 px-3 py-1 font-medium text-teal-800">{patient.claims?.length || 0} claims</span>
                        <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-800">{patient.visitNotes?.length || 0} visits</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm text-slate-500">
                        <div>Member since</div>
                        <div className="font-semibold text-slate-900">{formatDate(patient.createdAt)}</div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-500">
                        {expandedPatient === patient.id ? '−' : '+'}
                      </div>
                    </div>
                  </button>

                  {expandedPatient === patient.id && (
                    <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-5 sm:px-6 sm:py-6">
                      <div className="grid gap-6 2xl:grid-cols-[320px_minmax(0,1fr)]">
                        <div className="space-y-4">
                          <div className="surface-card p-5">
                            <div className="eyebrow">{editingPatientId === patient.id ? 'Edit patient' : 'Patient detail'}</div>

                            {editingPatientId === patient.id ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault()
                                  saveEditPatient(patient.id)
                                }}
                                className="mt-4 space-y-4"
                              >
                                <div className="field-shell">
                                  <label className="field-label" htmlFor={`edit-card-${patient.id}`}>Emirates ID *</label>
                                  <input
                                    id={`edit-card-${patient.id}`}
                                    type="text"
                                    value={editForm.cardNumber}
                                    onChange={(e) => setEditForm({ ...editForm, cardNumber: e.target.value })}
                                    className="field-input"
                                    required
                                  />
                                </div>
                                <div className="field-shell">
                                  <label className="field-label" htmlFor={`edit-name-${patient.id}`}>Full Name *</label>
                                  <input
                                    id={`edit-name-${patient.id}`}
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="field-input"
                                    required
                                  />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="field-shell">
                                    <label className="field-label" htmlFor={`edit-birthdate-${patient.id}`}>Birth Date</label>
                                    <input
                                      id={`edit-birthdate-${patient.id}`}
                                      type="date"
                                      value={editForm.birthDate}
                                      onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                                      className="field-input"
                                    />
                                  </div>
                                  <div className="field-shell">
                                    <label className="field-label" htmlFor={`edit-sex-${patient.id}`}>Sex</label>
                                    <select
                                      id={`edit-sex-${patient.id}`}
                                      value={editForm.sex}
                                      onChange={(e) => setEditForm({ ...editForm, sex: e.target.value })}
                                      className="field-select"
                                    >
                                      <option value="">Select</option>
                                      <option value="M">Male</option>
                                      <option value="F">Female</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="field-shell">
                                  <label className="field-label" htmlFor={`edit-policy-${patient.id}`}>Policy Number</label>
                                  <input
                                    id={`edit-policy-${patient.id}`}
                                    type="text"
                                    value={editForm.policyNo}
                                    onChange={(e) => setEditForm({ ...editForm, policyNo: e.target.value })}
                                    className="field-input"
                                  />
                                </div>
                                <div className="field-shell">
                                  <label className="field-label" htmlFor={`edit-assessment-${patient.id}`}>Assessment File Link</label>
                                  <input
                                    id={`edit-assessment-${patient.id}`}
                                    type="url"
                                    placeholder="https://drive.google.com/..."
                                    value={editForm.assessmentFileLink}
                                    onChange={(e) => setEditForm({ ...editForm, assessmentFileLink: e.target.value })}
                                    className="field-input"
                                  />
                                </div>
                                <div className="flex flex-wrap gap-3 pt-1">
                                  <button type="submit" disabled={savingEdit} className="button-primary">
                                    {savingEdit ? 'Saving...' : 'Save Changes'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditPatient}
                                    disabled={savingEdit}
                                    className="button-secondary"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <div className="mt-4 grid gap-4 xl:grid-cols-2 2xl:grid-cols-1">
                                  <div>
                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Full name</div>
                                    <div className="mt-1 font-semibold text-slate-950">{patient.name}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Card number</div>
                                    <div className="mt-1 font-semibold text-slate-950">{patient.cardNumber}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Birth date</div>
                                    <div className="mt-1 font-semibold text-slate-950">{formatDate(patient.birthDate)}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sex</div>
                                    <div className="mt-1 font-semibold text-slate-950">{patient.sex ? (patient.sex === 'M' ? 'Male' : 'Female') : 'Not provided'}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Policy number</div>
                                    <div className="mt-1 font-semibold text-slate-950">{patient.policyNo || 'Not provided'}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Member since</div>
                                    <div className="mt-1 font-semibold text-slate-950">{formatDate(patient.createdAt)}</div>
                                  </div>
                                </div>

                                <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
                                  <div className="claim-actions">
                                    <Link
                                      href={`/claims/new?patientId=${patient.id}`}
                                      className="claim-action-btn claim-action-btn--open"
                                      aria-label="Create new claim for this patient"
                                      title="New Claim"
                                    >
                                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <path d="M14 2v6h6" />
                                        <path d="M8 13h6" />
                                        <path d="M8 17h8" />
                                        <path d="M8 9h2" />
                                      </svg>
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => startEditPatient(patient)}
                                      disabled={savingEdit}
                                      className="claim-action-btn claim-action-btn--print"
                                      aria-label="Edit patient details"
                                      title="Edit Patient"
                                    >
                                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deletePatient(patient.id, patient.name)}
                                      disabled={loading}
                                      className="claim-action-btn claim-action-btn--delete"
                                      aria-label="Delete patient"
                                      title="Delete Patient"
                                    >
                                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18" />
                                        <path d="M8 6V4h8v2" />
                                        <path d="M19 6l-1 14H6L5 6" />
                                        <path d="M10 11v6" />
                                        <path d="M14 11v6" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-6 min-w-0">
                          <div className="surface-card p-5 min-w-0">
                          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                            <div>
                              <div className="eyebrow">Claim history</div>
                              <h4 className="mt-2 text-xl font-semibold text-slate-950">{patient.claims?.length || 0} claims available for reuse or printing</h4>
                            </div>
                          </div>

                          {patient.claims && patient.claims.length > 0 ? (
                            <>
                              <div className="mt-5 hidden overflow-x-auto xl:block">
                                <table className="min-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm">
                                <thead className="bg-slate-100 text-slate-600">
                                  <tr>
                                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                                    <th className="px-4 py-3 text-left font-semibold">Clinical note</th>
                                    <th className="px-4 py-3 text-left font-semibold">Reason</th>
                                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {patient.claims.map((claim, idx) => (
                                    <tr
                                      key={claim.id}
                                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                                      onClick={() => router.push(`/claims/new?claimId=${claim.id}`)}
                                      title="Open this claim as a prefilled template"
                                    >
                                      <td className="px-4 py-4 align-top text-slate-700">{formatDate(claim.date || claim.createdAt)}</td>
                                      <td className="px-4 py-4 align-top text-slate-700">{summarizeSymptoms(claim.symptoms)}</td>
                                      <td className="px-4 py-4 align-top text-slate-700">{claim.cause || 'General'}</td>
                                      <td className="px-4 py-4 align-top">
                                        <div className="claim-actions">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              router.push(`/claims/new?claimId=${claim.id}`)
                                            }}
                                            className="claim-action-btn claim-action-btn--open"
                                            aria-label="Open claim template"
                                            title="Open template"
                                          >
                                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M7 17L17 7" />
                                              <path d="M9 7h8v8" />
                                            </svg>
                                          </button>
                                          <a
                                            href={`/print/${claim.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="claim-action-btn claim-action-btn--print"
                                            aria-label="Print claim PDF"
                                            title="Print / PDF"
                                          >
                                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M6 9V4h12v5" />
                                              <rect x="6" y="14" width="12" height="6" rx="1" />
                                              <rect x="4" y="9" width="16" height="7" rx="2" />
                                            </svg>
                                          </a>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setPendingClaimDeletion({ claimId: claim.id, patientName: patient.name })
                                            }}
                                            disabled={loading}
                                            className="claim-action-btn claim-action-btn--delete"
                                            aria-label="Delete claim"
                                            title="Delete claim"
                                          >
                                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M3 6h18" />
                                              <path d="M8 6V4h8v2" />
                                              <path d="M19 6l-1 14H6L5 6" />
                                              <path d="M10 11v6" />
                                              <path d="M14 11v6" />
                                            </svg>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                </table>
                              </div>

                              <div className="mt-5 space-y-3 xl:hidden">
                                {patient.claims.map((claim) => (
                                  <div
                                    key={claim.id}
                                    className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-teal-300 hover:bg-teal-50/40"
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div className="space-y-2">
                                        <div className="text-sm font-semibold text-slate-950">{formatDate(claim.date || claim.createdAt)}</div>
                                        <div className="text-sm text-slate-600">{summarizeSymptoms(claim.symptoms)}</div>
                                        <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                                          {claim.cause || 'General'}
                                        </div>
                                      </div>

                                      <div className="claim-actions sm:max-w-[280px] sm:justify-end">
                                        <button
                                          type="button"
                                          onClick={() => router.push(`/claims/new?claimId=${claim.id}`)}
                                          className="claim-action-btn claim-action-btn--open"
                                          aria-label="Open claim template"
                                          title="Open template"
                                        >
                                          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M7 17L17 7" />
                                            <path d="M9 7h8v8" />
                                          </svg>
                                        </button>
                                        <a
                                          href={`/print/${claim.id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="claim-action-btn claim-action-btn--print"
                                          aria-label="Print claim PDF"
                                          title="Print / PDF"
                                        >
                                          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M6 9V4h12v5" />
                                            <rect x="6" y="14" width="12" height="6" rx="1" />
                                            <rect x="4" y="9" width="16" height="7" rx="2" />
                                          </svg>
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setPendingClaimDeletion({ claimId: claim.id, patientName: patient.name })
                                          }}
                                          disabled={loading}
                                          className="claim-action-btn claim-action-btn--delete"
                                          aria-label="Delete claim"
                                          title="Delete claim"
                                        >
                                          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18" />
                                            <path d="M8 6V4h8v2" />
                                            <path d="M19 6l-1 14H6L5 6" />
                                            <path d="M10 11v6" />
                                            <path d="M14 11v6" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
                              <h5 className="text-lg font-semibold text-slate-950">No claims recorded yet</h5>
                              <p className="mt-2 text-sm text-slate-600">Create the first claim for this patient to start building reusable history.</p>
                            </div>
                          )}
                          </div>

                          <div className="surface-card p-5 min-w-0">
                            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                              <div>
                                <div className="eyebrow">Home visit notes</div>
                                <h4 className="mt-2 text-xl font-semibold text-slate-950">{patient.visitNotes?.length || 0} visit notes recorded</h4>
                                <p className="mt-1 text-xs text-slate-500">In-person home consultation notes you can open, download, or share by email / WhatsApp.</p>
                              </div>
                              <Link
                                href={`/visit-notes/new?patientId=${patient.id}`}
                                className="button-secondary self-start md:self-auto"
                              >
                                + New visit note
                              </Link>
                            </div>

                            {patient.visitNotes && patient.visitNotes.length > 0 ? (
                              <ul className="mt-5 space-y-2">
                                {patient.visitNotes.map((note) => (
                                  <li
                                    key={note.id}
                                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <div className="space-y-1 min-w-0">
                                      <div className="text-sm font-semibold text-slate-950">
                                        {formatDate(note.dateOfVisit || note.createdAt)}
                                        {note.visitTime ? ` • ${note.visitTime}` : ''}
                                      </div>
                                      {note.chiefComplaints && (
                                        <div className="text-xs text-slate-600 line-clamp-2">{note.chiefComplaints}</div>
                                      )}
                                      {note.doctorName && (
                                        <div className="text-[11px] text-slate-500">{note.doctorName}</div>
                                      )}
                                    </div>
                                    <div className="claim-actions sm:justify-end">
                                      <button
                                        type="button"
                                        onClick={() => router.push(`/visit-notes/new?visitNoteId=${note.id}`)}
                                        className="claim-action-btn claim-action-btn--open"
                                        aria-label="Open visit note"
                                        title="Open"
                                      >
                                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M7 17L17 7" />
                                          <path d="M9 7h8v8" />
                                        </svg>
                                      </button>
                                      <a
                                        href={`/api/visit-notes/${note.id}/download`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="claim-action-btn claim-action-btn--print"
                                        aria-label="Download visit note PDF"
                                        title="Download PDF"
                                      >
                                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M6 9V4h12v5" />
                                          <rect x="6" y="14" width="12" height="6" rx="1" />
                                          <rect x="4" y="9" width="16" height="7" rx="2" />
                                        </svg>
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => deleteVisitNote(note.id, patient.name)}
                                        disabled={loading}
                                        className="claim-action-btn claim-action-btn--delete"
                                        aria-label="Delete visit note"
                                        title="Delete visit note"
                                      >
                                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M3 6h18" />
                                          <path d="M8 6V4h8v2" />
                                          <path d="M19 6l-1 14H6L5 6" />
                                          <path d="M10 11v6" />
                                          <path d="M14 11v6" />
                                        </svg>
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 text-center">
                                <h5 className="text-base font-semibold text-slate-950">No visit notes yet</h5>
                                <p className="mt-2 text-sm text-slate-600">Capture the first home visit note to start building a history.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
