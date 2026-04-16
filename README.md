<p align="center">
  <img src="lizz.png" width="100" alt="Lizz" />
</p>

<p align="center">
  <b>Lizz</b>
</p>

<p align="center">
  <b>Control your computer from Telegram, Slack, or your Terminal using Claude Code.</b><br>
  Simple. Lightweight. No hassle.
</p>

<p align="center">
  <a href="README.pt-BR.md">Leia em Português</a>
</p>

---

## Quick Install

**Windows**

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/arismarioneves/Lizz/main/install.ps1 | iex"
```

**macOS / Linux**

```bash
curl -fsSL https://raw.githubusercontent.com/arismarioneves/Lizz/main/install.sh | bash
```

The installer will:
- ✅ Check Node.js (>= 20) and Git — install via `winget` / `nvm` / `brew` if missing
- ✅ Clone Lizz to `~/.lizz`
- ✅ Build the project
- ✅ Register the `lizz` command globally in your PATH
- ✅ Launch the setup wizard automatically

After install, use `lizz` from any directory:

```bash
lizz           # start the bot (default)
lizz start     # start the bot
lizz tui       # interactive terminal chat
lizz stop      # stop the bot
lizz status    # check health and configuration
lizz setup     # reconfigure tokens and connections
```

> Re-running the installer updates Lizz to the latest version while preserving your `.env`.

---

## What is Lizz?

Lizz is a **lightweight, simplified** version of OpenClaw. It connects **Claude Code** to **Telegram**, **Slack**, or a **Terminal UI (TUI)**, letting you remotely control your computer from anywhere — from chat or directly in your terminal.

The project reuses Claude Code's secure environment (skills, sessions, and coworking), but with a permission bypass that gives full system access, not just the coworking folder.

### How it works

```
You (Telegram, Slack, or Terminal) → Lizz → Claude Code → Your computer
```

1. You send a message on Telegram, Slack, or the TUI
2. Lizz forwards it to Claude Code
3. Claude executes the action on your computer
4. The response comes back to your chat

---

## Requirements

| Requirement | Details |
|-------------|---------|
| **Node.js** | >= 20 |
| **Claude Code CLI** | Installed and logged in (`claude login`) |
| **Telegram** | An account + bot created via [@BotFather](https://t.me/BotFather) *(optional)* |
| **Slack** | A Slack app with Socket Mode enabled *(optional)* |

At least one interface must be available. You can use `lizz tui` with no messenger configured.

---

## Installation

### Quick Install (recommended)

See [Quick Install](#quick-install) above — one command, done.

### Manual Install

```bash
git clone https://github.com/arismarioneves/Lizz.git
cd Lizz
npm install
npm run setup
npm run start
```

The setup wizard will guide you through configuring messengers, connections, and the background service.

---

## Messengers

### Telegram

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`, follow the prompts, copy the token
3. Set `TELEGRAM_BOT_TOKEN` in `.env`
4. Send `/start` to the bot — the Chat ID is registered automatically

### Slack

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new app
2. Enable **Socket Mode** and generate an App-Level Token (`SLACK_APP_TOKEN`, scope: `connections:write`)
3. Add the following **Bot Token Scopes** (OAuth & Permissions):

   | Scope | Purpose |
   |-------|---------|
   | `chat:write` | Send messages |
   | `app_mentions:read` | Receive @mentions in channels |
   | `commands` | Slash commands |
   | `im:history` | Read DMs |
   | `im:read` | List DMs |
   | `im:write` | Open DMs |
   | `channels:read` | Read public channel info |
   | `channels:history` | Read messages in public channels |
   | `groups:history` | Read messages in **private channels** |
   | `groups:read` | List private channels |
   | `files:read` | Download files and images sent to the bot |
   | `reactions:write` | Add emoji reactions for processing feedback |

