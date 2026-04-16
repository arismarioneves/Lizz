import { Marked } from 'marked'
import { markedTerminal } from 'marked-terminal'
import { MAX_MESSAGE_LENGTH } from './config.js'

// ─── TUI formatting ─────────────────────────────────────────────────────────

const tuiMarked = new Marked()
tuiMarked.use(markedTerminal())

/**
 * Convert Markdown text to ANSI-styled terminal output.
 * Uses marked-terminal for rendering with syntax highlighting via cli-highlight.
 */
export function formatForTui(text: string): string {
  const result = tuiMarked.parse(text) as string
  return result.trimEnd()
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Convert Markdown text to Telegram-compatible HTML.
 * Telegram supports: <b>, <i>, <code>, <pre>, <s>, <a>, <u>
 */
export function formatForTelegram(text: string): string {
  const blocks: string[] = []

  // 1. Extract and protect fenced code blocks
  let result = text.replace(/```[\w]*\n?([\s\S]*?)```/g, (_match, code: string) => {
    const idx = blocks.length
    blocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`)
    return `\x00BLK${idx}\x00`
  })

  // 2. Extract and protect inline code
  result = result.replace(/`([^`\n]+)`/g, (_match, code: string) => {
    const idx = blocks.length
    blocks.push(`<code>${escapeHtml(code)}</code>`)
    return `\x00BLK${idx}\x00`
  })

  // 3. Escape HTML special chars in remaining text
  result = result
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 4. Apply markdown conversions (safe now that we've escaped raw text)
  // Headings
  result = result.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>')

  // Bold (must come before italic)
  result = result.replace(/\*\*(.+?)\*\*/gs, '<b>$1</b>')
  result = result.replace(/__(.+?)__/gs, '<b>$1</b>')

  // Italic
  result = result.replace(/\*([^*\n]+)\*/g, '<i>$1</i>')
  result = result.replace(/(?<![_])_([^_\n]+)_(?![_])/g, '<i>$1</i>')

  // Strikethrough
  result = result.replace(/~~(.+?)~~/gs, '<s>$1</s>')

  // Links
  result = result.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>')

  // Checkboxes
  result = result.replace(/- \[ \]/g, '☐')
  result = result.replace(/- \[x\]/gi, '☑')

  // Strip horizontal rules
  result = result.replace(/^-{3,}$/gm, '')
  result = result.replace(/^\*{3,}$/gm, '')

  // 5. Restore protected blocks
  result = result.replace(/\x00BLK(\d+)\x00/g, (_, i: string) => blocks[parseInt(i)] ?? '')

  return result.trim()
}

/**
 * Convert Markdown text to Slack mrkdwn format.
 */
export function formatForSlack(text: string): string {
  // Protect code blocks from further transformation
  const codeBlocks: string[] = []
  let result = text.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match)
    return `\x00CODE${codeBlocks.length - 1}\x00`
  })

  // Protect inline code
  const inlineCodes: string[] = []
  result = result.replace(/`[^`\n]+`/g, (match) => {
    inlineCodes.push(match)
    return `\x00INLINE${inlineCodes.length - 1}\x00`
  })

  // Headers → bold
  result = result.replace(/^#{1,6}\s+(.+)$/gm, '*$1*')

  // Bold: **text** → *text*
  result = result.replace(/\*\*(.+?)\*\*/g, '*$1*')

  // Italic: _text_ or *text* (single) → _text_
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '_$1_')
  result = result.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '_$1_')

  // Strikethrough: ~~text~~ → ~text~
  result = result.replace(/~~(.+?)~~/g, '~$1~')

  // Links: [text](url) → <url|text>
  result = result.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<$2|$1>')

  // Horizontal rules → empty line
  result = result.replace(/^[-*_]{3,}$/gm, '')

  // Restore code blocks
  result = result.replace(/\x00CODE(\d+)\x00/g, (_, i) => codeBlocks[Number(i)] ?? '')
  result = result.replace(/\x00INLINE(\d+)\x00/g, (_, i) => inlineCodes[Number(i)] ?? '')

  return result.trim()
}

export function splitMessage(text: string, limit = MAX_MESSAGE_LENGTH): string[] {
  if (text.length <= limit) return [text]

  const chunks: string[] = []
  let remaining = text

  while (remaining.length > limit) {
    let splitAt = remaining.lastIndexOf('\n', limit)
    if (splitAt <= 0) splitAt = remaining.lastIndexOf(' ', limit)
    if (splitAt <= 0) splitAt = limit
    chunks.push(remaining.slice(0, splitAt))
    remaining = remaining.slice(splitAt).trimStart()
  }

  if (remaining.length > 0) chunks.push(remaining)
  return chunks
}
