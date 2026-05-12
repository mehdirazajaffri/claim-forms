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
