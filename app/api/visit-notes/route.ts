import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { pickVisitNoteFields } from '@/lib/visit-note-fields'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const visitNotes = await prisma.visitNote.findMany({
      orderBy: { createdAt: 'desc' },
      include: { patient: true },
    })
    return NextResponse.json(visitNotes)
  } catch (error) {
    console.error('Failed to list visit notes', error)
    return NextResponse.json({ error: 'Failed to load visit notes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    if (!body.patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    const visitNote = await prisma.visitNote.create({
      data: {
        patientId: body.patientId,
        ...pickVisitNoteFields(body),
      },
    })

    return NextResponse.json(visitNote, { status: 201 })
  } catch (error) {
    console.error('Failed to create visit note', error)
    return NextResponse.json({ error: 'Failed to create visit note' }, { status: 500 })
  }
}
