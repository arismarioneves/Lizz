import { Bot } from 'grammy'
import { TELEGRAM_BOT_TOKEN, ALLOWED_CHAT_ID, MAX_MESSAGE_LENGTH, setAllowedChatId } from './config.js'
import {
  getSession,
  setSession,
  clearSession,
  getRecentMemories,
  listTasks,
  pauseTask,
  resumeTask,
  deleteTask,
} from './db.js'
import { runAgent } from './agent.js'
import { buildMemoryContext, saveConversationTurn } from './memory.js'
import { downloadMedia, buildPhotoMessage, buildDocumentMessage } from './media.js'
import { formatForTelegram, splitMessage } from './format.js'
import { logger } from './logger.js'

export { formatForTelegram, splitMessage }

// ─── Auth ────────────────────────────────────────────────────────────────────

export function isAuthorised(chatId: number | string): boolean {
  if (!ALLOWED_CHAT_ID) return true // first-run: no ID configured yet
  return String(chatId) === String(ALLOWED_CHAT_ID)
}

// ─── Core message handler ────────────────────────────────────────────────────

async function handleMessage(
  chatId: number,
  rawText: string,
  reply: (text: string, opts?: Record<string, unknown>) => Promise<unknown>,
  sendTyping: () => Promise<unknown>
): Promise<void> {
  const chatIdStr = String(chatId)

  const memCtx = await buildMemoryContext(chatIdStr, rawText)
  const fullMessage = memCtx ? `${memCtx}\n\n${rawText}` : rawText

  const sessionId = getSession(chatIdStr)

  await sendTyping()
  const { text, newSessionId } = await runAgent(fullMessage, sessionId, () => {
    sendTyping().catch(() => { })
  })

  if (newSessionId) {
    setSession(chatIdStr, newSessionId)
  }

  const response = text ?? '(no response)'

  if (text) {
    await saveConversationTurn(chatIdStr, rawText, text)
  }

  const formatted = formatForTelegram(response)
  const chunks = splitMessage(formatted)

  for (const chunk of chunks) {
    await reply(chunk, { parse_mode: 'HTML' })
  }
}

// ─── Bot factory ─────────────────────────────────────────────────────────────

