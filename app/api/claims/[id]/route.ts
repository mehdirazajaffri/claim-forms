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
    const claim = await prisma.claim.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
      },
    })
    
    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }
    
    return NextResponse.json(claim)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch claim' }, { status: 500 })
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

    const causeRaw = body.cause
    const cause = typeof causeRaw === 'string' ? causeRaw || null
      : Array.isArray(causeRaw) ? causeRaw.filter(Boolean).join(', ') || null
      : null

    const claim = await prisma.claim.update({
      where: { id: params.id },
      data: {
        date: body.date ?? null,
        provider: body.provider ?? null,
        serviceDate: body.serviceDate ?? null,
        symptoms: body.symptoms ?? null,
        preExistingCondition: body.preExistingCondition || false,
        chronicMedications: body.chronicMedications || false,
        familyHistory: body.familyHistory || false,
        additionalNotes: body.additionalNotes ?? null,
        clinicalFindings: body.clinicalFindings ?? null,
        cause,
        otherCause: body.otherCause ?? null,
        assessmentAcute: body.assessmentAcute || false,
        assessmentChronic: body.assessmentChronic || false,
        assessmentConfirmed: body.assessmentConfirmed || false,
        assessmentSuspected: body.assessmentSuspected || false,
        comments: body.comments ?? null,
        consultation: body.consultation || false,
        physiotherapy: body.physiotherapy || false,
        laboratory: body.laboratory || false,
        radiology: body.radiology || false,
        pharmacy: body.pharmacy || false,
        otherMedical: body.otherMedical ?? null,
        preAuthorizationRequired: body.preAuthorizationRequired || false,
        preAuthorizationDetails: body.preAuthorizationDetails ?? null,
        proposedTreatment: body.proposedTreatment ?? null,
        estimatedCost: body.estimatedCost ?? null,
        lengthOfStay: body.lengthOfStay ?? null,
        inPatientProvider: body.inPatientProvider ?? null,
        inPatientCost: body.inPatientCost ?? null,
        treatingPhysicianName: body.treatingPhysicianName ?? null,
        telFax: body.telFax ?? null,
        approvedTariff: body.approvedTariff || false,
        approvalCode: body.approvalCode ?? null,
        signature: body.signature ?? null,
        physicianSignature: body.physicianSignature ?? null,
        includeStamp: body.includeStamp || false,
        stampType: body.stampType || null,
      },
    })

    return NextResponse.json(claim)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 })
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
    const claim = await prisma.claim.delete({
      where: { id: params.id },
    })
    
    return NextResponse.json({ success: true, claim })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete claim' }, { status: 500 })
  }
}
