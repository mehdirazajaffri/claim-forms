import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { generateVisitNotePdf, visitNotePdfFilename } from '@/lib/visit-note-pdf'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const visitNote = await prisma.visitNote.findUnique({
      where: { id: params.id },
    })

    if (!visitNote) {
      return NextResponse.json({ error: 'Visit note not found' }, { status: 404 })
    }

    const pdfBytes = await generateVisitNotePdf(visitNote)
    const filename = visitNotePdfFilename(visitNote)

    return new NextResponse(pdfBytes as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Failed to download visit note', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
