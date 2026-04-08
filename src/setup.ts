#!/usr/bin/env tsx
import { createInterface } from 'readline'
import { execSync, spawnSync } from 'child_process'
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import os from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

// ─── ANSI colors ──────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
}

const ok = (msg: string) => console.log(`${c.green}✓${c.reset} ${msg}`)
const warn = (msg: string) => console.log(`${c.yellow}⚠${c.reset} ${msg}`)
const fail = (msg: string) => console.log(`${c.red}✗${c.reset} ${msg}`)
const info = (msg: string) => console.log(`${c.cyan}→${c.reset} ${msg}`)
const header = (msg: string) => console.log(`\n${c.bold}${msg}${c.reset}\n`)

// ─── Readline helper ──────────────────────────────────────────────────────────
const rl = createInterface({ input: process.stdin, output: process.stdout })

function ask(question: string, defaultVal = ''): Promise<string> {
  return new Promise((resolve) => {
    const hint = defaultVal ? ` ${c.dim}[${defaultVal}]${c.reset}` : ''
    rl.question(`${question}${hint}: `, (answer) => {
      resolve(answer.trim() || defaultVal)
    })
  })
}

function askYN(question: string, defaultVal: 'y' | 'n'): Promise<boolean> {
  const hint =
    defaultVal === 'y'
      ? `${c.dim}[${c.reset}${c.bold}Y${c.reset}${c.dim}/n]${c.reset}`
      : `${c.dim}[y/${c.reset}${c.bold}N${c.reset}${c.dim}]${c.reset}`
  return new Promise((resolve) => {
    rl.question(`${question} ${hint}: `, (answer: string) => {
      const t = answer.trim().toLowerCase()
      resolve(t ? t === 'y' || t === 'yes' : defaultVal === 'y')
    })
  })
}

