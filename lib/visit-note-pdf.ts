import path from 'path'
import fs from 'fs'
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, PDFImage } from 'pdf-lib'

export interface VisitNoteData {
  id?: string
  patientName?: string | null
  ageGender?: string | null
  dateOfVisit?: string | null
  visitTime?: string | null
  address?: string | null
  contactNumber?: string | null
  accompaniedBy?: string | null

  temperature?: string | null
  bloodPressure?: string | null
  heartRate?: string | null
  respiratoryRate?: string | null
  spo2?: string | null
  bloodSugar?: string | null
  weight?: string | null

  diagnosis?: string | null
  chiefComplaints?: string | null

  appearance?: string | null
  hydration?: string | null
  chest?: string | null
  cvs?: string | null
  perAbd?: string | null
  cns?: string | null
  musculoskeletal?: string | null
  pallor?: string | null
  icterus?: string | null
  cyanosis?: string | null
  clubbing?: string | null
  koilonychia?: string | null
  lymphadenopathy?: string | null
  edema?: string | null
  otherFindings?: string | null

  medicationChanges?: string | null
  laboratoryTests?: string | null
  followUpPlan?: string | null
  otherInstructions?: string | null

  doctorName?: string | null
  doctorContact?: string | null
  doctorRegNo?: string | null
}

const PAGE_WIDTH = 595.28 // A4 portrait
const PAGE_HEIGHT = 841.89
const MARGIN_X = 56
const MARGIN_BOTTOM = 70
const LINE_HEIGHT = 14
const HEADER_HEIGHT = 105 // Reserved space for logo at top of each page

const FOOTER_ADDRESS = '402, Al Murjan Tower, Alnahda-2 Dubai- United Arab Emirates'
const FOOTER_PHONE = '+971523239489'
const FOOTER_WEBSITE = 'www.chrisonepoint.com'

const navy = rgb(0.12, 0.16, 0.34)
const textColor = rgb(0.1, 0.1, 0.1)
const lineColor = rgb(0.55, 0.55, 0.55)
const muted = rgb(0.42, 0.42, 0.42)
const accentRed = rgb(0.86, 0.23, 0.16)

// Replace characters Helvetica (WinAnsi) can't encode.
const UNICODE_REPLACEMENTS: Record<string, string> = {
  '\u2080': '0', '\u2081': '1', '\u2082': '2', '\u2083': '3', '\u2084': '4',
  '\u2085': '5', '\u2086': '6', '\u2087': '7', '\u2088': '8', '\u2089': '9',
  '\u2070': '0', '\u00B9': '1', '\u00B2': '2', '\u00B3': '3', '\u2074': '4',
  '\u2075': '5', '\u2076': '6', '\u2077': '7', '\u2078': '8', '\u2079': '9',
  '\u2192': '->', '\u2190': '<-', '\u2194': '<->',
  '\u2022': '-', '\u00B7': '-',
  '\u2018': "'", '\u2019': "'", '\u201A': "'",
  '\u201C': '"', '\u201D': '"', '\u201E': '"',
  '\u00A0': ' ',
}

function sanitizeText(input: string): string {
  let out = input
  for (const [from, to] of Object.entries(UNICODE_REPLACEMENTS)) {
    if (out.includes(from)) out = out.split(from).join(to)
  }
  return out.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '?')
}

interface RenderContext {
  pdf: PDFDocument
  page: PDFPage
  font: PDFFont
  bold: PDFFont
  italic: PDFFont
  headerImage: PDFImage | null
  cursorY: number
  pageCount: number
}

function loadHeaderImageBytes(): Buffer | null {
  try {
    const p = path.join(process.cwd(), 'public', 'visit-note-header.png')
    if (fs.existsSync(p)) return fs.readFileSync(p)
  } catch {
    // ignore
  }
  return null
}

