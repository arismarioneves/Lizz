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
  <b>Controle seu computador pelo Telegram ou Slack usando Claude Code.</b><br>
  Simples. Leve. Sem complicação.
</p>

---

## O que é o MyClaw?

MyClaw é uma versão **lite e simplificada** do OpenClaw. Ele conecta o **Claude Code** ao **Telegram** e/ou **Slack**, permitindo que você controle seu computador remotamente de qualquer lugar, direto pelo chat.

O projeto reutiliza o ambiente seguro do Claude Code (skills, sessões e coworking), mas com um bypass de permissões que dá acesso total ao sistema, não apenas a pasta do coworking.

### Como funciona?

```
Você (Telegram ou Slack) → Bot MyClaw → Claude Code → Seu computador
```

1. Você envia uma mensagem no Telegram ou Slack
2. O bot repassa para o Claude Code
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

Pelo menos um mensageiro (Telegram ou Slack) deve ser configurado.

---

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/arismarioneves/MyClaw.git
cd MyClaw
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Execute o setup interativo

```bash
npm run setup
```

O setup vai:
- ✅ Verificar se o Node.js e o Claude CLI estão instalados
- ✅ Compilar o projeto (TypeScript → JavaScript)
- ✅ Pedir o **token do bot** do Telegram
- ✅ Abrir o arquivo `MYCLAW.md` para você personalizar o assistente
- ✅ Criar o arquivo `.env` com suas configurações
- ✅ Oferecer instalação como serviço em background (opcional)

### 4. Inicie o bot

```bash
npm run start
```

Pronto! Abra o Telegram ou Slack e mande uma mensagem para o seu bot.

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
3. Adicione escopos ao bot token: `chat:write`, `app_mentions:read`, `im:history`
4. Instale o app no workspace e copie o **Bot Token** (`SLACK_BOT_TOKEN`)
5. Habilite as **Event Subscriptions**: `message.im` e `app_mention`
6. Adicione o comando `/newchat` apontando para o seu app
7. Defina `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` e `SLACK_SIGNING_SECRET` no `.env`

Os dois mensageiros podem rodar simultaneamente.

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

### Terminal

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

Você pode agendar o bot para executar prompts automaticamente (apenas Telegram):

```bash
node dist/schedule-cli.js create "Resuma meus emails" "0 9 * * *" SEU_CHAT_ID
```

Exemplos de cron:

| Padrão | Frequência |
|--------|-----------|
| `0 9 * * *` | Todo dia às 9h |
| `0 9 * * 1` | Toda segunda às 9h |
| `0 */4 * * *` | A cada 4 horas |

---

## Personalização

Edite o arquivo **`MYCLAW.md`** na raiz do projeto para customizar:

- Nome do assistente
- Personalidade e tom de voz
- Skills disponíveis
- Regras de formatação

Você pode editar esse arquivo a qualquer momento. As mudanças são aplicadas na próxima mensagem.

---

## Envio de mídia

Via Telegram, o bot aceita:

- 📷 **Fotos** — Envia uma imagem e o Claude vai analisá-la
- 📄 **Documentos** — Envie arquivos para o Claude processar

---

## Sistemas operacionais compatíveis

| SO | Suporte | Serviço em background |
|----|---------|----------------------|
| **Windows** | ✅ | Via PM2 (`pm2 start dist/index.js --name myclaw`) |
| **macOS** | ✅ | Via launchd (configurado automaticamente pelo setup) |
| **Linux** | ✅ | Via systemd (configurado automaticamente pelo setup) |

---

## Estrutura do projeto

```
MyClaw/
├── src/
│   ├── index.ts            # Ponto de entrada
│   ├── bot.ts              # Lógica do bot Telegram (grammY)
│   ├── slack-bot.ts        # Lógica do bot Slack (@slack/bolt)
│   ├── agent.ts            # Integração com Claude Code
│   ├── config.ts           # Configurações
│   ├── db.ts               # Banco SQLite (sessões, memórias, tarefas)
│   ├── memory.ts           # Sistema de memória com decay
│   ├── scheduler.ts        # Agendador de tarefas (cron)
│   ├── media.ts            # Download e processamento de mídia
│   ├── format.ts           # Formatação de mensagens (Telegram HTML + Slack mrkdwn)
│   ├── logger.ts           # Logger (pino)
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
│   ├── setup.ts            # Assistente de instalação interativo
│   ├── status.ts           # Verificador de saúde
│   └── notify.sh           # Script de notificação
├── MYCLAW.md               # Personalidade e instruções do assistente
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

## Resumo rápido

```bash
git clone https://github.com/arismarioneves/MyClaw.git
cd MyClaw
npm install
npm run setup
npm run start
```

5 comandos. É isso.

---

<p align="center">
  <sub>Faça seu dia melhor com MyClaw</sub>
</p>