4. Install the app to your workspace and copy the **Bot Token** (`SLACK_BOT_TOKEN`)
5. Enable the **Event Subscriptions**: `message.im`, `message.channels`, `message.groups`, and `app_mention`
6. Add the `/newchat` slash command pointing to your app
7. Set `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, and `SLACK_SIGNING_SECRET` in `.env`

> After adding new scopes, Slack requires reinstalling the app to the workspace.

### TUI (Terminal)

No configuration needed. Just run:

```bash
lizz tui
```

The TUI launches an interactive chat directly in your terminal. The agent works in the directory where you run the command — no `LOCAL_REPO_PATH` needed.

Features:
- Markdown rendering with syntax-highlighted code blocks
- Spinner while the agent is thinking
- Tab completion for `/` commands
- Input history (arrow keys)
- Save conversations to file (`Ctrl+S`)

Both messengers and the TUI can be used independently or alongside each other.

---

## Available Commands

### Telegram

| Command | Description |
|---------|-------------|
| `/start` | Starts the bot and registers your Chat ID |
| `/chatid` | Shows your Chat ID |
| `/newchat` | Clears the session and starts a new conversation |
| `/memory` | Shows stored memories |
| `/schedule list` | Lists scheduled tasks |
| `/schedule pause <id>` | Pauses a task |
| `/schedule resume <id>` | Resumes a paused task |
| `/schedule delete <id>` | Deletes a task |

### Slack

| Command | Description |
|---------|-------------|
| `/newchat` | Clears the session and starts a new conversation |
| `@bot <message>` | Mention the bot in any channel |
| DM the bot | Send a direct message |

### TUI (Terminal Chat)

| Command | Description |
|---------|-------------|
| `/newchat` | Clears the session and starts a new conversation |
| `/memory` | Shows stored memories |
| `/schedule list` | Lists scheduled tasks |
| `/schedule pause <id>` | Pauses a task |
| `/schedule resume <id>` | Resumes a paused task |
| `/schedule delete <id>` | Deletes a task |
| `/help` | Shows available commands and shortcuts |
| `/exit` | Exits the TUI |

**Keyboard shortcuts:**

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Ctrl+C` | Exit |
| `Esc` | Cancel response in progress |
| `Ctrl+L` | Clear screen |
| `↑ / ↓` | Navigate input history |
| `Tab` | Autocomplete commands |
| `Ctrl+S` | Save conversation to file |

### Terminal

**Global CLI** (available after install):

| Command | Description |
|---------|-------------|
| `lizz` | Start the bot (same as `lizz start`) |
| `lizz start` | Start the bot |
| `lizz tui` | Interactive terminal chat |
| `lizz stop` | Stop the bot |
| `lizz status` | Check configuration health |
| `lizz setup` | Run the setup wizard |

**Dev mode** (inside the project directory):

| Command | Description |
|---------|-------------|
| `npm run start` | Start the bot (production) |
| `npm run dev` | Start in dev mode (hot reload) |
| `npm run setup` | Run the setup wizard |
| `npm run status` | Check configuration health |
| `npm run build` | Compile TypeScript |
| `npm run test` | Run tests |

---

## Connections

Connections are optional integrations enabled by environment variables. When active, their instructions are automatically injected into every agent request.

### Jira

Set credentials to enable. The agent gets access to a CLI for full issue lifecycle management.

```bash
JIRA_HOST=mycompany.atlassian.net
JIRA_EMAIL=you@company.com
JIRA_API_TOKEN=your-api-token
```

The agent can: get issues, search by JQL, transition statuses, and add comments.

```bash
# Examples (called by the agent via bash)
node dist/connections/jira/cli.js get PROJECT-123
node dist/connections/jira/cli.js search "assignee = currentUser() AND status = 'To Do'"
node dist/connections/jira/cli.js transition PROJECT-123 "In Review"
node dist/connections/jira/cli.js comment PROJECT-123 "PR created: https://..."
```

### GitHub

Set `GITHUB_REPO` to enable. Requires `gh` CLI installed and authenticated (`gh auth login`).

```bash
GITHUB_REPO=owner/repo-name
```

The agent can: create branches, commit, push, and open pull requests via `gh`.

### Local Repo

Set `LOCAL_REPO_PATH` to give the agent access to a local git repository.

```bash
LOCAL_REPO_PATH=C:/DEV/my-project
```

---

## Task Scheduling

You can schedule the bot to run prompts automatically on both Telegram and Slack:

```bash
# Telegram: use your numeric Chat ID
node dist/schedule-cli.js create "Summarize my emails" "0 9 * * *" 123456789

# Slack: use a channel or DM ID (e.g. C0ANMACP82W)
node dist/schedule-cli.js create "Summarize my emails" "0 9 * * *" C0ANMACP82W
```

