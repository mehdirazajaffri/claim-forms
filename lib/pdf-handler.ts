import { PDFDocument, PDFTextField, PDFCheckBox, StandardFonts, rgb } from 'pdf-lib'
import fs from 'fs'

export async function getPdfFieldNames(pdfPath: string): Promise<string[]> {
  const pdfBytes = fs.readFileSync(pdfPath)
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const form = pdfDoc.getForm()
  return form.getFields().map((f) => f.getName())
}

export async function fillPdfForm(pdfPath: string, formData: any): Promise<Buffer> {
  try {
    const pdfBytes = fs.readFileSync(pdfPath)
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const form = pdfDoc.getForm()
    const fields = form.getFields()

    console.log('Template fields found:', fields.length)

    // If no form fields, draw data directly on top of the template.
    if (fields.length === 0) {
      console.log('No form fields detected. Drawing values by coordinates on template...')
      await drawValuesOnTemplate(pdfDoc, formData)
      const filledPdfBytes = await pdfDoc.save()
      return Buffer.from(filledPdfBytes)
    }

    // Fill existing form fields
    const fieldMapping: Record<string, string> = {
      'Date': 'date',
      'Provider': 'provider',
      'Patient Name': 'name',
      'Card #': 'cardNumber',
      'policy No': 'policyNo',
      'BirthDate': 'birthDate',
      'Sex': 'sex',
      'Service Date': 'serviceDate',
      'Symptoms': 'symptoms',
      'Clinical Findings': 'clinicalFindings',
      'Treating Physician Name': 'treatingPhysicianName',
      'Tel/Fax': 'telFax',
    }

    for (const field of fields) {
      const fieldName = field.getName()
      let valueToSet: string | boolean | undefined

      if (formData[fieldName] !== undefined && formData[fieldName] !== null) {
        valueToSet = formData[fieldName]
      }

      if (!valueToSet) {
        const dataKey = fieldMapping[fieldName]
        if (dataKey && formData[dataKey] !== undefined && formData[dataKey] !== null) {
          valueToSet = formData[dataKey]
        }
      }

      if (valueToSet !== undefined) {
        try {
          if (field instanceof PDFTextField) {
            field.setText(String(valueToSet))
          } else if (field instanceof PDFCheckBox) {
            if (valueToSet === true || valueToSet === 'on' || valueToSet === '1') {
              field.check()
            } else {
              field.uncheck()
            }
          }
        } catch (e) {
          console.log(`Could not fill field ${fieldName}:`, e)
        }
      }
    }

    const filledPdfBytes = await pdfDoc.save()
    return Buffer.from(filledPdfBytes)
  } catch (error) {
    console.error('Error filling PDF:', error)
    throw error
  }
}

