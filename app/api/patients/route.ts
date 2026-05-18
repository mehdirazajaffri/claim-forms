import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const patients = await prisma.patient.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        claims: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        visitNotes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })
    return NextResponse.json(patients)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    
    // Check if patient exists by card number
    const existingPatient = await prisma.patient.findUnique({
      where: { cardNumber: body.cardNumber },
    })
    
    if (existingPatient) {
      return NextResponse.json(existingPatient)
    }
    
    // Create new patient
    const patient = await prisma.patient.create({
      data: {
        cardNumber: body.cardNumber,
        name: body.name,
        birthDate: body.birthDate,
        sex: body.sex,
        policyNo: body.policyNo,
      },
    })
    
    return NextResponse.json(patient)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
  }
}
