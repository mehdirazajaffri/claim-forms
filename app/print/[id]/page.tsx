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

export default function PrintClaimPage() {
  const params = useParams<{ id: string }>()
  const claimId = params?.id
  const [claim, setClaim] = useState<ClaimResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
            <Link href={`/claims/new?claimId=${claim.id}`} className="btn-link back-btn" title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </Link>
          </div>

          <div className="page-wrap">
            <div className="page" id="formPage">
              <div className="top">
                <div className="logo-block">
                  <img src="/logo_original.svg" alt="ALMADALLAH" className="logo-image" />
                </div>
                <div className="title">Claim Form</div>
                <div className="no">No.<span className="no-val">{claim.id.slice(-6).toUpperCase()}</span></div>
              </div>

              <table className="form" aria-label="Claim form print layout">
            <colgroup>
              {Array.from({ length: 12 }).map((_, idx) => (
                <col key={idx} className="col-fixed" />
              ))}
            </colgroup>
            <tbody>
              <tr className="row-md top-row">
                <td colSpan={6}><span className="label">Date:</span> {fmtDate(claim.date)}</td>
                <td colSpan={6}><span className="label">Provider:</span> {claim.provider || ''}</td>
              </tr>

              <tr><td colSpan={12} className="section">PATIENT INFORMATION</td></tr>
              <tr className="row-md">
                <td colSpan={9}><span className="label">Patient&apos;s Name(as on card):</span> {claim.patient?.name || ''}</td>
                <td colSpan={3}></td>
              </tr>
              <tr className="row-md">
                <td colSpan={3}><span className="label">Card #</span> {claim.patient?.cardNumber || ''}</td>
                <td colSpan={3}><span className="label">policy No.</span> {claim.patient?.policyNo || ''}</td>
                <td colSpan={3}><span className="label">BirthDate:</span> {fmtDate(claim.patient?.birthDate)}</td>
                <td colSpan={3}><span className="label">Sex:</span> {claim.patient?.sex || ''}</td>
              </tr>

              <tr>
                <td colSpan={6} className="subsection">INFORMATION</td>
                <td colSpan={6} className="subsection right-note">To be completed by physician</td>
              </tr>
              <tr className="row-lg">
                <td colSpan={3} style={{verticalAlign:'top'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                    <span className="label">Service<br />Date</span>
                    <span>{fmtDate(claim.serviceDate)}</span>
                  </div>
                </td>
                <td colSpan={9}>
                  <div className="label">Symptom(s) as described by patient:</div>
                  <div className="pre">{claim.symptoms || ''}</div>
                </td>
              </tr>
              <tr className="row-xl">
                <td colSpan={6}>
                  <div className="checks">
                    <Check checked={claim.preExistingCondition} label="Pre-existing Condition(s) being treated" />
                    <Check checked={claim.chronicMedications} label="Chronic Medications" />
                    <Check checked={claim.familyHistory} label="Family History of any Illness" />
                  </div>
                </td>
                <td colSpan={6}><span className="label">If Yes Specify:</span><div className="pre">{claim.additionalNotes || ''}</div></td>
              </tr>

              <tr>
                <td colSpan={6} className="subsection">OBJECTIVE/ASSESSMENT</td>
                <td colSpan={6} className="subsection right-note">To be completed by physician</td>
              </tr>
              <tr className="row-xl"><td colSpan={12}><span className="label">Clinical Findings:</span><div className="pre">{claim.clinicalFindings || ''}</div></td></tr>
              <tr className="row-md">
                <td colSpan={12}>
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
              <tr><td colSpan={12}><span className="label">Other(s), Explain</span> {claim.otherCause || ''}</td></tr>
              <tr>
                <td colSpan={12}>
                  <div className="row-checks">
                    <span className="label">Assessment /Diagnosis</span>
                    <Check checked={claim.assessmentAcute} label="Acute" />
                    <Check checked={claim.assessmentChronic} label="Chronic" />
                    <Check checked={claim.assessmentConfirmed} label="Confirmed" />
                    <Check checked={claim.assessmentSuspected} label="Suspected" />
                  </div>
                </td>
              </tr>
              <tr><td colSpan={12}><span className="label">Comments</span><div className="pre">{claim.comments || ''}</div></td></tr>

              <tr>
                <td colSpan={12} className="subsection">
                  MEDICAL PLAN
                  <div className="tiny">Itemized original invoices and applicable reports must be enclosed to consider the claim.</div>
                </td>
              </tr>
              <tr className="row-md">
                <td colSpan={12}>
                  <div className="row-checks">
                    <Check checked={claim.consultation} label="Consultation" />
                    <Check checked={claim.physiotherapy} label="Physiotherapy" />
                    <Check checked={claim.laboratory} label="Laboratory" />
                    <Check checked={claim.radiology} label="Radiology" />
                    <Check checked={claim.pharmacy} label="Pharmacy" />
                    <Check checked={Boolean(claim.otherMedical)} label={`Other: ${claim.otherMedical || ''}`} />
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={8} rowSpan={3}>
                  <div><span className="label">Pre Authorization Required for:</span></div>
                  <div className="pre box">{claim.preAuthorizationDetails || ''}</div>
                  <div><span className="label">Full details of proposed treatment/ Surgery/ Medicine:</span></div>
                  <div className="pre box tall">{claim.proposedTreatment || ''}</div>
                  <div><span className="label">EstimatedCost:</span> {claim.estimatedCost || ''}</div>
                </td>
                <td colSpan={4} className="use-only-h">For Almadaallah&apos;s Use Only</td>
              </tr>
              <tr><td colSpan={4}>As per agreed tariff [{mark(claim.approvedTariff)}]</td></tr>
              <tr><td colSpan={4}><span className="label">ApprovalCode:</span> {claim.approvalCode || ''}</td></tr>

              <tr>
                <td colSpan={12} className="subsection">IN-PATIENT<div className="tiny">Discharge summary, itemized invoices, reports and results should be attached.</div></td>
              </tr>
              <tr>
                <td colSpan={4}><span className="label">Length of stay</span> {claim.lengthOfStay || ''}</td>
                <td colSpan={4}><span className="label">Provider</span> {claim.inPatientProvider || ''}</td>
                <td colSpan={4}><span className="label">Cost</span> {claim.inPatientCost || ''}</td>
              </tr>

              <tr>
                <td colSpan={12} className="consent">
                  The above information is true to the best of my knowledge. I hereby authorize any Healthcare Provider, Insurer, Employer or other Organization to release any information regarding my medical conditions and history to ALMADALLAH for the purpose of determining insurance benefits.
                </td>
              </tr>

              <tr>
                <td colSpan={8}><span className="label">Treating Physician Name:</span> {claim.treatingPhysicianName || ''}</td>
                <td colSpan={4}><span className="label italic">Patient/Guardian signature</span></td>
              </tr>
              <tr>
                <td colSpan={8}><span className="label">Tel/Fax:</span> {claim.telFax || ''}</td>
                <td colSpan={4}></td>
              </tr>
              <tr>
                <td colSpan={8}><span className="label">Signature and stamp</span></td>
                <td colSpan={4}></td>
              </tr>
              <tr>
                <td colSpan={8}><span className="label">Date</span> {fmtDate(claim.date)}</td>
                <td colSpan={4}><span className="label">Date</span> {fmtDate(claim.date)}</td>
              </tr>
            </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        :global(body){ margin:0; background:#fff; font-family: Arial, Helvetica, sans-serif; color:#2a2a2a; }
        :global(.app-header){ display:none !important; }
        :global(.app-main){ padding:0 !important; }
        :global(.app-main__inner){ max-width:none !important; padding:0 !important; }
        .toolbar{ position:sticky; top:0; z-index:20; background:white; border-bottom:1px solid #ddd; padding:10px 14px; display:flex; gap:10px; align-items:center; }
        .toolbar button, .btn-link{ border:1px solid #cfcfcf; background:#fff; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:600; color:#111; text-decoration:none; }
        .toolbar button.primary{ background:#111827; color:#fff; border-color:#111827; }
        .back-btn{ margin-left:auto; display:flex; align-items:center; justify-content:center; width:38px; height:38px; padding:0; }
        .page-state{ padding:24px; }
        .page-wrap{ padding:0; display:flex; justify-content:center; }
        .page{ width:210mm; min-height:297mm; background:#fff; border:none; box-shadow:none; padding:8mm 8mm 9mm; box-sizing:border-box; }
        .top{ display:grid; grid-template-columns:1fr auto 1fr; align-items:start; column-gap:8px; margin-bottom:2mm; }
        .logo-block{ display:flex; align-items:flex-start; margin-top:2px; }
        .logo-image{ height:52px; width:auto; object-fit:contain; }
        .title{ text-align:center; font-weight:700; font-size:22px; line-height:1.1; margin-top:6px; color:#2b2b2b; }
        .no{ text-align:right; font-size:13px; font-weight:700; margin-top:8px; }
        .no-val{ display:block; font-size:10px; font-weight:700; letter-spacing:0.3px; margin-top:2px; }
        table.form{ width:100%; border-collapse:collapse; margin-top:1mm; font-size:11px; table-layout:fixed; border:1.5px solid #2b2b2b; }
        :global(col.col-fixed){ width:8.333%; }
        table.form td{ border:1px solid #cfcfcf; vertical-align:top; padding:4px 10px; word-break:break-word; background:#fff; }
        .top-row td{ padding-top:6px; padding-bottom:6px; }
        .row-md td{ min-height:25px; }
        .row-lg td{ min-height:46px; }
        .row-xl td{ min-height:62px; }
        .section{ background:#dcccb6 !important; text-align:center; font-weight:700; letter-spacing:0; color:#666; }
        .subsection{ background:#dcccb6 !important; font-weight:700; color:#666; }
        .right-note{ text-align:center; font-weight:500; font-style:italic; color:#777; }
        .label{ font-weight:600; }
        .italic{ font-style:italic; }
        .tiny{ font-size:9px; color:#777; font-weight:500; font-style:italic; }
        .checks{ display:flex; flex-direction:column; gap:4px; }
        .row-checks{ display:flex; flex-wrap:wrap; align-items:center; column-gap:8px; row-gap:4px; }
        .check-item{ display:inline-flex; align-items:center; margin-right:12px; margin-bottom:3px; white-space:nowrap; gap:4px; }
        .check-mark{ font-size:11px; line-height:1; color:#2a2a2a; }
        .pre{ white-space:pre-wrap; line-height:1.2; }
        .box{ min-height:32px; }
        .box.tall{ min-height:74px; }
        .use-only-h{ background:#dcccb6 !important; font-weight:700; color:#666; }
        .consent{ background:#dcccb6 !important; font-size:9px; color:#666; line-height:1.25; }
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
