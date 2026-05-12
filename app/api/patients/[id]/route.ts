import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