function drawPageHeader(ctx: RenderContext) {
  const { page, headerImage } = ctx
  if (headerImage) {
    const maxWidth = 250
    const maxHeight = 78
    const scaled = headerImage.scaleToFit(maxWidth, maxHeight)
    page.drawImage(headerImage, {
      x: (PAGE_WIDTH - scaled.width) / 2,
      y: PAGE_HEIGHT - 18 - scaled.height,
      width: scaled.width,
      height: scaled.height,
    })
  } else {
    page.drawText('Platinum Healthcare', {
      x: (PAGE_WIDTH - ctx.bold.widthOfTextAtSize('Platinum Healthcare', 18)) / 2,
      y: PAGE_HEIGHT - 46,
      size: 18,
      font: ctx.bold,
      color: navy,
    })
    page.drawText('CHRIS ONE POINT HOMECARE', {
      x: (PAGE_WIDTH - ctx.bold.widthOfTextAtSize('CHRIS ONE POINT HOMECARE', 12)) / 2,
      y: PAGE_HEIGHT - 66,
      size: 12,
      font: ctx.bold,
      color: accentRed,
    })
  }
  ctx.cursorY = PAGE_HEIGHT - HEADER_HEIGHT
}

function drawPageFooter(ctx: RenderContext) {
  const { page, font } = ctx
  const baseY = 38
  page.drawLine({
    start: { x: MARGIN_X, y: baseY + 14 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: baseY + 14 },
    thickness: 0.4,
    color: lineColor,
  })
  const addrPhone = `${FOOTER_ADDRESS}    ${FOOTER_PHONE}`
  const addrWidth = font.widthOfTextAtSize(addrPhone, 9)
  page.drawText(addrPhone, {
    x: (PAGE_WIDTH - addrWidth - 110) / 2,
    y: baseY,
    size: 9,
    font,
    color: muted,
  })
  page.drawText(FOOTER_WEBSITE, {
    x: PAGE_WIDTH - MARGIN_X - font.widthOfTextAtSize(FOOTER_WEBSITE, 9),
    y: baseY,
    size: 9,
    font,
    color: accentRed,
  })
}

function newPage(ctx: RenderContext) {
  ctx.page = ctx.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  ctx.pageCount += 1
  drawPageHeader(ctx)
}

function ensureSpace(ctx: RenderContext, required: number) {
  if (ctx.cursorY - required < MARGIN_BOTTOM) {
    newPage(ctx)
  }
}

// Break a single long token character-by-character so it never exceeds maxWidth.
function breakLongToken(token: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = []
  let chunk = ''
  for (const ch of token) {
    const trial = chunk + ch
    if (font.widthOfTextAtSize(trial, size) > maxWidth && chunk) {
      out.push(chunk)
      chunk = ch
    } else {
      chunk = trial
    }
  }
  if (chunk) out.push(chunk)
  return out
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const safeText = sanitizeText(text)
  const lines: string[] = []
  const usableWidth = Math.max(maxWidth, font.widthOfTextAtSize('M', size) * 2)

  for (const rawLine of safeText.split(/\r?\n/)) {
    if (!rawLine) {
      lines.push('')
      continue
    }
    const words = rawLine.split(/\s+/).filter(Boolean)
    let current = ''
    for (const word of words) {
      // If the word alone is wider than the line, hard-break it by characters.
      if (font.widthOfTextAtSize(word, size) > usableWidth) {
        if (current) {
          lines.push(current)
          current = ''
        }
        const pieces = breakLongToken(word, font, size, usableWidth)
        for (let i = 0; i < pieces.length - 1; i += 1) {
          lines.push(pieces[i])
        }
        current = pieces[pieces.length - 1] ?? ''
        continue
      }
      const trial = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(trial, size) > usableWidth) {
        if (current) lines.push(current)
        current = word
      } else {
        current = trial
      }
    }
    if (current) lines.push(current)
  }
  return lines.length ? lines : ['']
}

