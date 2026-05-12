'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Claim {
  id: string
  date: string
  symptoms: string
  cause: string
  createdAt: string
}

interface Patient {
  id: string
  cardNumber: string
  name: string
  birthDate?: string
  sex?: string
  policyNo?: string
  createdAt: string
  claims: Claim[]
}

export default function PatientsList() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    cardNumber: '',
    name: '',
    birthDate: '',
    sex: '',
    policyNo: '',
  })

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
    if (!confirm(`Delete claim? This action cannot be undone.`)) return

    try {
      setLoading(true)
      await axios.delete(`/api/claims/${claimId}`)
      fetchPatients()
    } catch (error) {
      console.error('Failed to delete claim:', error)
      alert('Error deleting claim. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const deletePatient = async (patientId: string, patientName: string) => {
    if (!confirm(`Delete patient "${patientName}" and all their claims? This action cannot be undone.`)) return

    try {
      setLoading(true)
      await axios.delete(`/api/patients/${patientId}`)
      setExpandedPatient(null)
      fetchPatients()
    } catch (error) {
      console.error('Failed to delete patient:', error)
      alert('Error deleting patient. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.cardNumber.trim() || !formData.name.trim()) {
      alert('Card Number and Name are required')
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
      setFormData({ cardNumber: '', name: '', birthDate: '', sex: '', policyNo: '' })
      setShowAddForm(false)
      fetchPatients()
      alert('Patient added successfully!')
    } catch (error: any) {
      console.error('Failed to add patient:', error)
      const errorMsg = error.response?.data?.error || 'Failed to add patient'
      alert(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 via-white to-amber-50 px-6 py-5 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 [font-family:var(--font-display),sans-serif]">Patients Registry</h1>
          <p className="text-sm text-slate-600 mt-1">Search patients instantly, inspect claim history, and download any claim PDF.</p>
        </div>

        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Patient Records</h2>
            <p className="text-gray-600 mt-1">View and manage all patients and their claims</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/claims/new"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              + Create Claim
            </Link>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              {showAddForm ? '✕ Cancel' : '+ Add Patient'}
            </button>
          </div>
        </div>

        {/* Add Patient Form */}
        {showAddForm && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow border-l-4 border-green-600">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Patient</h3>
            <form onSubmit={handleAddPatient}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Card Number *</label>
                  <input
                    type="text"
                    placeholder="e.g., AMS-2026-003"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Birth Date</label>
                  <input
                    type="date"
                    aria-label="Birth Date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Sex</label>
                  <select
                    aria-label="Sex"
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select...</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Policy Number</label>
                  <input
                    type="text"
                    placeholder="e.g., POL-2024-5403"
                    value={formData.policyNo}
                    onChange={(e) => setFormData({ ...formData, policyNo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 font-semibold"
                >
                  {loading ? 'Adding...' : 'Add Patient'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-900 rounded-md hover:bg-gray-400 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Search Patients</label>
          <input
            type="text"
            placeholder="Search by card number, name, or policy number..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <p className="text-sm text-gray-600 mt-2">
              Found <strong>{filteredPatients.length}</strong> patient{filteredPatients.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Patients</div>
            <div className="text-3xl font-bold text-gray-900">{patients.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Claims</div>
            <div className="text-3xl font-bold text-gray-900">
              {patients.reduce((sum, p) => sum + (p.claims?.length || 0), 0)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Displayed</div>
            <div className="text-3xl font-bold text-gray-900">{filteredPatients.length}</div>
          </div>
        </div>

        {/* Patients List */}
        {loading ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">Loading patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600 text-lg">
              {patients.length === 0 ? 'No patients found' : 'No patients match your search'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="bg-white rounded-lg border border-slate-200 shadow hover:shadow-lg transition">
                <button
                  onClick={() => toggleExpanded(patient.id)}
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-lg">{patient.name}</div>
                    <div className="text-sm text-gray-600 mt-1 space-x-3">
                      <span>
                        <strong>Card:</strong> {patient.cardNumber}
                      </span>
                      {patient.policyNo && (
                        <span>
                          <strong>Policy:</strong> {patient.policyNo}
                        </span>
                      )}
                      <span>
                        <strong>Claims:</strong> {patient.claims?.length || 0}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {expandedPatient === patient.id ? '▼' : '▶'}
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedPatient === patient.id && (
                  <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Full Name</label>
                        <p className="text-gray-900 font-medium">{patient.name}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Card Number</label>
                        <p className="text-gray-900 font-medium">{patient.cardNumber}</p>
                      </div>
                      {patient.birthDate && (
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Birth Date</label>
                          <p className="text-gray-900 font-medium">{patient.birthDate}</p>
                        </div>
                      )}
                      {patient.sex && (
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Sex</label>
                          <p className="text-gray-900 font-medium">{patient.sex === 'M' ? 'Male' : 'Female'}</p>
                        </div>
                      )}
                      {patient.policyNo && (
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Policy Number</label>
                          <p className="text-gray-900 font-medium">{patient.policyNo}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Member Since</label>
                        <p className="text-gray-900 font-medium">{new Date(patient.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Claims Table */}
                    {patient.claims && patient.claims.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Claim History ({patient.claims.length})</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border border-gray-300 rounded">
                            <thead className="bg-gray-200">
                              <tr>
                                <th className="px-4 py-2 text-left text-gray-900 font-semibold border-b">Date</th>
                                <th className="px-4 py-2 text-left text-gray-900 font-semibold border-b">Symptoms / Cause</th>
                                <th className="px-4 py-2 text-left text-gray-900 font-semibold border-b">Reason</th>
                                <th className="px-4 py-2 text-left text-gray-900 font-semibold border-b">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patient.claims.map((claim, idx) => (
                                <tr
                                  key={claim.id}
                                  className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-teal-50`}
                                  onClick={() => router.push(`/claims/new?claimId=${claim.id}`)}
                                  title="Open this claim as prefilled form"
                                >
                                  <td className="px-4 py-2 border-b text-gray-700">
                                    {new Date(claim.date || claim.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-2 border-b text-gray-700">
                                    {claim.symptoms?.substring(0, 40)}
                                    {claim.symptoms && claim.symptoms.length > 40 ? '...' : ''}
                                  </td>
                                  <td className="px-4 py-2 border-b text-gray-700">
                                    {claim.cause || 'General'}
                                  </td>
                                  <td className="px-4 py-2 border-b text-gray-700">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/claims/new?claimId=${claim.id}`)
                                      }}
                                      className="mr-2 inline-flex items-center rounded bg-teal-600 px-2 py-1 text-xs font-semibold text-white hover:bg-teal-700"
                                    >
                                      Open
                                    </button>
                                    <a
                                      href={`/print/${claim.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="mr-2 inline-flex items-center rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                                    >
                                      Download PDF
                                    </a>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteClaim(claim.id, patient.name)
                                      }}
                                      disabled={loading}
                                      className="inline-flex items-center rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-gray-400"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {/* Delete Patient Button */}
                    <div className="mt-6 pt-4 border-t border-gray-300">
                      <button
                        type="button"
                        onClick={() => deletePatient(patient.id, patient.name)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 font-semibold text-sm"
                      >
                        {loading ? 'Deleting...' : 'Delete Patient & All Claims'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
