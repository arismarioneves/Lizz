import { fileURLToPath } from 'url'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { readEnvFile } from './env.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const PROJECT_ROOT = path.resolve(__dirname, '..')
export const STORE_DIR = path.join(PROJECT_ROOT, 'store')

const env = readEnvFile()

// Forward env vars to process.env so child processes (Claude SDK) inherit them
for (const [key, value] of Object.entries(env)) {
  if (value && !process.env[key]) {
    process.env[key] = value
  }
}

export const TELEGRAM_BOT_TOKEN = env['TELEGRAM_BOT_TOKEN'] ?? ''
export let ALLOWED_CHAT_ID = env['ALLOWED_CHAT_ID'] ?? ''

export function setAllowedChatId(id: string): void {
  ALLOWED_CHAT_ID = id
  const envPath = path.join(PROJECT_ROOT, '.env')
  try {
    let content = readFileSync(envPath, 'utf-8')
    content = content.replace(/ALLOWED_CHAT_ID=.*/, `ALLOWED_CHAT_ID=${id}`)
    writeFileSync(envPath, content)
  } catch {
    // .env might not exist yet
  }
}

export const MAX_MESSAGE_LENGTH = 4096
export const TYPING_REFRESH_MS = 4000

// ─── Slack ────────────────────────────────────────────────────────────────────
export const SLACK_BOT_TOKEN = env['SLACK_BOT_TOKEN'] ?? ''
export const SLACK_APP_TOKEN = env['SLACK_APP_TOKEN'] ?? ''
export const SLACK_SIGNING_SECRET = env['SLACK_SIGNING_SECRET'] ?? ''
// Optional: restrict to a single Slack user ID (e.g. U01234ABCDE)
export const ALLOWED_SLACK_USER_ID = env['ALLOWED_SLACK_USER_ID'] ?? ''

// ─── Connections ──────────────────────────────────────────────────────────────
export const JIRA_HOST = env['JIRA_HOST'] ?? ''
export const JIRA_EMAIL = env['JIRA_EMAIL'] ?? ''
export const JIRA_API_TOKEN = env['JIRA_API_TOKEN'] ?? ''

// Path to the local git repository the agent will work on
export const LOCAL_REPO_PATH = env['LOCAL_REPO_PATH'] ?? ''

// GitHub repository (owner/repo). Enables the GitHub connection.
export const GITHUB_REPO = env['GITHUB_REPO'] ?? ''

// ─── TUI ─────────────────────────────────────────────────────────────────────
export const TUI_CHAT_ID = 'tui'
