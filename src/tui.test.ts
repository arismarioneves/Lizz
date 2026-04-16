import { describe, it, expect } from 'vitest'
import { completer, TUI_COMMANDS } from './tui.js'

describe('completer', () => {
  it('returns matching commands for partial input', () => {
    const [hits, line] = completer('/new')
    expect(hits).toEqual(['/newchat'])
    expect(line).toBe('/new')
  })

  it('returns all commands when no match', () => {
    const [hits, line] = completer('/xyz')
    expect(hits).toEqual(TUI_COMMANDS)
    expect(line).toBe('/xyz')
  })

  it('returns multiple matches for shared prefix', () => {
    const [hits] = completer('/sch')
    expect(hits).toEqual(['/schedule'])
  })

  it('returns all commands for slash alone', () => {
    const [hits] = completer('/')
    expect(hits).toEqual(TUI_COMMANDS)
  })

  it('returns empty completions for non-command text', () => {
    const [hits] = completer('hello')
    expect(hits).toEqual([])
  })
})
