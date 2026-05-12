import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { fillPdfForm, getPdfFieldNames } from '@/lib/pdf-handler'
import { buildClaimLatex, compileClaimLatexPdf } from '@/lib/latex-claim'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const claim = await prisma.claim.findUnique({
      where: { id: params.id },
      include: { patient: true },
    })

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    const templatePath = path.join(process.cwd(), 'public', 'templates', 'claim-form.pdf')

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        {
          error: 'PDF template not found.',
          expectedPath: 'public/templates/claim-form.pdf',
          tip: 'Place the original claim PDF at public/templates/claim-form.pdf and try again.',
        },
        { status: 404 }
      )
    }

    const url = new URL(req.url)
    const debugFields = url.searchParams.get('debugFields') === '1'
    const engine = (url.searchParams.get('engine') || 'template').toLowerCase()

    if (!debugFields && !url.searchParams.get('source') && !url.searchParams.get('engine')) {
      return NextResponse.redirect(new URL(`/print/${claim.id}`, req.url))
    }

    const claimPayload = {
      ...claim,
      name: claim.patient?.name,
      cardNumber: claim.patient?.cardNumber,
      policyNo: claim.patient?.policyNo,
      birthDate: claim.patient?.birthDate,
      sex: claim.patient?.sex,
    }

    if (debugFields) {
      const fields = await getPdfFieldNames(templatePath)
      return NextResponse.json({ templatePath, fields })
    }

    if (engine === 'latex' && url.searchParams.get('source') === '1') {
      const texSource = buildClaimLatex(claimPayload)
      return new NextResponse(texSource, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="claim-${claim.id}.tex"`,
        },
      })
    }

    const pdfData =
      engine === 'latex'
        ? await compileClaimLatexPdf(claimPayload)
        : await fillPdfForm(templatePath, claimPayload)

    const safeName = (claim.patient?.name || 'patient').replace(/[^a-zA-Z0-9-_]/g, '_')
    const fileName = `claim-${claim.id}-${safeName}.pdf`

    return new NextResponse(pdfData as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Failed to generate PDF:', error)

    if (error instanceof Error && error.message === 'PDFLATEX_NOT_FOUND') {
      return NextResponse.json(
        {
          error: 'LaTeX engine requested, but pdflatex is not installed.',
          tip: 'Install MacTeX/TeX Live, or use the default template engine by removing engine=latex.',
        },
        { status: 501 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to generate PDF from template.',
        tip: 'Check field mappings in lib/pdf-handler.ts or LaTeX generation in lib/latex-claim.ts.',
      },
      { status: 500 }
    )
  }
}