// Draw a field row like the template: "Label: ______ value ______"
// Long or multi-line values wrap on subsequent lines, indented under the value column.
function drawFieldRow(ctx: RenderContext, label: string, value?: string | null, opts?: { underlineWidth?: number }) {
  ensureSpace(ctx, LINE_HEIGHT + 8)
  const { page, font, bold } = ctx
  const labelText = sanitizeText(label)
  const labelSize = 11
  const valueSize = 11

  const labelWidth = bold.widthOfTextAtSize(labelText, labelSize)
  const labelX = MARGIN_X
  const valueX = labelX + labelWidth + 6
  const underlineWidth = opts?.underlineWidth ?? 260
  const valueMaxWidth = underlineWidth - 4

  const valueLines = value ? wrapText(value, font, valueSize, valueMaxWidth) : ['']

  // Label
  page.drawText(labelText, {
    x: labelX,
    y: ctx.cursorY,
    size: labelSize,
    font: bold,
    color: textColor,
  })

  // First underline
  page.drawLine({
    start: { x: valueX, y: ctx.cursorY - 2 },
    end: { x: valueX + underlineWidth, y: ctx.cursorY - 2 },
    thickness: 0.6,
    color: lineColor,
  })

  if (valueLines[0]) {
    page.drawText(valueLines[0], {
      x: valueX + 2,
      y: ctx.cursorY,
      size: valueSize,
      font,
      color: textColor,
    })
  }

  // Continuation lines below
  for (let i = 1; i < valueLines.length; i += 1) {
    ctx.cursorY -= LINE_HEIGHT + 4
    ensureSpace(ctx, LINE_HEIGHT + 8)
    ctx.page.drawLine({
      start: { x: valueX, y: ctx.cursorY - 2 },
      end: { x: valueX + underlineWidth, y: ctx.cursorY - 2 },
      thickness: 0.6,
      color: lineColor,
    })
    ctx.page.drawText(valueLines[i], {
      x: valueX + 2,
      y: ctx.cursorY,
      size: valueSize,
      font,
      color: textColor,
    })
  }

  ctx.cursorY -= LINE_HEIGHT + 10
}

function drawCenteredTitle(ctx: RenderContext) {
  const { page, bold } = ctx
  const title = 'Doctor Home Visit Note'
  const size = 14
  const width = bold.widthOfTextAtSize(title, size)
  const x = (PAGE_WIDTH - width) / 2
  const y = ctx.cursorY
  page.drawText(title, {
    x,
    y,
    size,
    font: bold,
    color: textColor,
  })
  // Underline (matches the template)
  page.drawLine({
    start: { x, y: y - 2 },
    end: { x: x + width, y: y - 2 },
    thickness: 0.8,
    color: textColor,
  })
  ctx.cursorY -= 28
}

function drawSectionHeading(ctx: RenderContext, label: string) {
  ensureSpace(ctx, 30)
  const { page, bold } = ctx
  const size = 13
  page.drawText(sanitizeText(label), {
    x: MARGIN_X,
    y: ctx.cursorY,
    size,
    font: bold,
    color: textColor,
  })
  ctx.cursorY -= 20
}

function drawVitalsTable(ctx: RenderContext, data: VisitNoteData) {
  const rows: Array<[string, string | null | undefined]> = [
    ['Temperature', data.temperature],
    ['Blood Pressure', data.bloodPressure],
    ['Heart Rate (Pulse)', data.heartRate],
    ['Respiratory Rate', data.respiratoryRate],
    ['SpO2 (Oxygen Saturation)', data.spo2],
    ['Blood Sugar (Random/Fasting)', data.bloodSugar],
    ['Weight', data.weight],
  ]

  const tableWidth = PAGE_WIDTH - MARGIN_X * 2
  const labelCol = 210
  const headerHeight = 22
  const rowHeight = 22

  ensureSpace(ctx, headerHeight + rowHeight * rows.length + 10)

  const topY = ctx.cursorY
  const bottomY = topY - headerHeight - rowHeight * rows.length

  // Header row background
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: topY - headerHeight,
    width: tableWidth,
    height: headerHeight,
    color: rgb(0.96, 0.97, 0.99),
  })

  // Header labels
  ctx.page.drawText('Vital Sign', {
    x: MARGIN_X + 8,
    y: topY - headerHeight + 7,
    size: 11,
    font: ctx.bold,
    color: textColor,
  })
  ctx.page.drawText('Value', {
    x: MARGIN_X + labelCol + 8,
    y: topY - headerHeight + 7,
    size: 11,
    font: ctx.bold,
    color: textColor,
  })

  // Rows
  rows.forEach(([label, value], idx) => {
    const y = topY - headerHeight - rowHeight * (idx + 1)
    ctx.page.drawText(sanitizeText(label), {
      x: MARGIN_X + 8,
      y: y + 7,
      size: 10.5,
      font: ctx.font,
      color: textColor,
    })
    if (value) {
      ctx.page.drawText(sanitizeText(value), {
        x: MARGIN_X + labelCol + 8,
        y: y + 7,
        size: 10.5,
        font: ctx.font,
        color: textColor,
      })
    }
  })

  // Outer border
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: bottomY,
    width: tableWidth,
    height: topY - bottomY,
    borderColor: lineColor,
    borderWidth: 0.6,
    color: undefined,
  })
  // Header divider
  ctx.page.drawLine({
    start: { x: MARGIN_X, y: topY - headerHeight },
    end: { x: MARGIN_X + tableWidth, y: topY - headerHeight },
    thickness: 0.6,
    color: lineColor,
  })
  // Vertical divider
  ctx.page.drawLine({
    start: { x: MARGIN_X + labelCol, y: topY },
    end: { x: MARGIN_X + labelCol, y: bottomY },
    thickness: 0.6,
    color: lineColor,
  })
  // Row dividers
  for (let i = 1; i < rows.length; i += 1) {
    const y = topY - headerHeight - rowHeight * i
    ctx.page.drawLine({
      start: { x: MARGIN_X, y },
      end: { x: MARGIN_X + tableWidth, y },
      thickness: 0.4,
      color: lineColor,
    })
  }

  ctx.cursorY = bottomY - 16
}

