import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Coerce cause: checkboxes may send boolean or array — normalize to string or null
    const causeRaw = body.cause
    const cause = typeof causeRaw === 'string' ? causeRaw || null
      : Array.isArray(causeRaw) ? causeRaw.filter(Boolean).join(', ') || null
      : null

    // Create claim
    const claim = await prisma.claim.create({
      data: {
        patientId: body.patientId,
        date: body.date,
        provider: body.provider,
        serviceDate: body.serviceDate,
        symptoms: body.symptoms,
        preExistingCondition: body.preExistingCondition || false,
        chronicMedications: body.chronicMedications || false,
        familyHistory: body.familyHistory || false,
        additionalNotes: body.additionalNotes,
        clinicalFindings: body.clinicalFindings,
        cause,
        otherCause: body.otherCause,
        assessmentAcute: body.assessmentAcute || false,
        assessmentChronic: body.assessmentChronic || false,
        assessmentConfirmed: body.assessmentConfirmed || false,
        assessmentSuspected: body.assessmentSuspected || false,
        comments: body.comments,
        consultation: body.consultation || false,
        physiotherapy: body.physiotherapy || false,
        laboratory: body.laboratory || false,
        radiology: body.radiology || false,
        pharmacy: body.pharmacy || false,
        otherMedical: body.otherMedical,
        preAuthorizationRequired: body.preAuthorizationRequired || false,
        preAuthorizationDetails: body.preAuthorizationDetails,
        proposedTreatment: body.proposedTreatment,
        estimatedCost: body.estimatedCost,
        lengthOfStay: body.lengthOfStay,
        inPatientProvider: body.inPatientProvider,
        inPatientCost: body.inPatientCost,
        treatingPhysicianName: body.treatingPhysicianName,
        telFax: body.telFax,
        approvedTariff: body.approvedTariff || false,
        approvalCode: body.approvalCode,
        signature: body.signature || null,
        physicianSignature: body.physicianSignature || null,
      },
    })
    
    return NextResponse.json(claim, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create claim' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const claims = await prisma.claim.findMany({
      include: {
        patient: true,
      },
    })
    return NextResponse.json(claims)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 })
  }
}
