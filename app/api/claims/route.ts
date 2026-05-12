import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
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
        cause: body.cause,
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
      },
    })
    
    return NextResponse.json(claim, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create claim' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
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
