<p align="center">
  <img src="lizz.png" width="100" alt="Lizz" />
</p>

<p align="center">
  <b>Lizz</b>
</p>

<p align="center">
  <b>Controle seu computador pelo Telegram, Slack ou Terminal usando Claude Code.</b><br>
  Simples. Leve. Sem complicação.
</p>

---

## Instalação rápida

**Windows**

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/arismarioneves/Lizz/main/install.ps1 | iex"
```

**macOS / Linux**

```bash
curl -fsSL https://raw.githubusercontent.com/arismarioneves/Lizz/main/install.sh | bash
```

O instalador vai:
- ✅ Verificar Node.js (>= 20) e Git — instalar via `winget` / `nvm` / `brew` se necessário
- ✅ Clonar a Lizz em `~/.lizz`
- ✅ Compilar o projeto
- ✅ Registrar o comando `lizz` globalmente no PATH
- ✅ Iniciar o assistente de configuração automaticamente

Após a instalação, use `lizz` de qualquer diretório:

```bash
lizz           # inicia o bot (padrão)
lizz start     # inicia o bot
lizz tui       # chat interativo no terminal
lizz stop      # para o bot
lizz status    # verifica saúde e configuração
lizz setup     # reconfigura tokens e conexões
```

> Rodar o instalador novamente atualiza a Lizz para a versão mais recente, preservando seu `.env`.

---

## O que é a Lizz?

Lizz é uma versão **lite e simplificada** do OpenClaw. Ele conecta o **Claude Code** ao **Telegram**, **Slack** ou a um **Terminal UI (TUI)**, permitindo que você controle seu computador remotamente de qualquer lugar — pelo chat ou direto no terminal.

O projeto reutiliza o ambiente seguro do Claude Code (skills, sessões e coworking), mas com um bypass de permissões que dá acesso total ao sistema, não apenas a pasta do coworking.

### Como funciona?

```
Você (Telegram, Slack ou Terminal) → Lizz → Claude Code → Seu computador
```

1. Você envia uma mensagem no Telegram, Slack ou TUI
2. A Lizz repassa para o Claude Code
3. O Claude executa a ação no seu computador
4. A resposta volta para o seu chat

---

## Requisitos

| Requisito | Detalhes |
|-----------|---------|
| **Node.js** | >= 20 |
| **Claude Code CLI** | Instalado e logado (`claude login`) |
| **Telegram** | Uma conta + bot criado pelo [@BotFather](https://t.me/BotFather) *(opcional)* |
| **Slack** | Um app Slack com Socket Mode habilitado *(opcional)* |

Pelo menos uma interface deve estar disponível. Você pode usar `lizz tui` sem nenhum mensageiro configurado.

---

## Instalação

### Instalação rápida (recomendada)

Veja [Instalação rápida](#instalação-rápida) acima — um comando, pronto.

### Instalação manual

```bash
git clone https://github.com/arismarioneves/Lizz.git
cd Lizz
npm install
npm run setup
npm run start
```

O assistente de configuração vai guiar você pelos mensageiros, conexões e serviço em background.

---

## Mensageiros

### Telegram

1. Abra o Telegram e procure por **@BotFather**
2. Envie `/newbot`, siga as instruções e copie o token
3. Defina `TELEGRAM_BOT_TOKEN` no `.env`
4. Envie `/start` para o bot — o Chat ID é registrado automaticamente

### Slack

1. Acesse [api.slack.com/apps](https://api.slack.com/apps) e crie um novo app
2. Habilite o **Socket Mode** e gere um App-Level Token (`SLACK_APP_TOKEN`, escopo: `connections:write`)
3. Adicione os seguintes **Bot Token Scopes** (OAuth & Permissions):

   | Escopo | Para que serve |
   |--------|---------------|
   | `chat:write` | Enviar mensagens |
   | `app_mentions:read` | Receber menções em canais |
   | `commands` | Slash commands |
   | `im:history` | Ler DMs |
   | `im:read` | Listar DMs |
   | `im:write` | Abrir DMs |
   | `channels:read` | Info dos canais públicos |
   | `channels:history` | Ler mensagens em canais públicos |
   | `groups:history` | Ler mensagens em **canais privados** |
   | `groups:read` | Listar canais privados |
   | `files:read` | Baixar arquivos e imagens enviados ao bot |
   | `reactions:write` | Adicionar reações emoji como feedback de processamento |

4. Instale o app no workspace e copie o **Bot Token** (`SLACK_BOT_TOKEN`)
5. Habilite as **Event Subscriptions**: `message.im`, `message.channels`, `message.groups` e `app_mention`
6. Adicione o comando `/newchat` apontando para o seu app
7. Defina `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` e `SLACK_SIGNING_SECRET` no `.env`

> Após adicionar novos escopos, o Slack exige que o app seja **reinstalado** no workspace.

### TUI (Terminal)

Não precisa de configuração. Basta rodar:

```bash
lizz tui
```

O TUI inicia um chat interativo direto no terminal. O agente trabalha no diretório onde você executou o comando — sem necessidade de `LOCAL_REPO_PATH`.

Recursos:
- Renderização de Markdown com syntax highlighting nos blocos de código
- Spinner enquanto o agente está pensando
- Autocomplete para comandos `/` com Tab
- Histórico de input (setas para cima/baixo)
- Salvar conversas em arquivo (`Ctrl+S`)

Os mensageiros e o TUI podem ser usados de forma independente ou em conjunto.

---

## Comandos disponíveis

### Telegram

| Comando | O que faz |
|---------|-----------|
| `/start` | Inicia o bot e registra seu Chat ID |
| `/chatid` | Mostra seu Chat ID |
| `/newchat` | Limpa a sessão e inicia uma nova conversa |
| `/memory` | Mostra as memórias armazenadas |
| `/schedule list` | Lista tarefas agendadas |
| `/schedule pause <id>` | Pausa uma tarefa |
| `/schedule resume <id>` | Retoma uma tarefa pausada |
| `/schedule delete <id>` | Deleta uma tarefa |

### Slack

| Comando | O que faz |
|---------|-----------|
| `/newchat` | Limpa a sessão e inicia uma nova conversa |
| `@bot <mensagem>` | Mencione o bot em qualquer canal |
| DM para o bot | Envie uma mensagem direta |

### TUI (Chat no Terminal)

| Comando | O que faz |
|---------|-----------|
| `/newchat` | Limpa a sessão e inicia uma nova conversa |
| `/memory` | Mostra as memórias armazenadas |
| `/schedule list` | Lista tarefas agendadas |
| `/schedule pause <id>` | Pausa uma tarefa |
| `/schedule resume <id>` | Retoma uma tarefa pausada |
| `/schedule delete <id>` | Deleta uma tarefa |
| `/help` | Mostra comandos e atalhos disponíveis |
| `/exit` | Sai do TUI |

**Atalhos de teclado:**

| Atalho | Ação |
|--------|------|
| `Enter` | Enviar mensagem |
| `Ctrl+C` | Sair |
| `Esc` | Cancelar resposta em andamento |
| `Ctrl+L` | Limpar tela |
| `↑ / ↓` | Navegar no histórico de input |
| `Tab` | Autocompletar comandos |
| `Ctrl+S` | Salvar conversa em arquivo |

### Terminal

**CLI global** (disponível após a instalação):

| Comando | O que faz |
|---------|-----------|
| `lizz` | Inicia o bot (igual a `lizz start`) |
| `lizz start` | Inicia o bot |
| `lizz tui` | Chat interativo no terminal |
| `lizz stop` | Para o bot |
| `lizz status` | Verifica saúde e configuração |
| `lizz setup` | Executa o assistente de configuração |

**Modo dev** (dentro do diretório do projeto):

| Comando | O que faz |
|---------|-----------|
| `npm run start` | Inicia o bot (produção) |
| `npm run dev` | Inicia em modo dev (hot reload) |
| `npm run setup` | Executa o assistente de configuração |
| `npm run status` | Verifica a saúde da configuração |
| `npm run build` | Compila o TypeScript |
| `npm run test` | Roda os testes |

---

## Conexões

Conexões são integrações opcionais habilitadas por variáveis de ambiente. Quando ativas, suas instruções são automaticamente injetadas em cada requisição ao agente.

### Jira

Defina as credenciais para habilitar. O agente ganha acesso a um CLI para gerenciamento completo do ciclo de vida dos issues.

```bash
JIRA_HOST=minhaempresa.atlassian.net
JIRA_EMAIL=voce@empresa.com
JIRA_API_TOKEN=seu-api-token
```

O agente pode: buscar issues, pesquisar por JQL, transicionar status e adicionar comentários.

```bash
# Exemplos (chamados pelo agente via bash)
node dist/connections/jira/cli.js get PROJECT-123
node dist/connections/jira/cli.js search "assignee = currentUser() AND status = 'To Do'"
node dist/connections/jira/cli.js transition PROJECT-123 "In Review"
node dist/connections/jira/cli.js comment PROJECT-123 "PR criado: https://..."
```

### GitHub

Defina `GITHUB_REPO` para habilitar. Requer o CLI `gh` instalado e autenticado (`gh auth login`).

```bash
GITHUB_REPO=owner/nome-do-repo
```

O agente pode: criar branches, commitar, fazer push e abrir pull requests via `gh`.

### Repositório local

Defina `LOCAL_REPO_PATH` para dar ao agente acesso a um repositório git local.

```bash
LOCAL_REPO_PATH=C:/DEV/meu-projeto
```

---

## Agendamento de tarefas

Você pode agendar o bot para executar prompts automaticamente no Telegram e no Slack:

```bash
# Telegram: use seu Chat ID numérico
node dist/schedule-cli.js create "Resuma meus emails" "0 9 * * *" 123456789

