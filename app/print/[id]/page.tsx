'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type ClaimResponse = {
  id: string
  date?: string
  provider?: string
  serviceDate?: string
  symptoms?: string
  preExistingCondition?: boolean
  chronicMedications?: boolean
  familyHistory?: boolean
  additionalNotes?: string
  clinicalFindings?: string
  cause?: string
  otherCause?: string
  assessmentAcute?: boolean
  assessmentChronic?: boolean
  assessmentConfirmed?: boolean
  assessmentSuspected?: boolean
  comments?: string
  consultation?: boolean
  physiotherapy?: boolean
  laboratory?: boolean
  radiology?: boolean
  pharmacy?: boolean
  otherMedical?: string
  preAuthorizationDetails?: string
  proposedTreatment?: string
  estimatedCost?: string
  approvedTariff?: boolean
  approvalCode?: string
  lengthOfStay?: string
  inPatientProvider?: string
  inPatientCost?: string
  treatingPhysicianName?: string
  telFax?: string
  signature?: string
  physicianSignature?: string
  patient?: {
    name?: string
    cardNumber?: string
    policyNo?: string
    birthDate?: string
    sex?: string
  }
}

const fmtDate = (value?: string) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-GB')
}

const mark = (value?: boolean) => (value ? 'X' : '')

function Check({ checked, label }: { checked?: boolean; label: string }) {
  return (
    <span className="check-item">
      <span className="check-mark" aria-hidden="true">{checked ? '☒' : '☐'}</span>
      <span>{label}</span>
    </span>
  )
}

type FontCategory = 'Handwriting' | 'Sans-serif' | 'Serif' | 'Monospace'

type FontOption = {
  id: string
  label: string
  cssFamily: string
  /** Google Fonts CSS query fragment. Omit for system/web-safe fonts that don't need loading. */
  google?: string
  fallback: string
  size: string
  category: FontCategory
}

