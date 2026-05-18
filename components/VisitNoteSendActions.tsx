'use client'

import React, { useEffect, useMemo, useState } from 'react'

interface VisitNoteSendActionsProps {
  shareToken: string
  patientContactNumber?: string
  patientName?: string
  doctorName?: string
  dateOfVisit?: string
}

function normalizeWhatsappNumber(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return ''
  if (raw.trim().startsWith('+')) return digits
  if (digits.startsWith('00')) return digits.slice(2)
  if (digits.startsWith('0') && digits.length === 10) return `971${digits.slice(1)}`
  return digits
}

export default function VisitNoteSendActions({
  shareToken,
  patientContactNumber,
  patientName,
  doctorName,
  dateOfVisit,
}: VisitNoteSendActionsProps) {
  const [origin, setOrigin] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientPhone, setRecipientPhone] = useState(patientContactNumber || '')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    if (patientContactNumber && !recipientPhone) {
      setRecipientPhone(patientContactNumber)
    }
  }, [patientContactNumber, recipientPhone])

  const publicPdfUrl = origin ? `${origin}/api/visit-notes/share/${shareToken}` : ''
  const inlinePreviewUrl = origin ? `${origin}/api/visit-notes/share/${shareToken}?inline=1` : ''

  const friendlyDate = useMemo(() => {
    if (!dateOfVisit) return ''
    const d = new Date(dateOfVisit)
    if (Number.isNaN(d.getTime())) return dateOfVisit
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }, [dateOfVisit])

  const messageBody = useMemo(() => {
    const lines = [
      `Dear ${patientName || 'patient'},`,
      '',
      `Please find the home visit note${friendlyDate ? ` from ${friendlyDate}` : ''} at the link below:`,
      publicPdfUrl,
      '',
      doctorName ? `Regards,\n${doctorName}` : 'Regards',
    ]
    return lines.join('\n')
  }, [patientName, friendlyDate, publicPdfUrl, doctorName])

  const mailto = useMemo(() => {
    const subject = `Doctor Home Visit Note${friendlyDate ? ` — ${friendlyDate}` : ''}`
    const params = new URLSearchParams({
      subject,
      body: messageBody,
    })
    return `mailto:${recipientEmail || ''}?${params.toString()}`
  }, [friendlyDate, messageBody, recipientEmail])

  const waLink = useMemo(() => {
    const number = normalizeWhatsappNumber(recipientPhone)
    const text = encodeURIComponent(messageBody)
    return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`
  }, [recipientPhone, messageBody])

  const handleCopyLink = async () => {
    if (!publicPdfUrl) return
    try {
      await navigator.clipboard.writeText(publicPdfUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed', err)
    }
  }

  return (
    <section className="surface-card p-6 md:p-7 space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-900">Send this visit note</h2>
        <p className="text-xs text-slate-500">
          The link below downloads the latest PDF version of this visit note. Anyone with the link can open it, so only share it with the intended recipient.
        </p>
      </div>

      <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700 break-all">
        {publicPdfUrl || 'Generating link…'}
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={inlinePreviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="button-secondary"
        >
          Open PDF
        </a>
        <button type="button" onClick={handleCopyLink} className="button-secondary">
          {copied ? 'Link copied!' : 'Copy link'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Send via email</label>
          <input
            type="email"
            className="border border-slate-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
            placeholder="patient@example.com (optional)"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
          <a
            href={mailto}
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Open in email app
          </a>
          <p className="text-[11px] text-slate-500">
            Opens your default mail client with the recipient, subject and message pre-filled. The PDF link is included in the body so the patient can download the file from any device.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Send via WhatsApp</label>
          <input
            type="tel"
            className="border border-slate-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
            placeholder="+9715xxxxxxxx (optional)"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
          />
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Open in WhatsApp
          </a>
          <p className="text-[11px] text-slate-500">
            Opens WhatsApp web / app with the recipient and message pre-filled. The PDF link in the message can be tapped to download.
          </p>
        </div>
      </div>
    </section>
  )
}
