import { spawn, spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// LIZZ_HOME is set by the launcher when running globally.
// Fallback to project root for dev mode (tsx src/cli.ts).
const LIZZ_HOME = process.env['LIZZ_HOME'] ?? path.resolve(__dirname, '..')
const STORE_DIR = path.join(LIZZ_HOME, 'store')
const PID_FILE = path.join(STORE_DIR, 'lizz.pid')
const DIST_DIR = path.join(LIZZ_HOME, 'dist')

const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

// ── Exported helpers (used by tests) ──────────────────────────────────────────

export function readPid(pidFile = PID_FILE): number | null {
  if (!existsSync(pidFile)) return null
  const raw = readFileSync(pidFile, 'utf-8').trim()
  const pid = parseInt(raw, 10)
  return isNaN(pid) ? null : pid
}

export function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

// ── Commands ──────────────────────────────────────────────────────────────────

function printBanner(): void {
  console.log([
    `\x1b[31m  ██  ██  \x1b[0m`,
    `\x1b[31m  ██  ██  \x1b[0m  \x1b[1;97mLizz\x1b[0m`,
    `\x1b[31m  ██  ██  \x1b[0m`,
    `\x1b[31m██  ██  ██\x1b[0m`,
    `\x1b[31m██████████\x1b[0m`,
  ].join('\n'))
}

function cmdStart(): void {
  const pid = readPid()
  if (pid !== null && isAlive(pid)) {
    console.log(`${c.yellow}⚠${c.reset} Lizz is already running (PID ${pid})`)
    console.log(`  Use ${c.cyan}lizz stop${c.reset} to stop it first.`)
    process.exit(0)
  }

  const indexJs = path.join(DIST_DIR, 'index.js')
  if (!existsSync(indexJs)) {
    console.log(`${c.red}✗${c.reset} Build not found at ${indexJs}`)
    console.log(`  Run ${c.cyan}npm run build${c.reset} inside ${LIZZ_HOME}`)
    process.exit(1)
  }

  printBanner()
  const child = spawn('node', ['--no-warnings', indexJs], {
    cwd: LIZZ_HOME,
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, LIZZ_HOME },
  })
  child.unref()
  console.log(`\n${c.green}✓${c.reset} Lizz started (PID ${child.pid})`)
}

function cmdStop(): void {
  const pid = readPid()
  if (pid === null || !isAlive(pid)) {
    console.log(`${c.yellow}⚠${c.reset} Lizz is not running.`)
    process.exit(0)
  }
  process.kill(pid, 'SIGTERM')
  console.log(`${c.green}✓${c.reset} Lizz stopped (PID ${pid})`)
}

function spawnChild(scriptName: string): void {
  const scriptJs = path.join(DIST_DIR, scriptName)
  if (!existsSync(scriptJs)) {
    console.log(
      `${c.red}✗${c.reset} Build not found. Run ${c.cyan}npm run build${c.reset} inside ${LIZZ_HOME}`
    )
    process.exit(1)
  }
  const child = spawn('node', ['--no-warnings', scriptJs], {
    cwd: LIZZ_HOME,
    stdio: 'inherit',
    env: { ...process.env, LIZZ_HOME },
  })
  child.on('exit', (code) => process.exit(code ?? 0))
}

function cmdUpdate(): void {
  if (!process.env['LIZZ_HOME']) {
    console.log(`${c.yellow}⚠${c.reset} lizz update only works in a global install (~/.lizz).`)
    console.log(`  In dev mode, use ${c.cyan}git pull && npm run build${c.reset} instead.`)
    process.exit(0)
  }

  const gitDir = path.join(LIZZ_HOME, '.git')
  if (!existsSync(gitDir)) {
    console.log(`${c.red}✗${c.reset} No git repository found at ${LIZZ_HOME}`)
    console.log(`  Re-install with the one-liner to enable updates.`)
    process.exit(1)
  }

  console.log(`${c.bold}Lizz Update${c.reset}\n`)

  console.log(`  Pulling latest changes...`)
  const pull = spawnSync('git', ['pull'], { cwd: LIZZ_HOME, stdio: 'inherit' })
  if (pull.status !== 0) {
    console.log(`${c.red}✗${c.reset} git pull failed.`)
    process.exit(1)
  }

  console.log(`\n  Rebuilding...`)
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: LIZZ_HOME,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (build.status !== 0) {
    console.log(`${c.red}✗${c.reset} Build failed.`)
    process.exit(1)
  }

  console.log(`\n${c.green}✓${c.reset} Lizz updated successfully.`)
  console.log(`  Run ${c.cyan}lizz start${c.reset} to apply the update.`)
}

function cmdHelp(): void {
  console.log(`${c.bold}Lizz${c.reset} — personal AI assistant

${c.bold}Usage:${c.reset}
  lizz [command]

${c.bold}Commands:${c.reset}
  ${c.cyan}start${c.reset}    Start the bot (default when no command given)
  ${c.cyan}tui${c.reset}      Interactive terminal chat
  ${c.cyan}stop${c.reset}     Stop the bot
  ${c.cyan}status${c.reset}   Show running state and configuration
  ${c.cyan}setup${c.reset}    Run the configuration wizard
  ${c.cyan}update${c.reset}   Pull latest version and rebuild
  ${c.cyan}help${c.reset}     Show this help

${c.bold}Examples:${c.reset}
  lizz            # same as lizz start
  lizz setup      # configure tokens and connections
  lizz status     # check health
  lizz update     # update to latest version
  lizz stop
`)
}

// ── Dispatch (only when run directly, not when imported by tests) ─────────────

const isMain =
  process.argv[1] !== undefined &&
  (process.argv[1].endsWith('cli.js') || process.argv[1].endsWith('cli.ts'))

if (isMain) {
  const [, , cmd = 'start'] = process.argv

  switch (cmd) {
    case 'start':
      cmdStart()
      break
    case 'stop':
      cmdStop()
      break
    case 'status':
      spawnChild('status.js')
      break
    case 'setup':
      spawnChild('setup.js')
      break
    case 'update':
      cmdUpdate()
      break
    case 'tui':
      spawnChild('tui.js')
      break
    case 'help':
    case '--help':
    case '-h':
      cmdHelp()
      break
    default:
      console.log(`${c.red}✗${c.reset} Unknown command: ${cmd}`)
      cmdHelp()
      process.exit(1)
  }
}
