import { randomUUID } from 'expo-crypto';
import type { Preview } from './client';
import { ApiError } from './errors';
import { posthog } from '../config/posthog';

// Manual captures include the prompt and generated room document unless this is enabled.
const privacyMode = false;

type DecorationGeneration = {
  conversationId: string;
  kind: 'milestone' | 'prompt';
  startedAt: number;
  input?: string;
  output?: Preview;
  error?: unknown;
};

/** Records the result returned by the remote Anthropic-backed decoration service without delaying the request. */
export function captureDecorationGeneration({ conversationId, kind, startedAt, input, output, error }: DecorationGeneration) {
  try {
    const properties: Record<string, unknown> = {
      $ai_trace_id: randomUUID(),
      $ai_session_id: conversationId,
      $ai_span_id: randomUUID(),
      $ai_span_name: kind === 'prompt' ? 'decoration_preview' : 'milestone_preview',
      $ai_provider: 'anthropic',
      $ai_latency: (Date.now() - startedAt) / 1000,
    };

    if (!privacyMode && input) properties.$ai_input = [{ role: 'user', content: input }];
    if (!privacyMode && output) {
      properties.$ai_output_choices = [{
        role: 'assistant',
        content: JSON.stringify({
          sceneDocument: output.sceneDocument,
          roomPresentation: output.roomPresentation,
          roomThemeDocument: output.roomThemeDocument,
          placed: output.placed,
          requested: output.requested,
        }),
      }];
    }
    if (error !== undefined) {
      properties.$ai_is_error = true;
      properties.$ai_error = error instanceof ApiError ? error.code : 'REQUEST_FAILED';
    }

    posthog?.capture('$ai_generation', properties);
  } catch {
    // Observability must not affect the room-generation request or its recovery path.
  }
}
