import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Simulate marking notification as read
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return NextResponse.json(
      { message: `Notification ${params.id} marked as read` },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}