const FONT_OPTIONS: FontOption[] = [
  // Handwriting (filled-form feel)
  { id: 'patrick-hand',     label: 'Patrick Hand (neat handwriting)',  cssFamily: 'Patrick Hand',         google: 'Patrick+Hand',                  fallback: 'cursive',    size: '13px',   category: 'Handwriting' },
  { id: 'caveat',           label: 'Caveat (cursive handwriting)',     cssFamily: 'Caveat',               google: 'Caveat:wght@400;600',           fallback: 'cursive',    size: '15px',   category: 'Handwriting' },
  { id: 'kalam',            label: 'Kalam (clean handwriting)',        cssFamily: 'Kalam',                google: 'Kalam:wght@300;400',            fallback: 'cursive',    size: '12.5px', category: 'Handwriting' },
  { id: 'architects',       label: "Architects Daughter (block hand)", cssFamily: 'Architects Daughter',  google: 'Architects+Daughter',           fallback: 'cursive',    size: '12px',   category: 'Handwriting' },
  { id: 'indie-flower',     label: 'Indie Flower (rounded hand)',      cssFamily: 'Indie Flower',         google: 'Indie+Flower',                  fallback: 'cursive',    size: '13px',   category: 'Handwriting' },
  { id: 'reenie-beanie',    label: 'Reenie Beanie (loose hand)',       cssFamily: 'Reenie Beanie',        google: 'Reenie+Beanie',                 fallback: 'cursive',    size: '15px',   category: 'Handwriting' },
  { id: 'shadows',          label: 'Shadows Into Light (light hand)',  cssFamily: 'Shadows Into Light',   google: 'Shadows+Into+Light',            fallback: 'cursive',    size: '13px',   category: 'Handwriting' },
  { id: 'homemade-apple',   label: 'Homemade Apple (formal script)',   cssFamily: 'Homemade Apple',       google: 'Homemade+Apple',                fallback: 'cursive',    size: '11px',   category: 'Handwriting' },
  { id: 'dancing-script',   label: 'Dancing Script (flowing script)',  cssFamily: 'Dancing Script',       google: 'Dancing+Script:wght@400;500',   fallback: 'cursive',    size: '14px',   category: 'Handwriting' },

  // Sans-serif (standard professional) — system/web-safe first, then Google
  { id: 'ibm-plex-sans',    label: 'IBM Plex Sans (default)',          cssFamily: 'IBM Plex Sans',                                                 fallback: '-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif', size: '10.5px', category: 'Sans-serif' },
  { id: 'arial',            label: 'Arial (system)',                   cssFamily: 'Arial',                                                         fallback: 'Helvetica, sans-serif', size: '10.5px', category: 'Sans-serif' },
  { id: 'helvetica',        label: 'Helvetica (system)',               cssFamily: 'Helvetica',                                                     fallback: 'Arial, sans-serif',     size: '10.5px', category: 'Sans-serif' },
  { id: 'system-sans',      label: 'System Sans-serif',                cssFamily: 'system-ui',                                                     fallback: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif', size: '10.5px', category: 'Sans-serif' },
  { id: 'inter',            label: 'Inter',                            cssFamily: 'Inter',                google: 'Inter:wght@400;500;600',        fallback: 'sans-serif', size: '10.5px', category: 'Sans-serif' },
  { id: 'roboto',           label: 'Roboto',                           cssFamily: 'Roboto',               google: 'Roboto:wght@400;500',           fallback: 'sans-serif', size: '10.5px', category: 'Sans-serif' },
  { id: 'open-sans',        label: 'Open Sans',                        cssFamily: 'Open Sans',            google: 'Open+Sans:wght@400;600',        fallback: 'sans-serif', size: '10.5px', category: 'Sans-serif' },
  { id: 'lato',             label: 'Lato',                             cssFamily: 'Lato',                 google: 'Lato:wght@400;700',             fallback: 'sans-serif', size: '10.5px', category: 'Sans-serif' },
  { id: 'source-sans-3',    label: 'Source Sans 3',                    cssFamily: 'Source Sans 3',        google: 'Source+Sans+3:wght@400;600',    fallback: 'sans-serif', size: '10.5px', category: 'Sans-serif' },
  { id: 'work-sans',        label: 'Work Sans',                        cssFamily: 'Work Sans',            google: 'Work+Sans:wght@400;500',        fallback: 'sans-serif', size: '10.5px', category: 'Sans-serif' },
  { id: 'noto-sans',        label: 'Noto Sans',                        cssFamily: 'Noto Sans',            google: 'Noto+Sans:wght@400;500',        fallback: 'sans-serif', size: '10.5px', category: 'Sans-serif' },
  { id: 'nunito',           label: 'Nunito (rounded)',                 cssFamily: 'Nunito',               google: 'Nunito:wght@400;600',           fallback: 'sans-serif', size: '10.5px', category: 'Sans-serif' },
  { id: 'manrope',          label: 'Manrope',                          cssFamily: 'Manrope',              google: 'Manrope:wght@400;500;700',      fallback: 'sans-serif', size: '10.5px', category: 'Sans-serif' },

  // Serif (formal documents)
  { id: 'lora',             label: 'Lora',                             cssFamily: 'Lora',                 google: 'Lora:wght@400;600',             fallback: 'serif',      size: '10.5px', category: 'Serif' },
  { id: 'pt-serif',         label: 'PT Serif',                         cssFamily: 'PT Serif',             google: 'PT+Serif:wght@400;700',         fallback: 'serif',      size: '10.5px', category: 'Serif' },
  { id: 'merriweather',     label: 'Merriweather',                     cssFamily: 'Merriweather',         google: 'Merriweather:wght@400;700',     fallback: 'serif',      size: '10px',   category: 'Serif' },
  { id: 'source-serif-4',   label: 'Source Serif 4',                   cssFamily: 'Source Serif 4',       google: 'Source+Serif+4:wght@400;600',   fallback: 'serif',      size: '10.5px', category: 'Serif' },
  { id: 'libre-baskerville',label: 'Libre Baskerville',                cssFamily: 'Libre Baskerville',    google: 'Libre+Baskerville:wght@400;700',fallback: 'serif',      size: '10px',   category: 'Serif' },
  { id: 'eb-garamond',      label: 'EB Garamond (classic)',            cssFamily: 'EB Garamond',          google: 'EB+Garamond:wght@400;500;700',  fallback: 'serif',      size: '11.5px', category: 'Serif' },
  { id: 'crimson-pro',      label: 'Crimson Pro (book)',               cssFamily: 'Crimson Pro',          google: 'Crimson+Pro:wght@400;600',      fallback: 'serif',      size: '11px',   category: 'Serif' },
  { id: 'playfair',         label: 'Playfair Display (high contrast)', cssFamily: 'Playfair Display',     google: 'Playfair+Display:wght@400;600', fallback: 'serif',      size: '10.5px', category: 'Serif' },
  { id: 'roboto-slab',      label: 'Roboto Slab (slab serif)',         cssFamily: 'Roboto Slab',          google: 'Roboto+Slab:wght@400;600',      fallback: 'serif',      size: '10.5px', category: 'Serif' },

  // Monospace (typewriter / data feel)
  { id: 'roboto-mono',      label: 'Roboto Mono',                      cssFamily: 'Roboto Mono',          google: 'Roboto+Mono:wght@400;500',      fallback: 'monospace',  size: '10px',   category: 'Monospace' },
  { id: 'courier-prime',    label: 'Courier Prime (typewriter)',       cssFamily: 'Courier Prime',        google: 'Courier+Prime:wght@400;700',    fallback: 'monospace',  size: '10.5px', category: 'Monospace' },
  { id: 'ibm-plex-mono',    label: 'IBM Plex Mono',                    cssFamily: 'IBM Plex Mono',        google: 'IBM+Plex+Mono:wght@400;500',    fallback: 'monospace',  size: '10px',   category: 'Monospace' },
  { id: 'jetbrains-mono',   label: 'JetBrains Mono',                   cssFamily: 'JetBrains Mono',       google: 'JetBrains+Mono:wght@400;500',   fallback: 'monospace',  size: '10px',   category: 'Monospace' },
  { id: 'space-mono',       label: 'Space Mono',                       cssFamily: 'Space Mono',           google: 'Space+Mono:wght@400;700',       fallback: 'monospace',  size: '10px',   category: 'Monospace' },
]

const FONT_CATEGORIES: FontCategory[] = ['Handwriting', 'Sans-serif', 'Serif', 'Monospace']

const DEFAULT_FONT_ID = 'ibm-plex-sans'
const DEFAULT_FONT_COLOR = '#111111'
const FONT_STORAGE_KEY = 'claim-print:fill-font'
const FONT_SIZE_STORAGE_KEY = 'claim-print:fill-size'
const FONT_COLOR_STORAGE_KEY = 'claim-print:fill-color'
const MIN_FONT_SIZE = 8
const MAX_FONT_SIZE = 24
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

const parsePx = (value: string) => parseFloat(value.replace('px', '')) || 13
const clampSize = (value: number) =>
  Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Number.isFinite(value) ? value : 13))

