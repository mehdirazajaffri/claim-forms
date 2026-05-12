import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
  try {
    const body = await req.json()
    
    const claim = await prisma.claim.update({
      where: { id: params.id },
      data: body,
    })
    
    return NextResponse.json(claim)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 })
  }
}