function drawWritingLines(ctx: RenderContext, lineCount: number) {
  const lineGap = 22
  ensureSpace(ctx, lineGap * lineCount + 4)
  for (let i = 0; i < lineCount; i += 1) {
    const y = ctx.cursorY
    ctx.page.drawLine({
      start: { x: MARGIN_X, y },
      end: { x: PAGE_WIDTH - MARGIN_X, y },
      thickness: 0.5,
      color: lineColor,
    })
    ctx.cursorY -= lineGap
  }
  ctx.cursorY -= 4
}

function drawTextBlock(ctx: RenderContext, text?: string | null, opts?: { fallbackLines?: number; size?: number }) {
  const size = opts?.size ?? 11
  if (text && text.trim()) {
    const lines = wrapText(text, ctx.font, size, PAGE_WIDTH - MARGIN_X * 2)
    for (const line of lines) {
      ensureSpace(ctx, LINE_HEIGHT + 2)
      ctx.page.drawText(line, {
        x: MARGIN_X,
        y: ctx.cursorY,
        size,
        font: ctx.font,
        color: textColor,
      })
      ctx.cursorY -= LINE_HEIGHT
    }
    ctx.cursorY -= 4
  } else if (opts?.fallbackLines) {
    drawWritingLines(ctx, opts.fallbackLines)
  }
}

// Diagnosis section + Chief Complaints subheading + content
function drawDiagnosisSection(ctx: RenderContext, diagnosis?: string | null, complaints?: string | null) {
  drawSectionHeading(ctx, 'Diagnosis')
  drawTextBlock(ctx, diagnosis, { fallbackLines: 4 })

  ensureSpace(ctx, 60)
  ctx.page.drawText('Chief Complaints:', {
    x: MARGIN_X,
    y: ctx.cursorY,
    size: 12,
    font: ctx.bold,
    color: textColor,
  })
  ctx.cursorY -= 18
  drawTextBlock(ctx, complaints, { fallbackLines: 3 })
  ctx.cursorY -= 6
}

function drawExamItem(ctx: RenderContext, index: number, label: string, value?: string | null) {
  ensureSpace(ctx, LINE_HEIGHT + 8)
  const text = `${index}. ${sanitizeText(label)}:`
  const labelSize = 11
  const labelWidth = ctx.bold.widthOfTextAtSize(text, labelSize)
  const valueX = MARGIN_X + labelWidth + 6
  const lineEnd = PAGE_WIDTH - MARGIN_X
  const valueLines = value ? wrapText(value, ctx.font, 11, lineEnd - valueX - 4) : ['']

  ctx.page.drawText(text, {
    x: MARGIN_X,
    y: ctx.cursorY,
    size: labelSize,
    font: ctx.bold,
    color: textColor,
  })
  ctx.page.drawLine({
    start: { x: valueX, y: ctx.cursorY - 2 },
    end: { x: lineEnd, y: ctx.cursorY - 2 },
    thickness: 0.5,
    color: lineColor,
  })
  if (valueLines[0]) {
    ctx.page.drawText(valueLines[0], {
      x: valueX + 2,
      y: ctx.cursorY,
      size: 11,
      font: ctx.font,
      color: textColor,
    })
  }
  for (let i = 1; i < valueLines.length; i += 1) {
    ctx.cursorY -= LINE_HEIGHT + 2
    ensureSpace(ctx, LINE_HEIGHT + 4)
    ctx.page.drawLine({
      start: { x: valueX, y: ctx.cursorY - 2 },
      end: { x: lineEnd, y: ctx.cursorY - 2 },
      thickness: 0.5,
      color: lineColor,
    })
    ctx.page.drawText(valueLines[i], {
      x: valueX + 2,
      y: ctx.cursorY,
      size: 11,
      font: ctx.font,
      color: textColor,
    })
  }
  ctx.cursorY -= LINE_HEIGHT + 8
}