export function createBot(): Bot {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set. Run npm run setup.')
  }

  const bot = new Bot(TELEGRAM_BOT_TOKEN)

  // ── /start ──────────────────────────────────────────────────────────────────
  bot.command('start', async (ctx) => {
    if (!ALLOWED_CHAT_ID) {
      // First run: auto-register this chat
      setAllowedChatId(String(ctx.chat.id))
      logger.info({ chatId: ctx.chat.id }, 'Auto-registered chat ID')
      await ctx.reply(
        `Chat ID registered: <code>${ctx.chat.id}</code>\n\nMyClaw is ready. Send me anything.`,
        { parse_mode: 'HTML' }
      )
      return
    }
    if (!isAuthorised(ctx.chat.id)) return
    await ctx.reply('MyClaw is running.\n\nSend me anything.')
  })

  // ── /chatid ─────────────────────────────────────────────────────────────────
  bot.command('chatid', async (ctx) => {
    await ctx.reply(`Your chat ID: <code>${ctx.chat.id}</code>`, { parse_mode: 'HTML' })
  })

  // ── /newchat ─────────────────────────────────────────────────────────────────
  bot.command('newchat', async (ctx) => {
    if (!isAuthorised(ctx.chat.id)) return
    clearSession(String(ctx.chat.id))
    await ctx.reply('Session cleared. Starting fresh.')
  })

  // ── /forget ──────────────────────────────────────────────────────────────────
  bot.command('forget', async (ctx) => {
    if (!isAuthorised(ctx.chat.id)) return
    clearSession(String(ctx.chat.id))
    await ctx.reply('Session cleared.')
  })

  // ── /memory ──────────────────────────────────────────────────────────────────
  bot.command('memory', async (ctx) => {
    if (!isAuthorised(ctx.chat.id)) return
    const memories = getRecentMemories(String(ctx.chat.id), 10)
    if (memories.length === 0) {
      await ctx.reply('No memories stored yet.')
      return
    }
    const lines = memories
      .map((m, i) => `${i + 1}. [${m.sector}] ${m.content.replace(/\n/g, ' ')}`)
      .join('\n\n')
    await ctx.reply(lines.slice(0, MAX_MESSAGE_LENGTH))
  })

  // ── /schedule ─────────────────────────────────────────────────────────────────
  bot.command('schedule', async (ctx) => {
    if (!isAuthorised(ctx.chat.id)) return
    const parts = (ctx.message?.text ?? '').split(' ').slice(1)
    const subcmd = parts[0]

    switch (subcmd) {
      case 'list': {
        const tasks = listTasks()
        if (tasks.length === 0) {
          await ctx.reply('No scheduled tasks.')
          return
        }
        const lines = tasks.map((t) => {
          const next = new Date(t.next_run * 1000).toLocaleString()
          return `• <b>${t.status}</b> — ${t.prompt}\n  <code>${t.schedule}</code> — next: ${next}\n  ID: <code>${t.id.slice(0, 8)}</code>`
        })
        await ctx.reply(lines.join('\n\n'), { parse_mode: 'HTML' })
        break
      }
      case 'pause': {
        const id = parts[1]
        if (!id) { await ctx.reply('Usage: /schedule pause <id>'); return }
        const task = listTasks().find((t) => t.id.startsWith(id))
        if (!task) { await ctx.reply(`No task matching "${id}".`); return }
        pauseTask(task.id)
        await ctx.reply(`Task paused: ${task.prompt}`)
        break
      }
      case 'resume': {
        const id = parts[1]
        if (!id) { await ctx.reply('Usage: /schedule resume <id>'); return }
        const task = listTasks().find((t) => t.id.startsWith(id))
        if (!task) { await ctx.reply(`No task matching "${id}".`); return }
        resumeTask(task.id)
        await ctx.reply(`Task resumed: ${task.prompt}`)
        break
      }
      case 'delete': {
        const id = parts[1]
        if (!id) { await ctx.reply('Usage: /schedule delete <id>'); return }
        const task = listTasks().find((t) => t.id.startsWith(id))
        if (!task) { await ctx.reply(`No task matching "${id}".`); return }
        deleteTask(task.id)
        await ctx.reply(`Task deleted: ${task.prompt}`)
        break
      }
      default:
        await ctx.reply(
          'Schedule commands:\n' +
          '/schedule list\n' +
          '/schedule pause &lt;id&gt;\n' +
          '/schedule resume &lt;id&gt;\n' +
          '/schedule delete &lt;id&gt;\n\n' +
          'To create tasks, use:\n' +
          '<code>node dist/schedule-cli.js create "prompt" "0 9 * * *" CHAT_ID</code>',
          { parse_mode: 'HTML' }
        )
    }
  })

  // ── text ──────────────────────────────────────────────────────────────────────
  bot.on('message:text', async (ctx) => {
    if (!isAuthorised(ctx.chat.id)) return
    const sendTyping = () => ctx.api.sendChatAction(ctx.chat.id, 'typing')
    try {
      await handleMessage(
        ctx.chat.id,
        ctx.message.text,
        (text, opts) => ctx.reply(text, opts),
        sendTyping
      )
    } catch (err) {
      logger.error({ err }, 'Text message handler error')
      await ctx.reply('Something went wrong. Check the logs.').catch(() => { })
    }
  })

  // ── photo ─────────────────────────────────────────────────────────────────────
  bot.on('message:photo', async (ctx) => {
    if (!isAuthorised(ctx.chat.id)) return
    const sendTyping = () => ctx.api.sendChatAction(ctx.chat.id, 'typing')
    try {
      const photo = ctx.message.photo.at(-1)!
      const localPath = await downloadMedia(TELEGRAM_BOT_TOKEN, photo.file_id)
      const msgText = buildPhotoMessage(localPath, ctx.message.caption)
      await handleMessage(ctx.chat.id, msgText, (text, opts) => ctx.reply(text, opts), sendTyping)
    } catch (err) {
      logger.error({ err }, 'Photo handler error')
      await ctx.reply('Failed to process photo.').catch(() => { })
    }
  })

  // ── document ──────────────────────────────────────────────────────────────────
  bot.on('message:document', async (ctx) => {
    if (!isAuthorised(ctx.chat.id)) return
    const sendTyping = () => ctx.api.sendChatAction(ctx.chat.id, 'typing')
    try {
      const doc = ctx.message.document
      const localPath = await downloadMedia(TELEGRAM_BOT_TOKEN, doc.file_id, doc.file_name)
      const msgText = buildDocumentMessage(localPath, doc.file_name ?? 'document', ctx.message.caption)
      await handleMessage(ctx.chat.id, msgText, (text, opts) => ctx.reply(text, opts), sendTyping)
    } catch (err) {
      logger.error({ err }, 'Document handler error')
      await ctx.reply('Failed to process document.').catch(() => { })
    }
  })

  // ── voice (not enabled) ───────────────────────────────────────────────────────
  bot.on('message:voice', async (ctx) => {
    if (!isAuthorised(ctx.chat.id)) return
    await ctx.reply('Voice transcription is not enabled. Send a text message.')
  })

  // ── error handler ─────────────────────────────────────────────────────────────
  bot.catch((err) => {
    logger.error({ err: err.error, ctx: err.ctx?.update }, 'Bot error')
  })

  return bot
}
