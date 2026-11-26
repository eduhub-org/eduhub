import type { IncomingMessage } from './limits';
import { ChatMessage, ChatProvider, ProviderError, Usage } from './provider';
import type { ReportDraft } from './reports';
import type { ProposalEvent, ToolSet } from './tools';

/**
 * One reply of the Assistant: the model answers, may call tools, gets their results and answers
 * again, for at most `maxToolRounds` rounds; the last round offers no tools, so it must answer.
 * A tool call whose arguments don't validate is answered with the validation error and the model
 * may try once more per reply; a second invalid call ends the reply (issue #2193).
 */

export type ChatEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool'; name: string; status: 'running' | 'done' | 'failed' }
  | { type: 'proposal'; proposal: ProposalEvent }
  | { type: 'report'; report: ReportDraft }
  | { type: 'error'; code: ChatErrorCode };

export type ChatErrorCode = 'TOOL_CALL_FAILED' | 'BUSY' | 'UNAVAILABLE';

export interface ChatSummary {
  outcome: 'ok' | 'aborted' | ChatErrorCode;
  rounds: number;
  tools: Record<string, number>;
  invalidToolCalls: number;
  toolErrors: number;
  proposals: number;
  reports: number;
  usage: Usage;
}

export const runChat = async ({
  provider,
  tools,
  system,
  messages,
  maxToolRounds,
  emit,
  signal,
}: {
  provider: ChatProvider;
  tools: ToolSet;
  system: string;
  messages: IncomingMessage[];
  maxToolRounds: number;
  emit: (event: ChatEvent) => void;
  signal?: AbortSignal;
}): Promise<ChatSummary> => {
  const summary: ChatSummary = {
    outcome: 'ok',
    rounds: 0,
    tools: {},
    invalidToolCalls: 0,
    toolErrors: 0,
    proposals: 0,
    reports: 0,
    usage: { inputTokens: 0, outputTokens: 0 },
  };
  const conversation: ChatMessage[] = [{ role: 'system', content: system }, ...messages];
  const rounds = Math.max(1, maxToolRounds);

  try {
    for (let round = 0; round < rounds; round += 1) {
      const lastRound = round === rounds - 1;
      const turn = await provider.complete({
        messages: conversation,
        tools: lastRound ? [] : tools.definitions,
        onText: (delta) => emit({ type: 'text', delta }),
        signal,
      });
      summary.rounds += 1;
      summary.usage.inputTokens += turn.usage.inputTokens;
      summary.usage.outputTokens += turn.usage.outputTokens;
      if (!turn.toolCalls.length || lastRound) return summary;

      conversation.push({
        role: 'assistant',
        content: turn.text || null,
        tool_calls: turn.toolCalls.map((c) => ({
          id: c.id,
          type: 'function' as const,
          function: { name: c.name, arguments: c.arguments },
          ...(c.extraContent !== undefined ? { extra_content: c.extraContent } : {}),
        })),
      });
      for (const call of turn.toolCalls) {
        if (signal?.aborted) return { ...summary, outcome: 'aborted' };
        emit({ type: 'tool', name: call.name, status: 'running' });
        const result = await tools.call(call.name, call.arguments);
        // Only names the model was offered are counted, so the metric holds no model-made text.
        if (tools.definitions.some((d) => d.function.name === call.name)) {
          summary.tools[call.name] = (summary.tools[call.name] ?? 0) + 1;
        }
        if (result.status === 'invalid') {
          summary.invalidToolCalls += 1;
          emit({ type: 'tool', name: call.name, status: 'failed' });
          if (summary.invalidToolCalls > 1) {
            emit({ type: 'error', code: 'TOOL_CALL_FAILED' });
            return { ...summary, outcome: 'TOOL_CALL_FAILED' };
          }
        } else if (result.status === 'error') {
          summary.toolErrors += 1;
          emit({ type: 'tool', name: call.name, status: 'failed' });
        } else {
          emit({ type: 'tool', name: call.name, status: 'done' });
          if (result.proposal) {
            summary.proposals += 1;
            emit({ type: 'proposal', proposal: result.proposal });
          }
          if (result.report) {
            summary.reports += 1;
            emit({ type: 'report', report: result.report });
          }
        }
        conversation.push({ role: 'tool', tool_call_id: call.id, content: result.content });
      }
    }
    return summary;
  } catch (error) {
    if (signal?.aborted || (error as Error)?.name === 'AbortError') return { ...summary, outcome: 'aborted' };
    const code: ChatErrorCode = error instanceof ProviderError && error.code === 'PROVIDER_BUSY' ? 'BUSY' : 'UNAVAILABLE';
    // A ProviderError's message is only its code and HTTP status; of any other error only the
    // name is logged, as its message could quote the conversation.
    console.error(
      `Assistant: the model call failed: ${error instanceof ProviderError ? error.message : (error as Error)?.name ?? 'unknown'}`
    );
    emit({ type: 'error', code });
    return { ...summary, outcome: code };
  }
};
