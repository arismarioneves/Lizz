import readline from 'readline'
import chalk from 'chalk'
import ora, { type Ora } from 'ora'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { initDatabase } from './db.js'
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
import { buildMemoryContext, saveConversationTurn, runDecaySweep } from './memory.js'
import { buildConnectionsContext } from './connections/index.js'
import { formatForTui } from './format.js'
import { TUI_CHAT_ID, STORE_DIR } from './config.js'
import { logger } from './logger.js'

// ─── Constants ───────────────────────────────────────────────────────────────

const BANNER = [
  '\x1b[31m  ██  ██  \x1b[0m',
  '\x1b[31m  ██  ██  \x1b[0m  \x1b[1;97mLizz TUI\x1b[0m',
  '\x1b[31m  ██  ██  \x1b[0m',
  '\x1b[31m██  ██  ██\x1b[0m',
  '\x1b[31m██████████\x1b[0m',
].join('\n')

export const TUI_COMMANDS = ['/newchat', '/memory', '/schedule', '/help', '/exit']

// ─── Completer ───────────────────────────────────────────────────────────────

export function completer(line: string): [string[], string] {
  if (!line.startsWith('/')) return [[], line]
  const hits = TUI_COMMANDS.filter((c) => c.startsWith(line))
  return [hits.length ? hits : TUI_COMMANDS, line]
}

// ─── Conversation history (in-memory) ────────────────────────────────────────

interface ConversationTurn {
  role: 'user' | 'assistant'
  text: string
}

const conversation: ConversationTurn[] = []

// ─── State ───────────────────────────────────────────────────────────────────

let isProcessing = false
let cancelled = false
let spinner: Ora | null = null

// ─── Command handlers ────────────────────────────────────────────────────────

function cmdNewchat(): void {
  clearSession(TUI_CHAT_ID)
  console.log(chalk.green('Session cleared. Starting fresh.'))
}

function cmdMemory(): void {
  const memories = getRecentMemories(TUI_CHAT_ID, 10)
  if (memories.length === 0) {
    console.log(chalk.dim('No memories stored yet.'))
    return
  }
  memories.forEach((m, i) => {
    console.log(
      chalk.dim(`${i + 1}.`) + ` [${chalk.cyan(m.sector)}] ${m.content.replace(/\n/g, ' ')}`
    )
  })
}

function cmdSchedule(parts: string[]): void {
  const subcmd = parts[1]

  switch (subcmd) {
    case 'list': {
      const tasks = listTasks()
      if (tasks.length === 0) {
        console.log(chalk.dim('No scheduled tasks.'))
        return
      }
      for (const t of tasks) {
        const next = new Date(t.next_run * 1000).toLocaleString()
        console.log(`  ${chalk.bold(t.status)} — ${t.prompt}`)
        console.log(`  ${chalk.dim(t.schedule)} — next: ${next}`)
        console.log(`  ID: ${chalk.dim(t.id.slice(0, 8))}`)
        console.log()
      }
      break
    }
    case 'pause': {
      const id = parts[2]
      if (!id) {
        console.log('Usage: /schedule pause <id>')
        return
      }
      const task = listTasks().find((t) => t.id.startsWith(id))
      if (!task) {
        console.log(chalk.red(`No task matching "${id}".`))
        return
      }
      pauseTask(task.id)
      console.log(chalk.green(`Task paused: ${task.prompt}`))
      break
    }
    case 'resume': {
      const id = parts[2]
      if (!id) {
        console.log('Usage: /schedule resume <id>')
        return
      }
      const task = listTasks().find((t) => t.id.startsWith(id))
      if (!task) {
        console.log(chalk.red(`No task matching "${id}".`))
        return
      }
      resumeTask(task.id)
      console.log(chalk.green(`Task resumed: ${task.prompt}`))
      break
    }
    case 'delete': {
      const id = parts[2]
      if (!id) {
        console.log('Usage: /schedule delete <id>')
        return
      }
      const task = listTasks().find((t) => t.id.startsWith(id))
      if (!task) {
        console.log(chalk.red(`No task matching "${id}".`))
        return
      }
      deleteTask(task.id)
      console.log(chalk.green(`Task deleted: ${task.prompt}`))
      break
    }
    default:
      console.log(`Schedule commands:
  /schedule list
  /schedule pause <id>
  /schedule resume <id>
  /schedule delete <id>`)
  }
}

function cmdHelp(): void {
  console.log(`${chalk.bold('Commands:')}
  ${chalk.cyan('/newchat')}    Start a new conversation
  ${chalk.cyan('/memory')}     List stored memories
  ${chalk.cyan('/schedule')}   Manage scheduled tasks
  ${chalk.cyan('/help')}       Show this help
  ${chalk.cyan('/exit')}       Exit Lizz TUI

${chalk.bold('Shortcuts:')}
  ${chalk.dim('Enter')}       Send message
  ${chalk.dim('Ctrl+C')}      Exit
  ${chalk.dim('Esc')}         Cancel response in progress
  ${chalk.dim('Ctrl+L')}      Clear screen
  ${chalk.dim('↑ / ↓')}       Navigate input history
  ${chalk.dim('Tab')}         Autocomplete commands
  ${chalk.dim('Ctrl+S')}      Save conversation to file`)
}

