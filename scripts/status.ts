#!/usr/bin/env tsx
import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import os from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const c = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
}

const ok = (label: string, val = '') =>
  console.log(`  ${c.green}✓${c.reset} ${label.padEnd(30)} ${c.dim}${val}${c.reset}`)
const warn = (label: string, val = '') =>
  console.log(`  ${c.yellow}⚠${c.reset} ${label.padEnd(30)} ${c.dim}${val}${c.reset}`)
const fail = (label: string, val = '') =>
  console.log(`  ${c.red}✗${c.reset} ${label.padEnd(30)} ${c.dim}${val}${c.reset}`)

function parseEnvFile(): Record<string, string> {
  const envPath = path.join(PROJECT_ROOT, '.env')
  if (!existsSync(envPath)) return {}
  const result: Record<string, string> = {}
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

async function checkTelegramToken(token: string): Promise<string | null> {
  const https = await import('https')
  return new Promise((resolve) => {
    https.default
      .get(`https://api.telegram.org/bot${token}/getMe`, (res) => {
        let data = ''
        res.on('data', (chunk: Buffer) => (data += chunk.toString()))
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data) as { ok: boolean; result?: { username: string } }
            if (parsed.ok && parsed.result) resolve(parsed.result.username)
            else resolve(null)
          } catch {
            resolve(null)
          }
        })
      })
      .on('error', () => resolve(null))
  })
}

async function main() {
  console.log(`\n${c.bold}MyClaw Status${c.reset}\n`)

  const env = parseEnvFile()

  // ── Runtime ─────────────────────────────────────────────────────────────────
  console.log(`${c.bold}Runtime${c.reset}`)
  const nodeVer = parseInt(process.versions.node.split('.')[0] ?? '0', 10)
  if (nodeVer >= 20) ok('Node.js', process.versions.node)
  else fail('Node.js', `${process.versions.node} (need >= 20)`)

  try {
    const v = execSync('claude --version', { encoding: 'utf-8', stdio: 'pipe' }).trim()
    ok('Claude CLI', v)
  } catch {
    fail('Claude CLI', 'not found — install from claude.ai/code')
  }

  // ── Configuration ────────────────────────────────────────────────────────────
  console.log(`\n${c.bold}Configuration${c.reset}`)

  const token = env['TELEGRAM_BOT_TOKEN'] ?? ''
  if (token) ok('TELEGRAM_BOT_TOKEN', token.slice(0, 12) + '...')
  else fail('TELEGRAM_BOT_TOKEN', 'not set — run npm run setup')

  const chatId = env['ALLOWED_CHAT_ID'] ?? ''
  if (chatId) ok('ALLOWED_CHAT_ID', chatId)
  else warn('ALLOWED_CHAT_ID', 'not set (bot accepts all — first-run mode)')

  // ── Telegram API ─────────────────────────────────────────────────────────────
  if (token) {
    console.log(`\n${c.bold}Telegram${c.reset}`)
    const username = await checkTelegramToken(token)
    if (username) ok('Bot token valid', `@${username}`)
    else fail('Bot token invalid or network error')
  }

  // ── Database ─────────────────────────────────────────────────────────────────
  console.log(`\n${c.bold}Database${c.reset}`)
  const dbPath = path.join(PROJECT_ROOT, 'store', 'data.db')

  if (existsSync(dbPath)) {
    try {
      const { DatabaseSync } = await import('node:sqlite')
      const db = new DatabaseSync(dbPath)
      const memCount = (db.prepare('SELECT COUNT(*) as c FROM memories').get() as { c: number }).c
      const taskCount = (
        db.prepare('SELECT COUNT(*) as c FROM scheduled_tasks').get() as { c: number }
      ).c
      db.close()
      ok('Database', dbPath.replace(PROJECT_ROOT, '.'))
      ok('Memories', `${memCount} stored`)
      ok('Scheduled tasks', `${taskCount} total`)
    } catch (err) {
      warn('Database', `exists but unreadable: ${String(err)}`)
    }
  } else {
    warn('Database', 'not yet created (start the bot once)')
  }

  // ── Background service ───────────────────────────────────────────────────────
  console.log(`\n${c.bold}Background Service${c.reset}`)
  const platform = os.platform()

  if (platform === 'darwin') {
    try {
      const result = execSync('launchctl list com.myclaw.app 2>/dev/null', {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim()
      if (result) ok('launchd', 'running')
      else warn('launchd', 'not loaded — run npm run setup to install')
    } catch {
      warn('launchd', 'not installed')
    }
  } else if (platform === 'linux') {
    try {
      const result = execSync('systemctl --user is-active myclaw 2>/dev/null', {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim()
      if (result === 'active') ok('systemd', 'active')
      else warn('systemd', result || 'not active')
    } catch {
      warn('systemd', 'not installed')
    }
  } else {
    warn('Background service', 'Windows — check PM2: pm2 list')
  }

  console.log()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