# Slack: use o ID de um canal ou DM (ex: C0ANMACP82W)
node dist/schedule-cli.js create "Resuma meus emails" "0 9 * * *" C0ANMACP82W
```

Exemplos de cron:

| Padrão | Frequência |
|--------|-----------|
| `0 9 * * *` | Todo dia às 9h |
| `0 9 * * 1` | Toda segunda às 9h |
| `0 */4 * * *` | A cada 4 horas |

---

## Personalização

Edite o arquivo **`LIZZ.md`** na raiz do projeto para customizar:

- Nome do assistente
- Personalidade e tom de voz
- Skills disponíveis
- Regras de formatação

Você pode editar esse arquivo a qualquer momento. As mudanças são aplicadas na próxima mensagem.

---

## Envio de mídia

O bot aceita fotos e documentos nos dois mensageiros:

- 📷 **Fotos** — Envia uma imagem e o Claude vai analisá-la
- 📄 **Documentos** — Envie arquivos para o Claude processar

> No Slack, o bot precisa do escopo `files:read` para baixar os arquivos.

---

## Sistemas operacionais compatíveis

| SO | Suporte | Serviço em background |
|----|---------|----------------------|
| **Windows** | ✅ | Via PM2 (`pm2 start dist/index.js --name lizz`) |
| **macOS** | ✅ | Via launchd (configurado automaticamente pelo setup) |
| **Linux** | ✅ | Via systemd (configurado automaticamente pelo setup) |

---

## Estrutura do projeto

```
Lizz/
├── src/
│   ├── index.ts            # Ponto de entrada
│   ├── cli.ts              # CLI global (lizz start/stop/status/setup)
│   ├── bot.ts              # Lógica do bot Telegram (grammY)
│   ├── slack-bot.ts        # Lógica do bot Slack (@slack/bolt)
│   ├── agent.ts            # Integração com Claude Code
│   ├── config.ts           # Configurações
│   ├── db.ts               # Banco SQLite (sessões, memórias, tarefas)
│   ├── memory.ts           # Sistema de memória com decay
│   ├── scheduler.ts        # Agendador de tarefas (cron)
│   ├── media.ts            # Download e processamento de mídia
│   ├── tui.ts              # Terminal UI (chat interativo)
│   ├── format.ts           # Formatação de mensagens (Telegram HTML + Slack mrkdwn + TUI ANSI)
│   ├── logger.ts           # Logger (pino)
│   ├── setup.ts            # Assistente de instalação interativo
│   ├── status.ts           # Verificador de saúde
│   └── connections/
│       ├── index.ts        # Gerenciador de conexões
│       └── jira/
│           ├── client.ts   # Cliente REST do Jira
│           └── cli.ts      # CLI do Jira (chamado pelo agente via bash)
├── connections/
│   ├── jira/instructions.md
│   ├── github/instructions.md
│   └── local-repo/instructions.md
├── scripts/
│   └── notify.sh           # Script de notificação
├── install.ps1             # Instalador Windows (one-liner)
├── install.sh              # Instalador Linux/macOS (one-liner)
├── LIZZ.md                 # Personalidade e instruções do assistente
├── .env.example            # Exemplo de variáveis de ambiente
├── package.json
└── tsconfig.json
```

---

## Variáveis de ambiente

### Mensageiros

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `TELEGRAM_BOT_TOKEN` | ✅* | Token do bot (via @BotFather) |
| `ALLOWED_CHAT_ID` | ❌ | Seu Chat ID do Telegram (preenchido automaticamente no primeiro `/start`) |
| `SLACK_BOT_TOKEN` | ✅* | Token OAuth do bot Slack (`xoxb-...`) |
| `SLACK_APP_TOKEN` | ✅* | Token de app para Socket Mode (`xapp-...`) |
| `SLACK_SIGNING_SECRET` | ❌ | Signing secret do Slack |
| `ALLOWED_SLACK_USER_ID` | ❌ | Restringe o Slack a um único usuário (aberto a todos se não definido) |

*Pelo menos um mensageiro deve ser configurado (Telegram ou Slack).

### Conexões

| Variável | Descrição |
|----------|-----------|
| `JIRA_HOST` | Domínio Atlassian (ex: `minhaempresa.atlassian.net`) |
| `JIRA_EMAIL` | Email da conta Atlassian |
| `JIRA_API_TOKEN` | Token de API do Jira |
| `GITHUB_REPO` | Repositório GitHub (`owner/repo`) — requer CLI `gh` autenticado |
| `LOCAL_REPO_PATH` | Caminho absoluto para um repositório git local |

### Outros

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `ANTHROPIC_API_KEY` | ❌ | Chave da API Anthropic (opcional, usa `claude login` por padrão) |
| `LOG_LEVEL` | ❌ | Nível de log: `trace`, `debug`, `info`, `warn`, `error` (padrão: `info`) |

---

<p align="center">
  <sub>Faça seu dia melhor com Lizz</sub>
</p>
