import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;
    
    // Simulate marking all notifications as read
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return NextResponse.json(
      { message: `All ${type || 'all'} notifications marked as read` },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}