async function drawValuesOnTemplate(pdfDoc: PDFDocument, formData: any) {
  const page = pdfDoc.getPages()[0]
  if (!page) return
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const { width, height } = page.getSize()
  const refWidth = 1414
  const refHeight = 2000
  const sx = width / refWidth
  const sy = height / refHeight

  const toX = (xFromRef: number) => xFromRef * sx
  const toY = (yFromTopRef: number) => height - yFromTopRef * sy

  const normalizeOverlayText = (value: any): string => {
    if (value === undefined || value === null) return ''
    const compact = String(value).replace(/\s+/g, ' ').trim()
    if (!compact) return ''

    // Guard against duplicate leading token like "Routine Routine ..." or "850 850 AED".
    let deduped = compact.replace(/^(\S+)\s+\1\b\s*/i, '$1 ')

    // Compress repetitive copied phrases (common in imported claims).
    const tokens = deduped.split(' ')
    for (let unitLen = 4; unitLen <= Math.floor(tokens.length / 2); unitLen++) {
      const unit = tokens.slice(0, unitLen)
      if (unit.length < 4) continue

      let idx = 0
      let repeats = 0
      while (idx + unitLen <= tokens.length) {
        const slice = tokens.slice(idx, idx + unitLen)
        if (slice.join(' ') !== unit.join(' ')) break
        repeats += 1
        idx += unitLen
      }

      if (repeats >= 2) {
        const remainder = tokens.slice(idx).join(' ')
        deduped = `${unit.join(' ')}${remainder ? ` ${remainder}` : ''}`
        break
      }
    }

    return deduped
  }

  const fitTextToWidth = (value: string, fontSize: number, maxWidthPt: number): string => {
    if (!value) return ''
    if (!Number.isFinite(maxWidthPt) || maxWidthPt <= 0) return value
    if (font.widthOfTextAtSize(value, fontSize) <= maxWidthPt) return value

    let trimmed = value
    while (trimmed.length > 1 && font.widthOfTextAtSize(`${trimmed}...`, fontSize) > maxWidthPt) {
      trimmed = trimmed.slice(0, -1)
    }
    return `${trimmed}...`
  }

  const drawTextAt = (
    x: number,
    yTop: number,
    text: any,
    size = 10,
    maxWidth = Number.POSITIVE_INFINITY,
    minSize = 7
  ) => {
    const normalized = normalizeOverlayText(text)
    if (!normalized) return

    const maxWidthPt = maxWidth * sx
    let chosenSize = size
    for (let s = size; s >= minSize; s -= 0.5) {
      if (!Number.isFinite(maxWidthPt) || font.widthOfTextAtSize(normalized, s) <= maxWidthPt) {
        chosenSize = s
        break
      }
      chosenSize = s
    }

    const finalText = fitTextToWidth(normalized, chosenSize, maxWidthPt)
    page.drawText(finalText, {
      x: toX(x),
      y: toY(yTop),
      size: chosenSize,
      font,
      color: rgb(0, 0, 0),
    })
  }

  const drawWrappedTextAt = (x: number, yTop: number, maxWidth: number, text: any, size = 9, maxLines = 4) => {
    const normalized = normalizeOverlayText(text)
    if (!normalized) return
    const words = normalized.split(' ')
    if (words.length === 0) return

    const maxWidthPt = maxWidth * sx
    const lines: string[] = []
    let current = ''

    for (const word of words) {
      const next = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(next, size) > maxWidthPt) {
        if (!current) {
          lines.push(fitTextToWidth(word, size, maxWidthPt))
          current = ''
          continue
        }
        if (current) lines.push(current)
        current = word
      } else {
        current = next
      }
    }
    if (current) lines.push(current)

    const visibleLines = lines.slice(0, maxLines)
    if (lines.length > maxLines && visibleLines.length > 0) {
      let last = `${visibleLines[visibleLines.length - 1]}...`
      while (font.widthOfTextAtSize(last, size) > maxWidthPt && last.length > 4) {
        last = `${last.slice(0, -4)}...`
      }
      visibleLines[visibleLines.length - 1] = last
    }

    const lineStep = Math.max(11, size + 1)
    visibleLines.forEach((line, idx) => {
      drawTextAt(x, yTop + idx * lineStep, line, size)
    })
  }

  const markCheckbox = (x: number, yTop: number, checked: boolean) => {
    if (!checked) return
    page.drawText('X', {
      x: toX(x),
      y: toY(yTop),
      size: 9,
      font,
      color: rgb(0, 0, 0),
    })
  }

  const hasCause = (value: string) => String(formData.cause || '').toLowerCase() === value.toLowerCase()

  // Header
  drawTextAt(1085, 62, String(formData.id || '').slice(-6), 9, 90)

  // Top section
  drawTextAt(145, 230, formatDate(formData.date), 10, 230)
  drawTextAt(502, 230, formData.provider, 10, 760)

  // Patient information
  drawTextAt(330, 334, formData.name, 10, 920)
  drawTextAt(150, 395, formData.cardNumber, 10, 220)
  drawTextAt(505, 395, formData.policyNo, 10, 220)
  drawTextAt(860, 395, formatDate(formData.birthDate), 10, 190)
  drawTextAt(1132, 395, formData.sex, 10, 60)

  // Information
  drawTextAt(88, 552, formatDate(formData.serviceDate), 10, 240)
  drawWrappedTextAt(420, 552, 760, formData.symptoms, 8, 2)
  markCheckbox(92, 585, Boolean(formData.preExistingCondition))
  markCheckbox(92, 619, Boolean(formData.chronicMedications))
  markCheckbox(92, 652, Boolean(formData.familyHistory))
  drawWrappedTextAt(620, 610, 640, formData.additionalNotes, 8, 2)

  // Objective / Assessment
  drawWrappedTextAt(200, 770, 1020, formData.clinicalFindings, 8, 2)
  markCheckbox(191, 840, hasCause('Accident'))
  markCheckbox(308, 840, hasCause('Dental'))
  markCheckbox(415, 840, hasCause('Maternity'))
  markCheckbox(550, 840, hasCause('Physical Illness'))
  markCheckbox(732, 840, hasCause('Preventive'))
  markCheckbox(871, 840, hasCause('Psychiatry'))
  markCheckbox(1007, 840, hasCause('Work Related'))
  drawWrappedTextAt(88, 902, 1180, formData.otherCause, 8, 2)
  markCheckbox(426, 964, Boolean(formData.assessmentAcute))
  markCheckbox(518, 964, Boolean(formData.assessmentChronic))
  markCheckbox(635, 964, Boolean(formData.assessmentConfirmed))
  markCheckbox(778, 964, Boolean(formData.assessmentSuspected))
  drawWrappedTextAt(200, 1032, 1080, formData.comments, 8.5, 2)

  // Medical plan
  markCheckbox(92, 1160, Boolean(formData.consultation))
  markCheckbox(245, 1160, Boolean(formData.physiotherapy))
  markCheckbox(423, 1160, Boolean(formData.laboratory))
  markCheckbox(563, 1160, Boolean(formData.radiology))
  markCheckbox(704, 1160, Boolean(formData.pharmacy))
  markCheckbox(840, 1160, Boolean(formData.otherMedical))
  drawTextAt(900, 1160, formData.otherMedical, 9, 320)

  drawWrappedTextAt(88, 1288, 600, formData.preAuthorizationDetails, 8, 2)
  drawTextAt(732, 1226, formData.approvedTariff ? 'X' : '', 9, 20)
  drawTextAt(900, 1283, formData.approvalCode, 10, 340)
  drawWrappedTextAt(88, 1360, 600, formData.proposedTreatment, 8, 5)
  drawTextAt(180, 1510, formData.estimatedCost, 9, 250)

  // In-patient
  drawTextAt(88, 1610, formData.lengthOfStay, 10, 240)
  drawTextAt(420, 1610, formData.inPatientProvider, 10, 520)
  drawTextAt(1092, 1610, formData.inPatientCost, 10, 220)

  // Physician / signatures
  drawTextAt(330, 1735, formData.treatingPhysicianName, 10, 500)
  drawTextAt(230, 1799, formData.telFax, 10, 460)
  drawTextAt(88, 1965, formatDate(formData.date), 10, 200)
  drawTextAt(870, 1965, formatDate(formData.date), 10, 200)
}

function formatDate(dateValue: any): string {
  if (!dateValue) return ''
  if (typeof dateValue === 'string') return dateValue
  if (dateValue instanceof Date) {
    return dateValue.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
  return String(dateValue)
}