function drawCheckboxField(ctx: RenderContext, label: string, value?: string | null) {
  ensureSpace(ctx, LINE_HEIGHT + 12)
  const boxSize = 10
  const boxY = ctx.cursorY - 1
  const checked = !!(value && value.trim())

  // Checkbox
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: boxY,
    width: boxSize,
    height: boxSize,
    borderColor: textColor,
    borderWidth: 0.8,
    color: undefined,
  })
  if (checked) {
    // Check mark (two short lines)
    ctx.page.drawLine({
      start: { x: MARGIN_X + 1.5, y: boxY + 4 },
      end: { x: MARGIN_X + 4, y: boxY + 1.5 },
      thickness: 1.2,
      color: textColor,
    })
    ctx.page.drawLine({
      start: { x: MARGIN_X + 4, y: boxY + 1.5 },
      end: { x: MARGIN_X + 9, y: boxY + 8 },
      thickness: 1.2,
      color: textColor,
    })
  }

  const labelText = sanitizeText(label) + ':'
  const labelSize = 11
  const labelX = MARGIN_X + boxSize + 6
  ctx.page.drawText(labelText, {
    x: labelX,
    y: ctx.cursorY,
    size: labelSize,
    font: ctx.bold,
    color: textColor,
  })

  const labelWidth = ctx.bold.widthOfTextAtSize(labelText, labelSize)
  const valueX = labelX + labelWidth + 6
  const lineEnd = PAGE_WIDTH - MARGIN_X
  ctx.page.drawLine({
    start: { x: valueX, y: ctx.cursorY - 2 },
    end: { x: lineEnd, y: ctx.cursorY - 2 },
    thickness: 0.5,
    color: lineColor,
  })
  if (checked) {
    const maxValueWidth = lineEnd - valueX - 4
    const lines = wrapText(value!, ctx.font, 11, maxValueWidth)
    ctx.page.drawText(lines[0], {
      x: valueX + 2,
      y: ctx.cursorY,
      size: 11,
      font: ctx.font,
      color: textColor,
    })
    if (lines.length > 1) {
      const indent = labelX
      for (let i = 1; i < lines.length; i += 1) {
        ctx.cursorY -= LINE_HEIGHT
        ensureSpace(ctx, LINE_HEIGHT)
        ctx.page.drawText(lines[i], {
          x: indent,
          y: ctx.cursorY,
          size: 11,
          font: ctx.font,
          color: textColor,
        })
      }
    }
  }
  ctx.cursorY -= LINE_HEIGHT + 8
}

