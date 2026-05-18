'use client'

import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'

interface PatientLite {
  id: string
  name: string
  cardNumber: string
}

interface VisitNoteItem {
  id: string
  shareToken?: string
  patientName?: string | null
  ageGender?: string | null
  dateOfVisit?: string | null
  visitTime?: string | null
  chiefComplaints?: string | null
  doctorName?: string | null
  createdAt: string
  patient?: PatientLite
}

const formatDate = (iso?: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function VisitNotesList() {
  const [items, setItems] = useState<VisitNoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    axios
      .get('/api/visit-notes')
      .then((res) => {
        if (!cancelled) setItems(res.data)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setError('Unable to load visit notes.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => {
      const haystack = [
        item.patient?.name,
        item.patient?.cardNumber,
        item.patientName,
        item.chiefComplaints,
        item.doctorName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [items, query])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this visit note? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await axios.delete(`/api/visit-notes/${id}`)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      console.error(err)
      alert('Failed to delete visit note.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="eyebrow">Home visit notes</div>
            <h1 className="section-title text-slate-950">All visit notes</h1>
            <p className="text-sm text-slate-600 md:text-base">
              Every doctor home visit note recorded across your patients.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/visit-notes/new" className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
              New visit note
            </Link>
            <Link href="/" className="button-secondary">Dashboard</Link>
          </div>
        </div>
      </section>

      <section className="surface-card p-4 md:p-5">
        <input
          type="search"
          placeholder="Search by patient, complaint or doctor…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
        />
      </section>

      {loading && (
        <div className="surface-card p-6 text-sm text-slate-500">Loading visit notes…</div>
      )}
      {error && !loading && (
        <div className="surface-card p-6 text-sm text-rose-600">{error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="surface-card p-8 text-center text-sm text-slate-500">
          No visit notes yet.{' '}
          <Link href="/visit-notes/new" className="text-sky-600 underline">Create one</Link>.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((item) => (
          <article key={item.id} className="surface-card p-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="text-base font-semibold text-slate-900">
                  {item.patient?.name || item.patientName || 'Patient'}
                </h3>
                {item.patient?.cardNumber && (
                  <span className="text-xs text-slate-500">• {item.patient.cardNumber}</span>
                )}
                {item.ageGender && (
                  <span className="text-xs text-slate-500">• {item.ageGender}</span>
                )}
              </div>
              <div className="text-xs text-slate-500">
                Visit {formatDate(item.dateOfVisit || item.createdAt)}
                {item.visitTime ? ` at ${item.visitTime}` : ''}
                {item.doctorName ? ` • ${item.doctorName}` : ''}
              </div>
              {item.chiefComplaints && (
                <p className="text-sm text-slate-700 line-clamp-2 md:max-w-2xl">
                  {item.chiefComplaints}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Link
                href={`/visit-notes/new?visitNoteId=${item.id}`}
                className="button-secondary"
              >
                Open
              </Link>
              <a
                href={`/api/visit-notes/${item.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="button-secondary"
              >
                PDF
              </a>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="inline-flex items-center justify-center rounded-md border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
              >
                {deletingId === item.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
