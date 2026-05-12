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