export async function generateVisitNotePdf(data: VisitNoteData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Doctor Home Visit Note${data.patientName ? ` - ${data.patientName}` : ''}`)
  pdf.setProducer('Chris One Point Homecare')
  pdf.setCreator('Chris One Point Homecare')

  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique)

  let headerImage: PDFImage | null = null
  const headerBytes = loadHeaderImageBytes()
  if (headerBytes) {
    try {
      headerImage = await pdf.embedPng(headerBytes)
    } catch {
      headerImage = null
    }
  }

  const ctx: RenderContext = {
    pdf,
    page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    font,
    bold,
    italic,
    headerImage,
    cursorY: PAGE_HEIGHT - HEADER_HEIGHT,
    pageCount: 1,
  }
  drawPageHeader(ctx)
  drawCenteredTitle(ctx)

  // Patient details section
  drawFieldRow(ctx, 'Patient Name:', data.patientName, { underlineWidth: 280 })
  drawFieldRow(ctx, 'Age / Gender:', data.ageGender, { underlineWidth: 240 })
  drawFieldRow(ctx, 'Date of Visit:', data.dateOfVisit, { underlineWidth: 240 })
  drawFieldRow(ctx, 'Visit Time:', data.visitTime, { underlineWidth: 200 })
  drawFieldRow(ctx, 'Address:', data.address, { underlineWidth: 320 })
  drawFieldRow(ctx, 'Contact Number:', data.contactNumber, { underlineWidth: 220 })
  drawFieldRow(ctx, 'Accompanied By:', data.accompaniedBy, { underlineWidth: 260 })

  ctx.cursorY -= 8

  // Vitals
  drawSectionHeading(ctx, 'Vitals Table')
  drawVitalsTable(ctx, data)

  // Diagnosis / Chief Complaints
  drawDiagnosisSection(ctx, data.diagnosis, data.chiefComplaints)

  // Force new page for General Examination so it mirrors original layout
  newPage(ctx)
  drawSectionHeading(ctx, 'General Examination:')
  const examItems: Array<[string, string | null | undefined]> = [
    ['Appearance', data.appearance],
    ['Hydration', data.hydration],
    ['Chest', data.chest],
    ['CVS', data.cvs],
    ['Per/Abd', data.perAbd],
    ['CNS', data.cns],
    ['Musculoskeletal', data.musculoskeletal],
    ['Pallor', data.pallor],
    ['Icterus', data.icterus],
    ['Cyanosis', data.cyanosis],
    ['Clubbing', data.clubbing],
    ['Koilonychia', data.koilonychia],
    ['Lymphadenopathy', data.lymphadenopathy],
    ['Edema', data.edema],
  ]
  examItems.forEach(([label, value], idx) => {
    drawExamItem(ctx, idx + 1, label, value)
  })

  ctx.cursorY -= 4
  drawSectionHeading(ctx, 'Other Findings (if any)')
  drawTextBlock(ctx, data.otherFindings, { fallbackLines: 3 })

  // Recommendations & Doctor details on its own page
  newPage(ctx)
  drawSectionHeading(ctx, 'Recommendations / Plan of Action')
  drawCheckboxField(ctx, 'Medication Changes', data.medicationChanges)
  drawCheckboxField(ctx, 'Laboratory Tests Suggested', data.laboratoryTests)
  drawCheckboxField(ctx, 'Follow-up Plan', data.followUpPlan)
  drawCheckboxField(ctx, 'Other Instructions', data.otherInstructions)

  ctx.cursorY -= 6
  drawSectionHeading(ctx, "Doctor's Details")
  drawFieldRow(ctx, 'Doctor Name:', data.doctorName, { underlineWidth: 280 })
  drawFieldRow(ctx, 'Signature:', '', { underlineWidth: 220 })
  drawFieldRow(ctx, 'Contact No.:', data.doctorContact, { underlineWidth: 220 })
  drawFieldRow(ctx, 'Reg. No.:', data.doctorRegNo, { underlineWidth: 220 })

  // Footer + "-- N of M --" on all pages
  const total = ctx.pageCount
  pdf.getPages().forEach((p, idx) => {
    const ctxForFooter: RenderContext = { ...ctx, page: p }
    drawPageFooter(ctxForFooter)
    const footerStamp = `-- ${idx + 1} of ${total} --`
    const stampWidth = font.widthOfTextAtSize(footerStamp, 9)
    p.drawText(footerStamp, {
      x: (PAGE_WIDTH - stampWidth) / 2,
      y: 18,
      size: 9,
      font,
      color: muted,
    })
  })

  return await pdf.save()
}

export function visitNotePdfFilename(data: VisitNoteData): string {
  const safeName = (data.patientName || 'patient').replace(/[^a-zA-Z0-9-_]/g, '_')
  const safeDate = (data.dateOfVisit || new Date().toISOString().slice(0, 10)).replace(/[^a-zA-Z0-9-_]/g, '_')
  return `visit-note-${safeName}-${safeDate}.pdf`
}
