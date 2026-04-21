import { query } from '@anthropic-ai/claude-agent-sdk'
import { PROJECT_ROOT, TYPING_REFRESH_MS } from './config.js'
import { logger } from './logger.js'

export class ClaudeDisconnectedError extends Error {
  constructor() {
    super('Claude Code is not authenticated or not installed')
    this.name = 'ClaudeDisconnectedError'
  }
}

export interface AgentResult {
  text: string | null
  newSessionId?: string
}

export async function runAgent(
  message: string,
  sessionId?: string,
  onTyping?: () => void,
  cwd?: string
): Promise<AgentResult> {
  let text: string | null = null
  let newSessionId: string | undefined

  let typingInterval: ReturnType<typeof setInterval> | undefined
  if (onTyping) {
    typingInterval = setInterval(onTyping, TYPING_REFRESH_MS)
  }

  try {
    for await (const event of query({
      prompt: message,
      options: {
        cwd: cwd ?? PROJECT_ROOT,
        settingSources: ['project', 'user'],
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        ...(sessionId ? { resume: sessionId } : {}),
      },
    })) {
      const e = event as Record<string, unknown>

      if (e['type'] === 'system' && e['subtype'] === 'init') {
        newSessionId = e['session_id'] as string | undefined
        logger.debug({ sessionId: newSessionId }, 'Agent session initialized')
      } else if (e['type'] === 'result') {
        text = (e['result'] as string | undefined) ?? null
        logger.debug({ length: text?.length }, 'Agent result received')
      }
    }
  } catch (err) {
    logger.error({ err }, 'Agent error')
    if (err instanceof Error && err.message.includes('process exited with code 1')) {
      throw new ClaudeDisconnectedError()
    }
    throw err
  } finally {
    if (typingInterval) clearInterval(typingInterval)
  }

  return { text, newSessionId }
}