Cron examples:

| Pattern | Frequency |
|---------|-----------|
| `0 9 * * *` | Every day at 9am |
| `0 9 * * 1` | Every Monday at 9am |
| `0 */4 * * *` | Every 4 hours |

---

## Personalization

Edit **`LIZZ.md`** in the project root to customize:

- Assistant name
- Personality and tone
- Available skills
- Formatting rules

You can edit this file at any time. Changes take effect on the next message.

---

## Media Support

The bot accepts photos and documents on both messengers:

- 📷 **Photos** — Send an image and Claude will analyze it
- 📄 **Documents** — Send files for Claude to process

> For Slack, the bot requires the `files:read` scope to download files.

---

## Compatible Operating Systems

| OS | Support | Background service |
|----|---------|-------------------|
| **Windows** | ✅ | Via PM2 (`pm2 start dist/index.js --name lizz`) |
| **macOS** | ✅ | Via launchd (auto-configured by setup) |
| **Linux** | ✅ | Via systemd (auto-configured by setup) |

---

## Project Structure

```
Lizz/
├── src/
│   ├── index.ts            # Entry point
│   ├── cli.ts              # Global CLI (lizz start/stop/status/setup)
│   ├── bot.ts              # Telegram bot logic (grammY)
│   ├── slack-bot.ts        # Slack bot logic (@slack/bolt)
│   ├── agent.ts            # Claude Code integration
│   ├── config.ts           # Configuration
│   ├── db.ts               # SQLite database (sessions, memories, tasks)
│   ├── memory.ts           # Memory system with decay
│   ├── scheduler.ts        # Task scheduler (cron)
│   ├── media.ts            # Media download and processing
│   ├── tui.ts              # Terminal UI (interactive chat)
│   ├── format.ts           # Message formatting (Telegram HTML + Slack mrkdwn + TUI ANSI)
│   ├── logger.ts           # Logger (pino)
│   ├── setup.ts            # Interactive setup wizard
│   ├── status.ts           # Health checker
│   └── connections/
│       ├── index.ts        # Connection manager
│       └── jira/
│           ├── client.ts   # Jira REST client
│           └── cli.ts      # Jira CLI (called by agent via bash)
├── connections/
│   ├── jira/instructions.md
│   ├── github/instructions.md
│   └── local-repo/instructions.md
├── scripts/
│   └── notify.sh           # Notification script
├── install.ps1             # Windows one-liner installer
├── install.sh              # Linux/macOS one-liner installer
├── LIZZ.md                 # Assistant personality and instructions
├── .env.example            # Environment variables example
├── package.json
└── tsconfig.json
```

---

## Environment Variables

### Messengers

| Variable | Required | Description |
|----------|:--------:|-------------|
| `TELEGRAM_BOT_TOKEN` | ✅* | Bot token (from @BotFather) |
| `ALLOWED_CHAT_ID` | ❌ | Your Telegram Chat ID (auto-registered on first `/start`) |
| `SLACK_BOT_TOKEN` | ✅* | Slack bot OAuth token (`xoxb-...`) |
| `SLACK_APP_TOKEN` | ✅* | Slack app-level token for Socket Mode (`xapp-...`) |
| `SLACK_SIGNING_SECRET` | ❌ | Slack signing secret |
| `ALLOWED_SLACK_USER_ID` | ❌ | Restrict Slack to a single user ID (open to all if not set) |

*At least one messenger must be configured (Telegram or Slack).

### Connections

| Variable | Description |
|----------|-------------|
| `JIRA_HOST` | Atlassian domain (e.g. `mycompany.atlassian.net`) |
| `JIRA_EMAIL` | Atlassian account email |
| `JIRA_API_TOKEN` | Jira API token |
| `GITHUB_REPO` | GitHub repository (`owner/repo`) — requires `gh` CLI authenticated |
| `LOCAL_REPO_PATH` | Absolute path to a local git repository |

### Other

| Variable | Required | Description |
|----------|:--------:|-------------|
| `ANTHROPIC_API_KEY` | ❌ | Anthropic API key (optional, uses `claude login` by default) |
| `LOG_LEVEL` | ❌ | Log level: `trace`, `debug`, `info`, `warn`, `error` (default: `info`) |

---

<p align="center">
  <sub>Make your day better with Lizz</sub>
</p>
