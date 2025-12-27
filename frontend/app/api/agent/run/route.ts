import { NextRequest, NextResponse } from 'next/server';

const ADK_BACKEND_URL = process.env.ADK_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${ADK_BACKEND_URL}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `ADK Backend error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to ADK backend:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to connect to ADK backend' },
      { status: 500 }
    );
  }
}