/** Returns true if input was handled as a command */
export function handleCommand(input: string): boolean {
  const parts = input.trim().split(/\s+/)
  const cmd = parts[0]

  switch (cmd) {
    case '/newchat':
      cmdNewchat()
      return true
    case '/memory':
      cmdMemory()
      return true
    case '/schedule':
      cmdSchedule(parts)
      return true
    case '/help':
      cmdHelp()
      return true
    case '/exit':
      console.log(chalk.dim('Bye!'))
      process.exit(0)
    default:
      return false
  }
}

// ─── Save conversation to file ───────────────────────────────────────────────

function saveConversationToFile(): void {
  if (conversation.length === 0) {
    console.log(chalk.dim('No conversation to save.'))
    return
  }
  const chatsDir = path.join(process.cwd(), 'chats')
  mkdirSync(chatsDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `lizz-chat-${timestamp}.txt`
  const filepath = path.join(chatsDir, filename)
  const content = conversation
    .map((t) => `${t.role === 'user' ? 'You' : 'Lizz'}:\n${t.text}\n`)
    .join('\n')
  writeFileSync(filepath, content)
  console.log(chalk.green(`Conversation saved to chats/${filename}`))
}

// ─── Message handler ─────────────────────────────────────────────────────────

async function handleMessage(rawText: string): Promise<void> {
  const connectionCtx = buildConnectionsContext()
  const memCtx = await buildMemoryContext(TUI_CHAT_ID, rawText)
  const ctxParts = [connectionCtx, memCtx].filter(Boolean)
  const fullMessage = ctxParts.length > 0 ? `${ctxParts.join('\n\n')}\n\n${rawText}` : rawText

  const sessionId = getSession(TUI_CHAT_ID)

  isProcessing = true
  cancelled = false
  spinner = ora({ text: 'Thinking...', color: 'cyan' }).start()

  try {
    const { text, newSessionId } = await runAgent(
      fullMessage,
      sessionId,
      () => {}, // onTyping is a no-op — spinner provides visual feedback
      process.cwd()
    )

    spinner.stop()
    isProcessing = false

    if (cancelled) {
      console.log(chalk.dim('(cancelled)'))
      return
    }

    if (newSessionId) {
      setSession(TUI_CHAT_ID, newSessionId)
    }

    const response = text ?? '(no response)'

    conversation.push({ role: 'user', text: rawText })
    conversation.push({ role: 'assistant', text: response })

    if (text) {
      await saveConversationTurn(TUI_CHAT_ID, rawText, text)
    }

    console.log(chalk.green.bold('\nLizz >'))
    console.log(formatForTui(response))
    console.log(chalk.dim('─'.repeat(56)))
  } catch (err) {
    if (spinner) spinner.stop()
    isProcessing = false
    logger.error({ err }, 'TUI message handler error')
    console.log(chalk.red('Something went wrong.'))
  }
}

// ─── Main TUI ────────────────────────────────────────────────────────────────

export function createTui(): void {
  // Suppress info-level logs (e.g. "Database initialized") in TUI mode
  logger.level = 'warn'

  console.log(BANNER)
  console.log()

  mkdirSync(STORE_DIR, { recursive: true })
  initDatabase()
  runDecaySweep()

  console.log(chalk.dim('Type a message to chat with Lizz. /help for commands. Ctrl+C to exit.'))
  console.log(chalk.dim('─'.repeat(56)))
  console.log()

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer,
    terminal: true,
    prompt: chalk.blue.bold('You > '),
  })

  // ── Keypress handlers ────────────────────────────────────────────────────────
  process.stdin.on('keypress', (_str: string, key: readline.Key) => {
    if (!key) return

    if (key.name === 'escape' && isProcessing) {
      cancelled = true
      if (spinner) spinner.stop()
      isProcessing = false
      console.log(chalk.dim('(cancelled)'))
      rl.prompt()
    }

    if (key.ctrl && key.name === 'l') {
      console.clear()
      console.log(BANNER)
      console.log()
      rl.prompt()
    }

    if (key.ctrl && key.name === 's') {
      saveConversationToFile()
    }
  })

  // ── Line handler ─────────────────────────────────────────────────────────────
  rl.on('line', async (input: string) => {
    const trimmed = input.trim()
    if (!trimmed) {
      rl.prompt()
      return
    }

    if (trimmed.startsWith('/')) {
      if (!handleCommand(trimmed)) {
        console.log(chalk.red(`Unknown command: ${trimmed.split(/\s+/)[0]}`))
        console.log(chalk.dim('Type /help for available commands.'))
      }
      console.log()
      rl.prompt()
      return
    }

    await handleMessage(trimmed)
    rl.prompt()
  })

  rl.on('close', () => {
    console.log(chalk.dim('\nBye!'))
    process.exit(0)
  })

  rl.prompt()
}

// ── Run when executed directly ───────────────────────────────────────────────

const isMain =
  process.argv[1] !== undefined &&
  (process.argv[1].endsWith('tui.js') || process.argv[1].endsWith('tui.ts'))

if (isMain) {
  createTui()
}
