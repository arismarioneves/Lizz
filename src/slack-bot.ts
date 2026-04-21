import Bolt from '@slack/bolt'
const { App } = Bolt
type SlackApp = InstanceType<typeof App>

import {
  SLACK_BOT_TOKEN,
  SLACK_APP_TOKEN,
  SLACK_SIGNING_SECRET,
  ALLOWED_SLACK_USER_ID,
} from './config.js'
import { getSession, setSession, clearSession } from './db.js'
import { runAgent, ClaudeDisconnectedError } from './agent.js'
import { buildMemoryContext, saveConversationTurn } from './memory.js'
import { buildConnectionsContext } from './connections/index.js'
import { formatForSlack, splitMessage } from './format.js'
import { downloadSlackFile, buildPhotoMessage, buildDocumentMessage } from './media.js'
import { logger } from './logger.js'

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorised(userId: string): boolean {
  if (!ALLOWED_SLACK_USER_ID) return true // open if not configured
  return userId === ALLOWED_SLACK_USER_ID
}

// ─── Reactions ────────────────────────────────────────────────────────────────

const REACTION_THINKING = 'eyes'
const REACTION_DONE = 'white_check_mark'

async function addReaction(
  client: SlackApp['client'],
  channel: string,
  timestamp: string,
  name: string
): Promise<void> {
  try {
    await client.reactions.add({ channel, timestamp, name })
  } catch {
    // ignore — reaction may already exist or permission denied
  }
}

async function removeReaction(
  client: SlackApp['client'],
  channel: string,
  timestamp: string,
  name: string
): Promise<void> {
  try {
    await client.reactions.remove({ channel, timestamp, name })
  } catch {
    // ignore — reaction may not exist
  }
}

// ─── Core handler ─────────────────────────────────────────────────────────────

async function handleMessage(
  channelId: string,
  userId: string,
  rawText: string,
  say: (msg: string) => Promise<unknown>,
  client?: SlackApp['client'],
  messageTs?: string
): Promise<void> {
  if (!isAuthorised(userId)) {
    logger.warn({ userId }, 'Unauthorised Slack message ignored')
    return
  }

  if (client && messageTs) {
    await addReaction(client, channelId, messageTs, REACTION_THINKING)
  }

  const connectionCtx = buildConnectionsContext()
  const memCtx = await buildMemoryContext(channelId, rawText)
  const ctxParts = [connectionCtx, memCtx].filter(Boolean)
  const fullMessage = ctxParts.length > 0 ? `${ctxParts.join('\n\n')}\n\n${rawText}` : rawText

  const sessionId = getSession(channelId)

  const { text, newSessionId } = await runAgent(fullMessage, sessionId)

  if (newSessionId) setSession(channelId, newSessionId)

  const response = text ?? '(no response)'

  if (text) {
    await saveConversationTurn(channelId, rawText, text)
  }

  const formatted = formatForSlack(response)
  const chunks = splitMessage(formatted)

  for (const chunk of chunks) {
    await say(chunk)
  }

  if (client && messageTs) {
    await removeReaction(client, channelId, messageTs, REACTION_THINKING)
    await addReaction(client, channelId, messageTs, REACTION_DONE)
  }
}

// ─── App factory ──────────────────────────────────────────────────────────────

export function createSlackApp(): SlackApp {
  if (!SLACK_BOT_TOKEN || !SLACK_APP_TOKEN) {
    throw new Error('SLACK_BOT_TOKEN and SLACK_APP_TOKEN must be set in .env')
  }

  const app = new App({
    token: SLACK_BOT_TOKEN,
    appToken: SLACK_APP_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET || 'unused',
    socketMode: true,
  })

  // ── /newchat ────────────────────────────────────────────────────────────────
  app.command('/newchat', async ({ command, ack, say }) => {
    await ack()
    clearSession(command.channel_id)
    await say('Session cleared. Starting fresh.')
  })

  // ── Direct messages ─────────────────────────────────────────────────────────
  app.message(async ({ message, say, client }) => {
    const msg = message as unknown as Record<string, unknown>

    // Ignore bot messages, edits, deletes (allow file_share)
    const subtype = msg['subtype'] as string | undefined
    if (subtype && subtype !== 'file_share') return
    if (msg['bot_id']) return

    const userId = msg['user'] as string | undefined
    const channelId = msg['channel'] as string | undefined
    const messageTs = msg['ts'] as string | undefined
    const text = (msg['text'] as string | undefined) ?? ''
    const files = (msg['files'] as Array<Record<string, unknown>> | undefined) ?? []

    if (!userId || !channelId) return
    if (!text.trim() && files.length === 0) return

    logger.info({ userId, channelId, fileCount: files.length }, 'Slack incoming message')

    try {
      const parts: string[] = []
      if (text.trim()) parts.push(text)

      for (const file of files) {
        const url = file['url_private_download'] as string | undefined
        const name = (file['name'] as string | undefined) ?? 'file'
        const mimetype = (file['mimetype'] as string | undefined) ?? ''

        if (!url) {
          logger.warn({ name }, 'Slack file has no url_private_download')
          parts.push(`[File received but not downloadable: ${name}]`)
          continue
        }

        try {
          const localPath = await downloadSlackFile(SLACK_BOT_TOKEN, url, name)
          if (mimetype.startsWith('image/')) {
            parts.push(buildPhotoMessage(localPath))
          } else {
            parts.push(buildDocumentMessage(localPath, name))
          }
        } catch (err) {
          logger.error({ err, name }, 'Slack file download error')
          parts.push(`[Failed to download file: ${name}]`)
        }
      }

      const combined = parts.join('\n\n')
      if (!combined.trim()) {
        logger.warn({ channelId }, 'Slack message produced empty prompt, ignoring')
        return
      }

      logger.debug({ channelId, promptLength: combined.length }, 'Sending to agent')
      await handleMessage(channelId, userId, combined, (m) => say(m), client, messageTs)
    } catch (err) {
      if (err instanceof ClaudeDisconnectedError) {
        await say('Claude Code is disconnected. An admin needs to run `claude /login` on the server.').catch(() => { })
      } else {
        logger.error({ err }, 'Slack message handler error')
        await say('Something went wrong processing your request.').catch(() => { })
      }
    }
  })

  // ── App mentions (@bot in channels) ─────────────────────────────────────────
  app.event('app_mention', async ({ event, say, client }) => {
    const userId = event.user ?? ''
    const channelId = event.channel
    const messageTs = event.ts
    // Strip the bot mention tag from the text
    const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim()

    if (!text || !userId) return

    logger.info({ userId, channelId }, 'Slack app mention')

    try {
      await handleMessage(channelId, userId, text, (m) => say(m), client, messageTs)
    } catch (err) {
      if (err instanceof ClaudeDisconnectedError) {
        await say('Claude Code is disconnected. An admin needs to run `claude /login` on the server.').catch(() => { })
      } else {
        logger.error({ err }, 'Slack mention handler error')
        await say('Something went wrong processing your request.').catch(() => { })
      }
    }
  })

  app.error(async (error) => {
    logger.error({ error }, 'Slack app error')
  })

  return app
}
