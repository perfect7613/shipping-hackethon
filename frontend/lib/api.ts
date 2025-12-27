import axios from 'axios';

// Use the Next.js API route as a proxy to avoid CORS issues
const API_BASE_URL = '/api/agent';

// Create a new session (must be called before sending messages)
export async function createSession(
  userId: string,
  sessionId: string,
  initialState: Record<string, unknown> = {}
): Promise<{ sessionId: string; exists?: boolean }> {
  const response = await axios.post(`${API_BASE_URL}/sessions`, {
    appName: 'agent',
    userId,
    sessionId,
    state: initialState,
  });
  return response.data;
}

export interface ComicPanel {
  panelId: number;
  narration: string;
  imagePrompt: string;
  imageUrl?: string;
  audioBase64?: string;
  localImagePath?: string;
  localAudioPath?: string;
}

export interface ComicStory {
  title: string;
  theme: string;
  language: string;
  panels: ComicPanel[];
}

export interface AgentEvent {
  id: string;
  author: string;
  timestamp: string;
  content?: {
    role: string;
    parts: Array<{ text?: string }>;
  };
  actions?: {
    stateDelta?: Record<string, unknown>;
  };
}

export interface RunAgentRequest {
  appName: string;
  userId: string;
  sessionId: string;
  newMessage: {
    role: string;
    parts: Array<{ text: string }>;
  };
  streaming?: boolean;
}

export interface RunAgentResponse {
  events: AgentEvent[];
}

// Generate a unique session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Generate a unique user ID
export function generateUserId(): string {
  return `user_${Math.random().toString(36).substring(2, 11)}`;
}

// Run the comic generator agent
export async function runComicAgent(
  storyPrompt: string,
  userId: string,
  sessionId: string
): Promise<AgentEvent[]> {
  const response = await axios.post<AgentEvent[]>(`${API_BASE_URL}/run`, {
    appName: 'agent',
    userId,
    sessionId,
    newMessage: {
      role: 'user',
      parts: [{ text: storyPrompt }],
    },
    streaming: false,
  });

  return response.data;
}

// Run the agent with SSE streaming
export async function runComicAgentStream(
  storyPrompt: string,
  userId: string,
  sessionId: string,
  onEvent: (event: AgentEvent) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/run_sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appName: 'agent',
        userId,
        sessionId,
        newMessage: {
          role: 'user',
          parts: [{ text: storyPrompt }],
        },
        streaming: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(line.slice(6));
            onEvent(eventData);
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error'));
  }
}

// Parse the comic story from agent events
export function parseComicStory(events: AgentEvent[]): ComicStory | null {
  // Look for the final response with comic data in state
  for (const event of events) {
    if (event.actions?.stateDelta) {
      const delta = event.actions.stateDelta;
      if (delta.comic_story || delta.panels) {
        return delta as unknown as ComicStory;
      }
    }
    // Also check content for JSON response
    if (event.content?.parts) {
      for (const part of event.content.parts) {
        if (part.text) {
          try {
            const parsed = JSON.parse(part.text);
            if (parsed.panels || parsed.title) {
              return parsed as ComicStory;
            }
          } catch {
            // Not JSON, continue
          }
        }
      }
    }
  }
  return null;
}

// Get the final text response from events
export function getFinalResponse(events: AgentEvent[]): string {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.content?.parts) {
      for (const part of event.content.parts) {
        if (part.text) return part.text;
      }
    }
  }
  return '';
}