export default function PrintClaimPage() {
  const params = useParams<{ id: string }>()
  const claimId = params?.id
  const [claim, setClaim] = useState<ClaimResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedFontId, setSelectedFontId] = useState<string>(DEFAULT_FONT_ID)
  const [fontSize, setFontSize] = useState<number>(() =>
    parsePx(FONT_OPTIONS.find((o) => o.id === DEFAULT_FONT_ID)?.size || '13px')
  )
  const [fontColor, setFontColor] = useState<string>(DEFAULT_FONT_COLOR)

  useEffect(() => {
    try {
      const storedFont = window.localStorage.getItem(FONT_STORAGE_KEY)
      if (storedFont && FONT_OPTIONS.some((opt) => opt.id === storedFont)) {
        setSelectedFontId(storedFont)
      }
      const storedSize = window.localStorage.getItem(FONT_SIZE_STORAGE_KEY)
      if (storedSize) {
        const parsed = parseFloat(storedSize)
        if (Number.isFinite(parsed)) setFontSize(clampSize(parsed))
      }
      const storedColor = window.localStorage.getItem(FONT_COLOR_STORAGE_KEY)
      if (storedColor && HEX_COLOR_RE.test(storedColor)) {
        setFontColor(storedColor)
      }
    } catch {
      // ignore storage access errors (private mode, etc.)
    }
  }, [])

  useEffect(() => {
    const opt = FONT_OPTIONS.find((o) => o.id === selectedFontId)
    if (!opt) return
    if (opt.google) {
      const linkId = `font-loader-${opt.id}`
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        link.href = `https://fonts.googleapis.com/css2?family=${opt.google}&display=swap`
        document.head.appendChild(link)
      }
    }
    try {
      window.localStorage.setItem(FONT_STORAGE_KEY, opt.id)
    } catch {
      // ignore storage access errors
    }
  }, [selectedFontId])

  useEffect(() => {
    try {
      window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(fontSize))
    } catch {
      // ignore storage access errors
    }
  }, [fontSize])

  useEffect(() => {
    if (!HEX_COLOR_RE.test(fontColor)) return
    try {
      window.localStorage.setItem(FONT_COLOR_STORAGE_KEY, fontColor)
    } catch {
      // ignore storage access errors
    }
  }, [fontColor])

  const activeFont = useMemo(
    () => FONT_OPTIONS.find((o) => o.id === selectedFontId) || FONT_OPTIONS[0],
    [selectedFontId]
  )

  const handleFontChange = (id: string) => {
    setSelectedFontId(id)
    const opt = FONT_OPTIONS.find((o) => o.id === id)
    if (opt) setFontSize(clampSize(parsePx(opt.size)))
  }

  const handleSizeChange = (value: number) => {
    setFontSize(clampSize(value))
  }

  const handleResetSize = () => {
    setFontSize(clampSize(parsePx(activeFont.size)))
  }

  const handleColorChange = (value: string) => {
    if (HEX_COLOR_RE.test(value)) setFontColor(value)
  }

  const handleResetColor = () => {
    setFontColor(DEFAULT_FONT_COLOR)
  }

  const fontStyleVars = {
    ['--font-fill-active' as string]: `'${activeFont.cssFamily}', ${activeFont.fallback}`,
    ['--font-fill-size' as string]: `${fontSize}px`,
    ['--font-fill-color' as string]: fontColor,
  } as React.CSSProperties

  useEffect(() => {
    if (!claimId) return
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/claims/${claimId}`, { cache: 'no-store' })
        if (!res.ok) {
          throw new Error('CLAIM_LOAD_FAILED')
        }
        const data = (await res.json()) as ClaimResponse
        setClaim(data)
      } catch {
        setError('Unable to load claim details.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [claimId])

  const cause = useMemo(() => (claim?.cause || '').toLowerCase(), [claim?.cause])

  return (
    <>
      {loading && <div className="page-state">Loading print view...</div>}
      {!loading && (error || !claim) && <div className="page-state">{error || 'Claim not found.'}</div>}

      {!loading && !error && claim && (
        <>
          <div className="toolbar no-print">
            <button className="primary" onClick={() => window.print()}>Download PDF</button>
            <label className="font-picker">
              <span className="font-picker__label">Field font</span>
              <select
                className="font-picker__select"
                value={selectedFontId}
                onChange={(e) => handleFontChange(e.target.value)}
              >
                {FONT_CATEGORIES.map((category) => {
                  const opts = FONT_OPTIONS.filter((o) => o.category === category)
                  if (opts.length === 0) return null
                  return (
                    <optgroup key={category} label={category}>
                      {opts.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>
            </label>
            <label className="font-picker">
              <span className="font-picker__label">Size</span>
              <input
                className="font-picker__size-input"
                type="number"
                min={MIN_FONT_SIZE}
                max={MAX_FONT_SIZE}
                step={0.5}
                value={fontSize}
                onChange={(e) => handleSizeChange(parseFloat(e.target.value))}
              />
              <span className="font-picker__unit">px</span>
              <button
                type="button"
                className="font-picker__reset"
                onClick={handleResetSize}
                title={`Reset to ${activeFont.label} default (${activeFont.size})`}
              >
                Reset
              </button>
            </label>
            <label className="font-picker">
              <span className="font-picker__label">Color</span>
              <input
                className="font-picker__color-input"
                type="color"
                value={fontColor}
                onChange={(e) => handleColorChange(e.target.value)}
                aria-label="Field text color"
              />
              <input
                className="font-picker__color-hex"
                type="text"
                value={fontColor}
                onChange={(e) => {
                  const next = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
                  handleColorChange(next)
                }}
                maxLength={7}
                aria-label="Field text color hex value"
              />
              <button
                type="button"
                className="font-picker__reset"
                onClick={handleResetColor}
                title={`Reset to default (${DEFAULT_FONT_COLOR})`}
              >
                Reset
              </button>
            </label>
            <Link href={`/claims/new?claimId=${claim.id}`} className="btn-link back-btn" title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </Link>
          </div>

          <div className="page-wrap" style={fontStyleVars}>
            <div className="page" id="formPage">
              <div className="top">
                <div className="logo-block">
                  <img src="/logo_original.svg" alt="ALMADALLAH" className="logo-image" />
                </div>
                <div className="title">Claim Form</div>
                <div className="no">No.</div>
              </div>

              <table className="form" aria-label="Claim form print layout">
                <colgroup>
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '24%' }} />
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '24%' }} />
                </colgroup>
                <tbody>
                  <tr>
                    <td><span className="label">Date:</span> <span className="data-fill">{fmtDate(claim.date)}</span></td>
                    <td colSpan={3} className="provider-cell">
                      <span className="label">Provider:</span> {claim.provider || ''}
                      <span className="caret" aria-hidden="true">⌄</span>
                    </td>
                  </tr>

                  <tr><td colSpan={4} className="section">PATIENT INFORMATION</td></tr>

                  <tr>
                    <td colSpan={3}>
                      <span className="label">Patient&apos;s Name(as on card):</span> <span className="data-fill">{claim.patient?.name || ''}</span>
                    </td>
                    <td>&nbsp;</td>
                  </tr>

                  <tr>
                    <td><span className="label">Card #</span> <span className="data-fill">{claim.patient?.cardNumber || ''}</span></td>
                    <td><span className="label">policy No.</span> {claim.patient?.policyNo || ''}</td>
                    <td><span className="label">BirthDate:</span> <span className="data-fill">{fmtDate(claim.patient?.birthDate)}</span></td>
                    <td><span className="label">Sex:</span> <span className="data-fill">{claim.patient?.sex || ''}</span></td>
                  </tr>

                  <tr>
                    <td colSpan={2} className="subsection">INFORMATION</td>
                    <td colSpan={2} className="subsection right-note">To be completed by physician</td>
                  </tr>

                  <tr className="row-lg">
                    <td className="lh18">
                      <div className="field-row">
                        <span className="label">Service<br />Date</span>
                        <div className="value">{fmtDate(claim.serviceDate)}</div>
                      </div>
                    </td>
                    <td colSpan={3}>
                      <div className="field-row">
                        <span className="label nowrap2">Symptom(s) as described by<br />patient:</span>
                        <div className="pre value data-fill">{claim.symptoms || ''}</div>
                      </div>
                    </td>
                  </tr>

                  <tr className="row-xl">
                    <td colSpan={2} className="p3">
                      <div className="checks">
                        <Check checked={claim.preExistingCondition} label="Pre-existing Condition(s) being treated" />
                        <Check checked={claim.chronicMedications} label="Chronic Medications" />
                        <Check checked={claim.familyHistory} label="Family History of any Illness" />
                      </div>
                    </td>
                    <td colSpan={2} className="p3">
                      <div className="field-row">
                        <span className="label">If Yes<br />Specify:</span>
                        <div className="pre value data-fill">{claim.additionalNotes || ''}</div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={2} className="subsection">OBJECTIVE/ASSESSMENT</td>
                    <td colSpan={2} className="subsection right-note">To be completed by physician</td>
                  </tr>

                  <tr className="row-xl">
                    <td colSpan={4} className="lh18">
                      <div className="field-row">
                        <span className="label">Clinical<br />Findings:</span>
                        <div className="pre value data-fill">{claim.clinicalFindings || ''}</div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={4} className="cause-row">
                      <div className="row-checks">
                        <span className="label">Cause</span>
                        <Check checked={cause === 'accident'} label="Accident" />
                        <Check checked={cause === 'dental'} label="Dental" />
                        <Check checked={cause === 'maternity'} label="Maternity" />
                        <Check checked={cause === 'physical illness'} label="Physical Illness" />
                        <Check checked={cause === 'preventive'} label="Preventive" />
                        <Check checked={cause === 'psychiatry'} label="Psychiatry" />
                        <Check checked={cause === 'work related'} label="Work Related" />
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={4} className="lh18 other-explain-cell">
                      <div className="field-row">
                        <span className="label">Other(s), Explain</span>
                        <div className="pre value">{claim.otherCause || ''}</div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={4} className="assessment-row">
                      <div className="row-checks">
                        <span className="label-bold">Assessment /Diagnosis</span>
                        <Check checked={claim.assessmentAcute} label="Acute" />
                        <Check checked={claim.assessmentChronic} label="Chronic" />
                        <Check checked={claim.assessmentConfirmed} label="Confirmed" />
                        <Check checked={claim.assessmentSuspected} label="Suspected" />
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={4} className="lh18 comments-cell">
                      <div className="field-row">
                        <span className="label">Comments</span>
                        <div className="pre value data-fill">{claim.comments || ''}</div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={4} className="subsection band-tight">
                      <div className="sh">MEDICAL PLAN</div>
                      <div className="sh-note">Itemized orginal Invoices &amp; Applicable Prescriprions/Reports/Results Must be enclosed to consider the claim</div>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={3} className="med-checks-cell">
                      <div className="row-checks">
                        <Check checked={claim.consultation} label="Consultation" />
                        <Check checked={claim.physiotherapy} label="Physiotherapy" />
                        <Check checked={claim.laboratory} label="Laboratory" />
                        <Check checked={claim.radiology} label="Radiology" />
                        <Check checked={claim.pharmacy} label="Pharmacy" />
                        <Check checked={Boolean(claim.otherMedical)} label={`Other${claim.otherMedical ? `: ${claim.otherMedical}` : ''}`} />
                      </div>
                    </td>
                    <td>&nbsp;</td>
                  </tr>

                  <tr>
                    <td colSpan={2} className="pre-auth-cell">
                      <div className="pre-auth-head">
                        <div>Pre Authorization</div>
                        <div>Required for:</div>
                      </div>
                      <div className="pre box med-plan-pre">{claim.preAuthorizationDetails || ''}</div>
                    </td>
                    <td colSpan={2} rowSpan={3} className="almadallah-stack-cell">
                      <div className="use-only-h-strip">For Almadallah&apos;s Use Only</div>
                      <div className="use-only-line">As per agreed tariff {mark(claim.approvedTariff)}</div>
                      <div className="use-only-line"><span className="label">ApprovalCode:</span> {claim.approvalCode || ''}</div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="full-details-cell">
                      <div>
                        <span className="label">Full details of proposed treatment/ Surgery/ Medicine:</span>
                      </div>
                      <div className="pre box tall data-fill">{claim.proposedTreatment || ''}</div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="est-cost-cell">
                      <span className="label">EstimatedCost</span> {claim.estimatedCost || ''}
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={4} className="subsection band-tight">
                      <div className="sh">IN-PATIENT</div>
                      <div className="sh-note">Discharge summary, Itemized Invoices, Report, Results should be attched</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="in-patient-cell-first">
                      <span className="label">Length of stay</span> {claim.lengthOfStay || ''}
                    </td>
                    <td colSpan={2} className="in-patient-cell-provider">
                      <span className="label">Provider</span> {claim.inPatientProvider || ''}
                    </td>
                    <td className="in-patient-cell-cost">
                      <span className="label">Cost</span> {claim.inPatientCost || ''}
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={4} className="consent">
                      The above information is true to the best of my knowledge. I hereby authorize any Healthcare Provider, Insurer, Employer or other Organization to release any information regarding my medical conditions &amp; history to ALMADALLAH for the purpose of determining insurance benefits
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={2} className="phys-cell">
                      <span className="label-bold">Treating Physician Name:</span> <span className="data-fill">{claim.treatingPhysicianName || ''}</span>
                    </td>
                    <td colSpan={2} rowSpan={3} className="patient-sig-cell">
                      <div className="patient-sig-label"><em><strong>Patient/Guardian signature</strong></em></div>
                      {claim.signature ? (
                        <img src={claim.signature} alt="Patient or guardian signature" className="patient-sig-img" />
                      ) : null}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="phys-cell">
                      <span className="label-bold">Tel/Fax</span>
                      <span className="telfax-underline">{claim.telFax || ''}</span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="phys-cell sig-stamp-cell">
                      <div className="sig-stamp-row">
                        <span className="label sig-stamp-label">Signature and stamp</span>
                        {claim.physicianSignature ? (
                          <img src={claim.physicianSignature} alt="Physician signature" className="sig-stamp-img" />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="phys-cell date-cell"><span className="label">Date</span> <span className="data-fill">{fmtDate(claim.date)}</span></td>
                    <td colSpan={2} className="date-cell"><span className="label">Date</span> <span className="data-fill">{fmtDate(claim.date)}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        :global(body){ margin:0; background:#fff; font-family: Arial, Helvetica, sans-serif; color:#1f1f1f; }
        :global(.app-header){ display:none !important; }
        :global(.app-main){ padding:0 !important; }
        :global(.app-main__inner){ max-width:none !important; padding:0 !important; }
        .toolbar{ position:sticky; top:0; z-index:20; background:white; border-bottom:1px solid #ddd; padding:10px 14px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .toolbar button, .btn-link{ border:1px solid #cfcfcf; background:#fff; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:600; color:#111; text-decoration:none; }
        .toolbar button.primary{ background:#111827; color:#fff; border-color:#111827; }
        .font-picker{ display:flex; align-items:center; gap:6px; padding:0 4px; }
        .font-picker__label{ font-size:12px; font-weight:600; color:#374151; text-transform:uppercase; letter-spacing:0.06em; }
        .font-picker__select{ border:1px solid #cfcfcf; background:#fff; padding:7px 10px; border-radius:8px; font-size:13px; font-weight:500; color:#111; cursor:pointer; min-width:240px; }
        .font-picker__select:focus{ outline:2px solid #2563eb; outline-offset:1px; }
        .font-picker__size-input{ border:1px solid #cfcfcf; background:#fff; padding:7px 8px; border-radius:8px; font-size:13px; font-weight:500; color:#111; width:72px; text-align:center; }
        .font-picker__size-input:focus{ outline:2px solid #2563eb; outline-offset:1px; }
        .font-picker__unit{ font-size:12px; color:#6b7280; font-weight:600; }
        .font-picker__color-input{ width:36px; height:36px; border:1px solid #cfcfcf; border-radius:8px; padding:2px; cursor:pointer; background:#fff; }
        .font-picker__color-input::-webkit-color-swatch-wrapper{ padding:0; }
        .font-picker__color-input::-webkit-color-swatch{ border:none; border-radius:6px; }
        .font-picker__color-input::-moz-color-swatch{ border:none; border-radius:6px; }
        .font-picker__color-input:focus{ outline:2px solid #2563eb; outline-offset:1px; }
        .font-picker__color-hex{ border:1px solid #cfcfcf; background:#fff; padding:7px 8px; border-radius:8px; font-size:12px; font-weight:500; color:#111; width:88px; text-align:center; font-family:'SFMono-Regular','Menlo','Monaco',monospace; text-transform:uppercase; }
        .font-picker__color-hex:focus{ outline:2px solid #2563eb; outline-offset:1px; }
        .font-picker__reset{ border:1px solid #cfcfcf; background:#f9fafb; padding:6px 10px; border-radius:8px; font-size:12px; font-weight:600; color:#374151; cursor:pointer; }
        .font-picker__reset:hover{ background:#f3f4f6; }
        .back-btn{ margin-left:auto; display:flex; align-items:center; justify-content:center; width:38px; height:38px; padding:0; }
        .page-state{ padding:24px; }

        .page-wrap{ padding:0; display:flex; justify-content:center; }
        .page{ width:210mm; min-height:297mm; background:#fff; border:none; box-shadow:none; padding:8mm 8mm 9mm; box-sizing:border-box; }
        .top{ display:grid; grid-template-columns:1fr auto 1fr; align-items:start; column-gap:8px; margin-bottom:2mm; }
        .logo-block{ display:flex; align-items:flex-start; margin-top:2px; }
        .logo-image{ height:54px; width:auto; object-fit:contain; }
        .title{ text-align:center; font-weight:700; font-size:22px; line-height:1.1; margin-top:6px; color:#1c1c1c; }
        .no{ text-align:center; font-size:12px; font-weight:700; margin-top:6px; padding-right:6px; }

        table.form{ width:100%; border-collapse:collapse; margin-top:1mm; font-size:11.5px; table-layout:fixed; border:1px solid #888; }
        table.form td{ border:1px solid #888; vertical-align:top; padding:5px 7px; word-break:break-word; background:#fff; }

        /* Active font for the dynamic database values, controlled by the toolbar picker */
        .data-fill{ font-family: var(--font-fill-active, 'Patrick Hand', cursive); font-size: var(--font-fill-size, 13px); font-weight: 400; color: var(--font-fill-color, #111); letter-spacing:0.2px; }

        .provider-cell{ position:relative; padding-right:20px !important; }
        .provider-cell .caret{ position:absolute; right:8px; top:3px; font-size:14px; color:#666; line-height:1; }

        .row-lg td{ height:46px; }
        .row-xl td{ height:62px; }

        table.form td.section{ background:#ecd4bb !important; text-align:center; font-weight:700; letter-spacing:1.2px; color:#1f1f1f; font-size:11px; padding:5px 8px !important; font-family: 'Hoxton', var(--font-section), 'Manrope', system-ui, sans-serif; line-height:1.3; }
        .subsection{ background:#ecd4bb !important; font-weight:700; color:#1f1f1f; font-size:11px; padding:4px 8px !important; }
        .band-tight{ padding:3px 8px 2px 8px !important; }
        .sh{ font-weight:700; font-size:10.5px; letter-spacing:0.4px; }
        .sh-note{ font-style:italic; font-size:9px; font-weight:400; color:#3a3a3a; margin-top:1px; }
        .right-note{ text-align:center; font-weight:400; font-style:italic; color:#444; font-size:9.5px; border-left:none !important; }
        table.form td.subsection:has(+ td.right-note){ border-right:none !important; }
        table.form td.assessment-row{ border-bottom:none !important; }
        table.form td.comments-cell{ border-top:none !important; }
        table.form td.cause-row{ border-bottom:none !important; }
        table.form td.other-explain-cell{ border-top:none !important; }

        .label{ font-weight:400; }
        .label-bold{ font-weight:700; }
        .italic{ font-style:italic; }
        .lh18{ line-height:1.6; }
        .p3{ padding:6px 8px !important; }
        .nowrap2{ white-space:normal; }

        .checks{ display:flex; flex-direction:column; gap:4px; }
        .row-checks{ display:flex; flex-wrap:wrap; align-items:center; column-gap:8px; row-gap:4px; }
        .check-item{ display:inline-flex; align-items:center; margin-right:6px; margin-bottom:2px; white-space:nowrap; gap:3px; }
        .check-mark{ font-size:11px; line-height:1; color:#1f1f1f; }

        .pre{ white-space:pre-wrap; line-height:1.25; }

        .field-row{ display:flex; gap:10px; align-items:flex-start; }
        .field-row > .label{ flex:0 0 auto; line-height:1.25; }
        .field-row > .value{ flex:1 1 auto; min-width:0; min-height:18px; }

        .box{ min-height:32px; }
        .box.tall{ min-height:74px; }

        .med-checks-cell{ border-right:none !important; }
        .med-checks-cell + td{ border-left:none !important; }

        .pre-auth-cell{ vertical-align:top; border-bottom:none !important; }
        .pre-auth-head{ line-height:1.3; font-size:11.5px; margin-bottom:4px; }
        .med-plan-pre{ min-height:24px; }
        .full-details-cell{ vertical-align:top; border-top:none !important; border-bottom:none !important; }
        .est-cost-cell{ vertical-align:bottom; padding:8px 7px !important; border-top:none !important; }

        .almadallah-stack-cell{ vertical-align:top; padding:0 !important; }
        .use-only-h-strip{ background:#ecd4bb; font-weight:700; color:#1f1f1f; padding:4px 8px; font-size:11px; border-bottom:1px solid #888; }
        .use-only-line{ padding:4px 8px; border-bottom:1px solid #888; font-size:11.5px; line-height:1.3; }

        table.form td.consent{ background:#ecd4bb !important; background-color:#ecd4bb !important; font-size:9px; color:#1f1f1f; line-height:1.45; padding:6px 8px !important; }

        .in-patient-cell-first{ border-right:none !important; }
        .in-patient-cell-provider{ border-left:none !important; border-right:none !important; }
        .in-patient-cell-cost{ border-left:none !important; text-align:left; }

        .phys-cell{ border-right:none !important; padding:5px 8px !important; }
        .phys-cell + td{ border-left:1px solid #888; }

        .sig-stamp-row{ display:flex; align-items:flex-start; gap:12px; min-height:64px; }
        .sig-stamp-label{ flex:0 0 auto; }
        .sig-stamp-img{ flex:1 1 auto; max-height:100px; max-width:100%; object-fit:contain; object-position:center center; }
        .patient-sig-cell{ vertical-align:top; padding:5px 8px !important; }
        .patient-sig-label{ font-style:italic; font-weight:700; font-size:11px; padding:0 0 6px 0; margin:0 0 6px 0; text-align:left; border-bottom:1px solid #888; }
        .patient-sig-img{ max-height:70px; max-width:100%; object-fit:contain; display:block; margin:4px 0 0 0; }
        .telfax-underline{ display:inline-block; border-bottom:1px solid #555; width:40px; min-height:14px; margin-left:24px; vertical-align:bottom; padding:0 4px; line-height:1.2; }
        .date-cell{ border-top:none !important; padding:6px 8px !important; }
        table.form td.sig-stamp-cell{ border-bottom:none !important; }

        @media print {
          :global(body){ background:#fff; }
          .toolbar{ display:none !important; }
          .page-wrap{ padding:0; }
          .page{ box-shadow:none; width:auto; min-height:auto; padding:8mm 8mm 9mm; border:none; background:#fff; }
        }
      `}</style>
    </>
  )
}