function askSecret(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(`${question}: `)
    process.stdin.setRawMode?.(true)
    let input = ''
    const handler = (buf: Buffer) => {
      const char = buf.toString()
      if (char === '\r' || char === '\n') {
        process.stdin.setRawMode?.(false)
        process.stdin.off('data', handler)
        process.stdout.write('\n')
        resolve(input)
      } else if (char === '\u0003') {
        process.exit(0)
      } else if (char === '\u007f') {
        if (input.length > 0) {
          input = input.slice(0, -1)
          process.stdout.write('\b \b')
        }
      } else {
        input += char
        process.stdout.write('*')
      }
    }
    process.stdin.on('data', handler)
    process.stdin.resume()
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.clear()
  console.log([
    '\x1b[31m  ██  ██  \x1b[0m',
    '\x1b[31m  ██  ██  \x1b[0m  \x1b[1;97mLizz\x1b[0m',
    '\x1b[31m  ██  ██  \x1b[0m',
    '\x1b[31m██  ██  ██\x1b[0m',
    '\x1b[31m██████████\x1b[0m',
  ].join('\n') + '\n')

  // ── Step 1: Requirements ───────────────────────────────────────────────────
  header('Step 1 — Checking requirements')

  const nodeVersion = parseInt(process.versions.node.split('.')[0] ?? '0', 10)
  if (nodeVersion >= 20) {
    ok(`Node.js ${process.versions.node}`)
  } else {
    fail(`Node.js >= 20 required. You have ${process.versions.node}`)
    process.exit(1)
  }

  try {
    const claudeVersion = execSync('claude --version', { encoding: 'utf-8', stdio: 'pipe' }).trim()
    ok(`Claude CLI: ${claudeVersion}`)
  } catch {
    fail('Claude CLI not found. Install it from https://claude.com/product/claude-code.')
    process.exit(1)
  }

  // ── Step 2: Build ──────────────────────────────────────────────────────────
  header('Step 2 — Building project')
  info('Running npm run build...')
  const buildResult = spawnSync('npm', ['run', 'build'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    shell: true,
  })
  if (buildResult.status !== 0) {
    fail('Build failed. Fix TypeScript errors above and run npm run setup again.')
    process.exit(1)
  }
  ok('Build successful')

  // ── Step 3: Messengers ─────────────────────────────────────────────────────
  header('Step 3 — Configure messengers')
  info('At least one messenger (Telegram or Slack) must be configured.\n')

  // Telegram
  console.log(`${c.bold}Telegram${c.reset} ${c.dim}(optional)${c.reset}`)
  console.log(`  Get a bot token from ${c.cyan}@BotFather${c.reset} on Telegram → /newbot\n`)
  const telegramToken = await askSecret('Telegram bot token (leave blank to skip)')

  if (telegramToken && !telegramToken.includes(':')) {
    warn('Token format looks wrong — expected 123456:ABCdef... Continuing anyway.')
  }

  // Slack
  console.log(`\n${c.bold}Slack${c.reset} ${c.dim}(optional)${c.reset}`)
  console.log(`  Requires a Slack app with Socket Mode enabled.`)
  console.log(`  Create one at ${c.cyan}api.slack.com/apps${c.reset}\n`)

  const setupSlack = await askYN('Configure Slack?', 'n')
  let slackBotToken = ''
  let slackAppToken = ''
  let slackSigningSecret = ''
  let allowedSlackUserId = ''

  if (setupSlack) {
    slackBotToken = await askSecret('SLACK_BOT_TOKEN (xoxb-...)')
    slackAppToken = await askSecret('SLACK_APP_TOKEN (xapp-...)')
    slackSigningSecret = await askSecret('SLACK_SIGNING_SECRET (optional, press Enter to skip)')
    allowedSlackUserId = await ask('ALLOWED_SLACK_USER_ID (optional, leave blank for all members)')
    ok('Slack configured')
  }

  if (!telegramToken && !slackBotToken) {
    fail('No messenger configured. At least one of Telegram or Slack must be set up.')
    process.exit(1)
  }

  // ── Step 4: Connections ────────────────────────────────────────────────────
  header('Step 4 — Configure connections (optional)')
  info('Connections are optional integrations. Skip any you don\'t need.\n')

  // Jira
  console.log(`${c.bold}Jira${c.reset}`)
  const setupJira = await askYN('Configure Jira?', 'n')
  let jiraHost = ''
  let jiraEmail = ''
  let jiraApiToken = ''

  if (setupJira) {
    jiraHost = await ask('JIRA_HOST (e.g. mycompany.atlassian.net)')
    jiraEmail = await ask('JIRA_EMAIL')
    jiraApiToken = await askSecret('JIRA_API_TOKEN')
    ok('Jira configured')
  }

  // GitHub
  console.log(`\n${c.bold}GitHub${c.reset}`)
  console.log(`  Requires ${c.cyan}gh${c.reset} CLI installed and authenticated (gh auth login)`)
  const githubRepo = await ask('GITHUB_REPO (owner/repo, leave blank to skip)')

  // Local repo
  console.log(`\n${c.bold}Local repository${c.reset}`)
  const localRepoPath = await ask('LOCAL_REPO_PATH (absolute path, leave blank to skip)')

  // ── Step 5: Write .env ────────────────────────────────────────────────────
  header('Step 5 — Writing .env')

  const lines: string[] = [
    `# Generated by Lizz setup — ${new Date().toISOString()}`,
    '',
    '# ─── Messengers ─────────────────────────────────────────────────────────────',
    `TELEGRAM_BOT_TOKEN=${telegramToken}`,
    'ALLOWED_CHAT_ID=',
    '',
    `SLACK_BOT_TOKEN=${slackBotToken}`,
    `SLACK_APP_TOKEN=${slackAppToken}`,
    `SLACK_SIGNING_SECRET=${slackSigningSecret}`,
    `ALLOWED_SLACK_USER_ID=${allowedSlackUserId}`,
    '',
    '# ─── Connections ─────────────────────────────────────────────────────────────',
    `JIRA_HOST=${jiraHost}`,
    `JIRA_EMAIL=${jiraEmail}`,
    `JIRA_API_TOKEN=${jiraApiToken}`,
    '',
    `GITHUB_REPO=${githubRepo}`,
    '',
    `LOCAL_REPO_PATH=${localRepoPath}`,
    '',
    '# ─── Claude API ──────────────────────────────────────────────────────────────',
    'ANTHROPIC_API_KEY=',
    '',
    '# ─── Logging ─────────────────────────────────────────────────────────────────',
    'LOG_LEVEL=info',
    '',
  ]

  writeFileSync(path.join(PROJECT_ROOT, '.env'), lines.join('\n'))
  ok('.env written')

  mkdirSync(path.join(PROJECT_ROOT, 'store'), { recursive: true })
  mkdirSync(path.join(PROJECT_ROOT, 'workspace', 'uploads'), { recursive: true })

  // ── Step 6: Background service ────────────────────────────────────────────
  header('Step 6 — Background service')
  const installService = await askYN('Install as background service (auto-start on boot)?', 'y')

  if (installService) {
    const platform = os.platform()

    if (platform === 'darwin') {
      const plistPath = path.join(
        os.homedir(),
        'Library',
        'LaunchAgents',
        'com.lizz.app.plist'
      )
      const nodePath = execSync('which node', { encoding: 'utf-8' }).trim()
      const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.lizz.app</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodePath}</string>
    <string>${path.join(PROJECT_ROOT, 'dist', 'index.js')}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${PROJECT_ROOT}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>5</integer>
  <key>StandardOutPath</key>
  <string>/tmp/lizz.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/lizz-error.log</string>
</dict>
</plist>`
      writeFileSync(plistPath, plistContent)
      try {
        try { execSync(`launchctl unload "${plistPath}"`, { stdio: 'ignore' }) } catch { /* not loaded yet */ }
        execSync(`launchctl load "${plistPath}"`, { stdio: 'inherit' })
        ok('launchd service installed and started')
        info('Logs: /tmp/lizz.log')
        info(`Stop:  launchctl unload "${plistPath}"`)
        info(`Start: launchctl load "${plistPath}"`)
      } catch {
        warn(`Service file written to ${plistPath} but launchctl failed. Load it manually.`)
      }
    } else if (platform === 'linux') {
      const serviceDir = path.join(os.homedir(), '.config', 'systemd', 'user')
      mkdirSync(serviceDir, { recursive: true })
      const servicePath = path.join(serviceDir, 'lizz.service')
      const nodePath = execSync('which node', { encoding: 'utf-8' }).trim()
      const serviceContent = `[Unit]
Description=Lizz Personal AI Assistant
After=network.target

[Service]
Type=simple
WorkingDirectory=${PROJECT_ROOT}
ExecStart=${nodePath} ${path.join(PROJECT_ROOT, 'dist', 'index.js')}
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
`
      writeFileSync(servicePath, serviceContent)
      try {
        execSync('systemctl --user daemon-reload', { stdio: 'inherit' })
        execSync('systemctl --user enable lizz', { stdio: 'inherit' })
        execSync('systemctl --user start lizz', { stdio: 'inherit' })
        ok('systemd service installed and started')
        info('Logs: journalctl --user -u lizz -f')
        info('Stop:  systemctl --user stop lizz')
        info('Start: systemctl --user start lizz')
      } catch {
        warn(`Service file written to ${servicePath} but systemctl failed. Enable it manually.`)
      }
    } else {
      warn('Windows detected. Install PM2 to run Lizz as a background service:')
      console.log(`
  npm install -g pm2
  pm2 start "${path.join(PROJECT_ROOT, 'dist', 'index.js')}" --name lizz
  pm2 save
  pm2 startup
`)
    }
  } else {
    info('Skipping service install. Run manually with: lizz start')
  }

  // ── Step 7: Done ──────────────────────────────────────────────────────────
  header('Setup complete!')

  const messengers = [
    telegramToken && 'Telegram',
    slackBotToken && 'Slack',
  ].filter(Boolean).join(' + ')

  const connections = [
    jiraHost && 'Jira',
    githubRepo && 'GitHub',
    localRepoPath && 'Local repo',
  ].filter(Boolean)

  console.log(`${c.green}Lizz is ready.${c.reset}

Messengers: ${c.cyan}${messengers}${c.reset}${connections.length ? `\nConnections: ${c.cyan}${connections.join(', ')}${c.reset}` : ''}

Next steps:
  ${c.cyan}lizz${c.reset}                 Start the bot
  ${c.cyan}lizz start${c.reset}           Start the bot
  ${c.cyan}lizz stop${c.reset}            Stop the bot
  ${c.cyan}lizz status${c.reset}          Check health and configuration
  ${c.cyan}lizz setup${c.reset}           Reconfigure at any time
${telegramToken ? `
  Then open Telegram and send ${c.cyan}/start${c.reset} to your bot.
  Your Chat ID will be registered automatically.` : ''}
Personalize:
  Edit ${c.cyan}LIZZ.md${c.reset} any time to update your assistant's context and personality.
`)

  rl.close()
}

main().catch((err) => {
  fail(String(err))
  process.exit(1)
})
