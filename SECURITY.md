# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.0.x   | Yes       |

## Sensitive Data & Credentials

Lizz handles several sensitive credentials and tokens. **Never commit these to version control:**

- `TELEGRAM_BOT_TOKEN` — Telegram bot access (via grammY)
- `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `SLACK_SIGNING_SECRET` — Slack API access
- `JIRA_HOST`, `JIRA_EMAIL`, `JIRA_API_TOKEN` — Jira authentication
- `ANTHROPIC_API_KEY` — Claude AI access
- `LOCAL_REPO_PATH` — local filesystem path
- `ALLOWED_CHAT_ID` / `ALLOWED_SLACK_USER_ID` — access control per messenger

All secrets must be stored in a `.env` file (excluded via `.gitignore`) or injected as environment variables at runtime.

## Access Control

Lizz restricts agent interactions to a single authorized user per messenger:

- **Telegram:** via `ALLOWED_CHAT_ID` — only the configured chat ID can interact with the bot
- **Slack:** via `ALLOWED_SLACK_USER_ID` — only the configured user ID is accepted

Ensure at least one of these is always set in production. Messages from unauthorized users are silently ignored.

## AI Agent Security

Lizz uses the Claude Code agent SDK, which can execute shell commands and interact with GitHub (`gh` CLI), Jira, and the local repository. Be aware that:

- The agent operates with the same OS-level permissions as the running process.
- Prompt injection via Slack messages is a potential attack vector. Only authorize trusted users.
- Jira issue content fetched by the agent is passed directly to the LLM — avoid connecting Lizz to public-facing Jira projects.

## Reporting a Vulnerability

If you discover a security vulnerability in Lizz, please **do not open a public GitHub issue**.

Instead, report it privately via GitHub's security advisory feature:

**[Report a vulnerability](https://github.com/arismarioneves/Lizz/security/advisories/new)**

Please include:
- A description of the vulnerability and its potential impact
- Steps to reproduce
- Any suggested mitigations

You can expect an initial response within **72 hours**.
