import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVisitNotePdf, visitNotePdfFilename } from '@/lib/visit-note-pdf'

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const visitNote = await prisma.visitNote.findUnique({
      where: { shareToken: params.token },
    })

    if (!visitNote) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const pdfBytes = await generateVisitNotePdf(visitNote)
    const filename = visitNotePdfFilename(visitNote)
    const url = new URL(req.url)
    const inline = url.searchParams.get('inline') === '1'

    return new NextResponse(pdfBytes as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
        'Cache-Control': 'private, max-age=0, no-store',
      },
    })
  } catch (error) {
    console.error('Failed to fetch shared visit note', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
