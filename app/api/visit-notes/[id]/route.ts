import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { pickVisitNoteFields } from '@/lib/visit-note-fields'

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
      include: { patient: true },
    })

    if (!visitNote) {
      return NextResponse.json({ error: 'Visit note not found' }, { status: 404 })
    }

    return NextResponse.json(visitNote)
  } catch (error) {
    console.error('Failed to fetch visit note', error)
    return NextResponse.json({ error: 'Failed to load visit note' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    const visitNote = await prisma.visitNote.update({
      where: { id: params.id },
      data: pickVisitNoteFields(body),
    })

    return NextResponse.json(visitNote)
  } catch (error) {
    console.error('Failed to update visit note', error)
    return NextResponse.json({ error: 'Failed to update visit note' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.visitNote.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete visit note', error)
    return NextResponse.json({ error: 'Failed to delete visit note' }, { status: 500 })
  }
}
