<p align="center">
<pre>
███╗   ███╗██╗   ██╗     ██████╗██╗      █████╗ ██╗    ██╗
████╗ ████║╚██╗ ██╔╝    ██╔════╝██║     ██╔══██╗██║    ██║
██╔████╔██║ ╚████╔╝     ██║     ██║     ███████║██║ █╗ ██║
██║╚██╔╝██║  ╚██╔╝      ██║     ██║     ██╔══██║██║███╗██║
██║ ╚═╝ ██║   ██║       ╚██████╗███████╗██║  ██║╚███╔███╔╝
╚═╝     ╚═╝   ╚═╝        ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝
</pre>
</p>

<p align="center">
  <b>Control your computer from Telegram or Slack using Claude Code.</b><br>
  Simple. Lightweight. No hassle.
</p>

<p align="center">
  <a href="README.pt-BR.md">Leia em Português</a>
</p>

---

## What is MyClaw?

MyClaw is a **lightweight, simplified** version of OpenClaw. It connects **Claude Code** to **Telegram** and/or **Slack**, letting you remotely control your computer from anywhere, straight from chat.

The project reuses Claude Code's secure environment (skills, sessions, and coworking), but with a permission bypass that gives full system access, not just the coworking folder.

### How it works

```
You (Telegram or Slack) → MyClaw Bot → Claude Code → Your computer
```

1. You send a message on Telegram or Slack
2. The bot forwards it to Claude Code
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

At least one messenger (Telegram or Slack) must be configured.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/arismarioneves/MyClaw.git
cd MyClaw
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the interactive setup

```bash
npm run setup
```

The setup will:
- ✅ Check that Node.js and Claude CLI are installed
- ✅ Build the project (TypeScript → JavaScript)
- ✅ Ask for your Telegram **bot token**
- ✅ Open `MYCLAW.md` for you to personalize the assistant
- ✅ Create the `.env` file with your configuration
- ✅ Offer to install as a background service (optional)

### 4. Start the bot

```bash
npm run start
```

Done! Open Telegram or Slack and send a message to your bot.

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
3. Add a bot token scope: `chat:write`, `app_mentions:read`, `im:history`
4. Install the app to your workspace and copy the **Bot Token** (`SLACK_BOT_TOKEN`)
5. Enable the **Event Subscriptions**: `message.im` and `app_mention`
6. Add the `/newchat` slash command pointing to your app
7. Set `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, and `SLACK_SIGNING_SECRET` in `.env`

Both messengers can run simultaneously.

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

### Terminal

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

You can schedule the bot to run prompts automatically (Telegram only):

```bash
node dist/schedule-cli.js create "Summarize my emails" "0 9 * * *" YOUR_CHAT_ID
```

Cron examples:

| Pattern | Frequency |
|---------|-----------|
| `0 9 * * *` | Every day at 9am |
| `0 9 * * 1` | Every Monday at 9am |
| `0 */4 * * *` | Every 4 hours |

---

## Personalization

Edit **`MYCLAW.md`** in the project root to customize:

- Assistant name
- Personality and tone
- Available skills
- Formatting rules

You can edit this file at any time. Changes take effect on the next message.

---

## Media Support

Via Telegram, the bot accepts:

- 📷 **Photos** — Send an image and Claude will analyze it
- 📄 **Documents** — Send files for Claude to process

---

## Compatible Operating Systems

| OS | Support | Background service |
|----|---------|-------------------|
| **Windows** | ✅ | Via PM2 (`pm2 start dist/index.js --name myclaw`) |
| **macOS** | ✅ | Via launchd (auto-configured by setup) |
| **Linux** | ✅ | Via systemd (auto-configured by setup) |

---

## Project Structure

```
MyClaw/
├── src/
│   ├── index.ts            # Entry point
│   ├── bot.ts              # Telegram bot logic (grammY)
│   ├── slack-bot.ts        # Slack bot logic (@slack/bolt)
│   ├── agent.ts            # Claude Code integration
│   ├── config.ts           # Configuration
│   ├── db.ts               # SQLite database (sessions, memories, tasks)
│   ├── memory.ts           # Memory system with decay
│   ├── scheduler.ts        # Task scheduler (cron)
│   ├── media.ts            # Media download and processing
│   ├── format.ts           # Message formatting (Telegram HTML + Slack mrkdwn)
│   ├── logger.ts           # Logger (pino)
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
│   ├── setup.ts            # Interactive setup wizard
│   ├── status.ts           # Health checker
│   └── notify.sh           # Notification script
├── MYCLAW.md               # Assistant personality and instructions
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

## Quick Start

```bash
git clone https://github.com/arismarioneves/MyClaw.git
cd MyClaw
npm install
npm run setup
npm run start
```

5 commands. That's it.

---

<p align="center">
  <sub>Make your day better with MyClaw</sub>
</p>
