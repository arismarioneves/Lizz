import { describe, it, expect } from 'vitest'
import { formatForTui } from './format.js'

describe('formatForTui', () => {
  it('renders bold text', () => {
    const result = formatForTui('**hello**')
    expect(result).toContain('hello')
    // Bold markers should be stripped (not raw ** in output)
    expect(result).not.toContain('**')
  })

  it('renders inline code', () => {
    const result = formatForTui('use `npm install`')
    expect(result).toContain('npm install')
  })

  it('renders code blocks', () => {
    const result = formatForTui('```js\nconst x = 1\n```')
    expect(result).toContain('const')
    expect(result).toContain('x')
  })

  it('renders plain text without crashing', () => {
    const result = formatForTui('just plain text')
    expect(result).toContain('just plain text')
  })

  it('handles empty string', () => {
    const result = formatForTui('')
    expect(result).toBeDefined()
  })

  it('renders links with URL visible', () => {
    const result = formatForTui('[click here](https://example.com)')
    expect(result).toContain('example.com')
  })

  it('renders lists', () => {
    const result = formatForTui('- item one\n- item two')
    expect(result).toContain('item one')
    expect(result).toContain('item two')
  })
})
