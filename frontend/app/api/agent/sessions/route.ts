import { NextRequest, NextResponse } from 'next/server';

const ADK_BACKEND_URL = process.env.ADK_BACKEND_URL || 'http://localhost:8000';

// Create a new session
export async function POST(request: NextRequest) {
  try {
    const { appName, userId, sessionId, state = {} } = await request.json();

    if (!appName || !userId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: appName, userId, sessionId' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${ADK_BACKEND_URL}/apps/${appName}/users/${userId}/sessions/${sessionId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(state),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      // 409 Conflict means session already exists - that's OK
      if (response.status === 409) {
        return NextResponse.json({ exists: true, sessionId });
      }
      return NextResponse.json(
        { error: `ADK Backend error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 }
    );
  }
}

