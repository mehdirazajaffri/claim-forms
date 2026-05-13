import { execFile } from 'child_process'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

function escapeLatex(input: unknown): string {
  if (input === null || input === undefined) return ''
  return String(input)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([#$%&_{}])/g, '\\$1')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\r?\n/g, ' ')
}

function formatDate(dateValue: unknown): string {
  if (!dateValue) return ''
  if (typeof dateValue === 'string') return dateValue.slice(0, 10)
  if (dateValue instanceof Date) return dateValue.toISOString().slice(0, 10)
  return String(dateValue)
}

function mark(checked: unknown): string {
  return checked ? 'X' : ''
}

export function buildClaimLatex(formData: any): string {
  const v = {
    no: escapeLatex(String(formData.id || '').slice(-6)),
    date: escapeLatex(formatDate(formData.date)),
    provider: escapeLatex(formData.provider),
    name: escapeLatex(formData.name),
    cardNumber: escapeLatex(formData.cardNumber),
    policyNo: escapeLatex(formData.policyNo),
    birthDate: escapeLatex(formatDate(formData.birthDate)),
    sex: escapeLatex(formData.sex),
    serviceDate: escapeLatex(formatDate(formData.serviceDate)),
    symptoms: escapeLatex(formData.symptoms),
    additionalNotes: escapeLatex(formData.additionalNotes),
    clinicalFindings: escapeLatex(formData.clinicalFindings),
    otherCause: escapeLatex(formData.otherCause),
    comments: escapeLatex(formData.comments),
    otherMedical: escapeLatex(formData.otherMedical),
    preAuthorizationDetails: escapeLatex(formData.preAuthorizationDetails),
    proposedTreatment: escapeLatex(formData.proposedTreatment),
    estimatedCost: escapeLatex(formData.estimatedCost),
    approvedTariff: mark(formData.approvedTariff),
    approvalCode: escapeLatex(formData.approvalCode),
    lengthOfStay: escapeLatex(formData.lengthOfStay),
    inPatientProvider: escapeLatex(formData.inPatientProvider),
    inPatientCost: escapeLatex(formData.inPatientCost),
    treatingPhysicianName: escapeLatex(formData.treatingPhysicianName),
    telFax: escapeLatex(formData.telFax),
    physicianDate: escapeLatex(formatDate(formData.date)),
    patientDate: escapeLatex(formatDate(formData.date)),
    preExisting: mark(formData.preExistingCondition),
    chronicMeds: mark(formData.chronicMedications),
    familyHistory: mark(formData.familyHistory),
    accident: mark((formData.cause || '').toLowerCase() === 'accident'),
    dental: mark((formData.cause || '').toLowerCase() === 'dental'),
    maternity: mark((formData.cause || '').toLowerCase() === 'maternity'),
    physicalIllness: mark((formData.cause || '').toLowerCase() === 'physical illness'),
    preventive: mark((formData.cause || '').toLowerCase() === 'preventive'),
    psychiatry: mark((formData.cause || '').toLowerCase() === 'psychiatry'),
    workRelated: mark((formData.cause || '').toLowerCase() === 'work related'),
    assessmentAcute: mark(formData.assessmentAcute),
    assessmentChronic: mark(formData.assessmentChronic),
    assessmentConfirmed: mark(formData.assessmentConfirmed),
    assessmentSuspected: mark(formData.assessmentSuspected),
    consultation: mark(formData.consultation),
    physiotherapy: mark(formData.physiotherapy),
    laboratory: mark(formData.laboratory),
    radiology: mark(formData.radiology),
    pharmacy: mark(formData.pharmacy),
    otherPlan: mark(Boolean(formData.otherMedical)),
  }

  return String.raw`\documentclass[11pt]{article}
\usepackage[top=1.2cm,bottom=1.2cm,left=1.2cm,right=1.2cm]{geometry}
\usepackage[dvipsnames,svgnames,x11names]{xcolor}
\usepackage{array}
\usepackage{tabularx}
\usepackage{multirow}
\usepackage{colortbl}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}
\pagestyle{empty}

\definecolor{beigehead}{RGB}{222,208,183}
\definecolor{linegray}{RGB}{214,214,214}
\definecolor{darktext}{RGB}{55,55,55}
\definecolor{goldlogo}{RGB}{186,157,96}

\newcolumntype{Y}{>{\raggedright\arraybackslash}X}
\newcommand{\cb}{\ensuremath{\Box}}
\renewcommand{\arraystretch}{1.25}
\setlength{\tabcolsep}{6pt}

\begin{document}
\color{darktext}
\small

\begin{minipage}[t]{0.38\textwidth}
\vspace{0pt}
{\color{goldlogo}\fbox{\rule{0pt}{1.5cm}\hspace{1.2cm}}}\hspace{0.25cm}
\begin{minipage}[t]{0.62\linewidth}
\vspace{0.05cm}
{\large\textsf{A L M A D A L L A H}}\\[-0.05cm]
{\scriptsize HEALTHCARE MANAGEMENT}
\end{minipage}
\end{minipage}
\hfill
\begin{minipage}[t]{0.38\textwidth}
\vspace{0pt}
\centering
{\LARGE\bfseries Claim Form}
\end{minipage}
\hfill
\begin{minipage}[t]{0.12\textwidth}
\vspace{0pt}
\raggedleft
{\large\bfseries No.} ${v.no}
\end{minipage}

\vspace{0.6cm}

{\arrayrulecolor{linegray}
\begin{tabularx}{\textwidth}{|p{0.25\textwidth}|X|p{0.18\textwidth}|p{0.10\textwidth}|}
\hline
\rule{0pt}{0.75cm}Date: ${v.date} & Provider: ${v.provider} & & \\
\hline
\rowcolor{beigehead}
\multicolumn{4}{|c|}{\textbf{PATIENT INFORMATION}} \\
\hline
\multicolumn{4}{|p{\dimexpr\textwidth-2\tabcolsep-2\arrayrulewidth\relax}|}{\rule{0pt}{0.8cm}Patient's Name(as on card): ${v.name}} \\
\hline
\rule{0pt}{0.8cm}Card \# ${v.cardNumber} & policy No. ${v.policyNo} & BirthDate: ${v.birthDate} & Sex: ${v.sex} \\
\hline
\rowcolor{beigehead}
\multicolumn{2}{|l|}{\textbf{INFORMATION}} & \multicolumn{2}{l|}{\textit{To be completed by physician}} \\
\hline
\rule{0pt}{1.0cm}Service\\Date ${v.serviceDate} & \multicolumn{3}{|p{0.70\textwidth}|}{\begin{minipage}[t]{\linewidth}\vspace{0pt}\begin{minipage}[t]{0.27\linewidth}\raggedright Symptom(s) as described by patient:\end{minipage}\begin{minipage}[t]{0.71\linewidth}\raggedright ${v.symptoms}\end{minipage}\end{minipage}} \\
\hline
\multicolumn{2}{|p{0.46\textwidth}|}{\rule{0pt}{1.5cm}${v.preExisting} \cb\ Pre-existing Condition(s) being treated\\${v.chronicMeds} \cb\ Chronic Medications\\${v.familyHistory} \cb\ Family History of any Illness} & \multicolumn{2}{|p{0.46\textwidth}|}{\begin{minipage}[t]{\linewidth}\vspace{0pt}\begin{minipage}[t]{0.22\linewidth}\raggedright If Yes Specify:\end{minipage}\begin{minipage}[t]{0.76\linewidth}\raggedright ${v.additionalNotes}\end{minipage}\end{minipage}} \\
\hline
\rowcolor{beigehead}
\multicolumn{2}{|l|}{\textbf{OBJECTIVE/ASSESSMENT}} & \multicolumn{2}{l|}{\textit{To be completed by physician}} \\
\hline
\multicolumn{4}{|p{\dimexpr\textwidth-2\tabcolsep-2\arrayrulewidth\relax}|}{\rule{0pt}{1.0cm}\begin{minipage}[t]{\linewidth}\vspace{0pt}\begin{minipage}[t]{0.20\linewidth}\raggedright Clinical Findings:\end{minipage}\begin{minipage}[t]{0.78\linewidth}\raggedright ${v.clinicalFindings}\end{minipage}\end{minipage}} \\
\hline
\multicolumn{4}{|p{\dimexpr\textwidth-2\tabcolsep-2\arrayrulewidth\relax}|}{\rule{0pt}{0.9cm}Cause \hspace{0.5cm}${v.accident} \cb\ Accident \hspace{0.3cm}${v.dental} \cb\ Dental \hspace{0.3cm}${v.maternity} \cb\ Maternity \hspace{0.3cm}${v.physicalIllness} \cb\ Physical Illness \hspace{0.3cm}${v.preventive} \cb\ Preventive \hspace{0.3cm}${v.psychiatry} \cb\ Psychiatry \hspace{0.3cm}${v.workRelated} \cb\ Work Related} \\
\hline
\multicolumn{4}{|p{\dimexpr\textwidth-2\tabcolsep-2\arrayrulewidth\relax}|}{\rule{0pt}{0.85cm}\begin{minipage}[t]{\linewidth}\vspace{0pt}\begin{minipage}[t]{0.20\linewidth}\raggedright Other(s), Explain\end{minipage}\begin{minipage}[t]{0.78\linewidth}\raggedright ${v.otherCause}\end{minipage}\end{minipage}} \\
\hline
\multicolumn{4}{|p{\dimexpr\textwidth-2\tabcolsep-2\arrayrulewidth\relax}|}{\rule{0pt}{0.85cm}\textbf{Assessment /Diagnosis} \hspace{0.7cm}${v.assessmentAcute} \cb\ Acute \hspace{0.3cm}${v.assessmentChronic} \cb\ Chronic \hspace{0.3cm}${v.assessmentConfirmed} \cb\ Confirmed \hspace{0.3cm}${v.assessmentSuspected} \cb\ Suspected} \\
\hline
\multicolumn{4}{|p{\dimexpr\textwidth-2\tabcolsep-2\arrayrulewidth\relax}|}{\rule{0pt}{0.85cm}\begin{minipage}[t]{\linewidth}\vspace{0pt}\begin{minipage}[t]{0.14\linewidth}\raggedright Comments\end{minipage}\begin{minipage}[t]{0.84\linewidth}\raggedright ${v.comments}\end{minipage}\end{minipage}} \\
\hline
\rowcolor{beigehead}
\multicolumn{4}{|l|}{\textbf{MEDICAL PLAN}\\[-0.1cm]{\scriptsize Itemized original Invoices \& Applicable Prescriptions/Reports/Results Must be enclosed to consider the claim}} \\
\hline
\multicolumn{4}{|p{\dimexpr\textwidth-2\tabcolsep-2\arrayrulewidth\relax}|}{\rule{0pt}{0.75cm}${v.consultation} \cb\ Consultation \hspace{0.35cm}${v.physiotherapy} \cb\ Physiotherapy \hspace{0.35cm}${v.laboratory} \cb\ Laboratory \hspace{0.35cm}${v.radiology} \cb\ Radiology \hspace{0.35cm}${v.pharmacy} \cb\ Pharmacy \hspace{0.35cm}${v.otherPlan} \cb\ Other ${v.otherMedical}} \\
\hline
\multicolumn{2}{|p{0.46\textwidth}|}{\rule{0pt}{3.1cm}\begin{minipage}[t]{\linewidth}\vspace{0pt}\begin{minipage}[t]{0.34\linewidth}\raggedright Pre Authorization Required for:\end{minipage}\begin{minipage}[t]{0.64\linewidth}\raggedright ${v.preAuthorizationDetails}\end{minipage}\\[0.45cm]\begin{minipage}[t]{0.34\linewidth}\raggedright Full details of proposed treatment/ Surgery/ Medicine:\end{minipage}\begin{minipage}[t]{0.64\linewidth}\raggedright ${v.proposedTreatment}\end{minipage}\\[0.45cm]\begin{minipage}[t]{0.26\linewidth}\raggedright EstimatedCost\end{minipage}\begin{minipage}[t]{0.72\linewidth}\raggedright ${v.estimatedCost}\end{minipage}\end{minipage}} & \multicolumn{2}{|p{0.46\textwidth}|}{\cellcolor{beigehead}\textbf{For Almadallah's Use Only}\\As per agreed tariff ${v.approvedTariff}\\ApprovalCode: ${v.approvalCode}\\[2.0cm]} \\
\hline
\rowcolor{beigehead}
\multicolumn{4}{|l|}{\textbf{IN-PATIENT}\\[-0.1cm]{\scriptsize Discharge summary, Itemized Invoices, Report, Results should be attached}} \\
\hline
\multicolumn{4}{|p{\dimexpr\textwidth-2\tabcolsep-2\arrayrulewidth\relax}|}{\rule{0pt}{0.75cm}Length of stay ${v.lengthOfStay} \hspace{2.6cm} Provider ${v.inPatientProvider} \hspace{2.2cm} Cost ${v.inPatientCost}} \\
\hline
\multicolumn{4}{|p{\dimexpr\textwidth-2\tabcolsep-2\arrayrulewidth\relax}|}{\cellcolor{beigehead}\rule{0pt}{0.9cm}The above information is true to the best of my knowledge. I hereby authorize any Healthcare Provider, Insurer, Employer or other Organization to release any\\information regarding my medical conditions \& history to ALMADALLAH for the purpose of determining insurance benefits} \\
\hline
\multicolumn{2}{|p{0.58\textwidth}|}{\rule{0pt}{0.8cm}\textbf{Treating Physician Name:} ${v.treatingPhysicianName}} & \multicolumn{2}{p{0.34\textwidth}|}{\textbf{Patient/Guardian signature}} \\
\cline{1-2}\cline{3-4}
\multicolumn{2}{|p{0.58\textwidth}|}{\rule{0pt}{0.85cm}\textbf{Tel/Fax} ${v.telFax} \hspace{0.5cm}\rule{1.3cm}{0.3pt}} & \multicolumn{2}{p{0.34\textwidth}|}{\rule{0pt}{1.3cm}} \\
\cline{1-2}\cline{3-4}
\multicolumn{2}{|p{0.58\textwidth}|}{\rule{0pt}{0.8cm}Signature and stamp} & \multicolumn{2}{p{0.34\textwidth}|}{} \\
\cline{1-2}\cline{3-4}
\multicolumn{2}{|p{0.58\textwidth}|}{\rule{0pt}{0.8cm}Date ${v.physicianDate}} & \multicolumn{2}{p{0.34\textwidth}|}{Date ${v.patientDate}} \\
\hline
\end{tabularx}}

\end{document}
`
}

export async function compileClaimLatexPdf(formData: any): Promise<Buffer> {
  try {
    await execFileAsync('pdflatex', ['--version'])
  } catch {
    const error = new Error('PDFLATEX_NOT_FOUND')
    throw error
  }

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claim-latex-'))
  const texPath = path.join(workDir, 'claim.tex')
  const pdfPath = path.join(workDir, 'claim.pdf')

  try {
    const texSource = buildClaimLatex(formData)
    await fs.writeFile(texPath, texSource, 'utf8')

    await execFileAsync('pdflatex', ['-interaction=nonstopmode', '-halt-on-error', '-output-directory', workDir, texPath], {
      cwd: workDir,
      timeout: 60_000,
      maxBuffer: 1024 * 1024,
    })

    return await fs.readFile(pdfPath)
  } finally {
    await fs.rm(workDir, { recursive: true, force: true })
  }
}