import { fileURLToPath } from 'url'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { readEnvFile } from './env.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const PROJECT_ROOT = path.resolve(__dirname, '..')
export const STORE_DIR = path.join(PROJECT_ROOT, 'store')

const env = readEnvFile()

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
