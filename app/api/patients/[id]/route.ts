import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: {
        claims: true,
      },
    })
    
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }
    
    return NextResponse.json(patient)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 })
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

    const data: {
      cardNumber?: string
      name?: string
      birthDate?: string | null
      sex?: string | null
      policyNo?: string | null
      assessmentFileLink?: string | null
    } = {}

    if (typeof body.cardNumber === 'string') data.cardNumber = body.cardNumber.trim()
    if (typeof body.name === 'string') data.name = body.name.trim()
    if ('birthDate' in body) data.birthDate = body.birthDate || null
    if ('sex' in body) data.sex = body.sex || null
    if ('policyNo' in body) data.policyNo = body.policyNo ? String(body.policyNo).trim() : null
    if ('assessmentFileLink' in body) {
      data.assessmentFileLink = body.assessmentFileLink ? String(body.assessmentFileLink).trim() : null
    }

    if (data.cardNumber === '' || data.name === '') {
      return NextResponse.json(
        { error: 'Emirates ID and patient name are required.' },
        { status: 400 }
      )
    }

    if (data.cardNumber) {
      const conflict = await prisma.patient.findFirst({
        where: {
          cardNumber: data.cardNumber,
          NOT: { id: params.id },
        },
        select: { id: true },
      })
      if (conflict) {
        return NextResponse.json(
          { error: 'Another patient already uses this Emirates ID.' },
          { status: 409 }
        )
      }
    }

    const patient = await prisma.patient.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(patient)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Delete all claims for this patient first
    await prisma.claim.deleteMany({
      where: { patientId: params.id },
    })
    
    // Then delete the patient
    const patient = await prisma.patient.delete({
      where: { id: params.id },
    })
    
    return NextResponse.json({ success: true, patient })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 })
  }
}
