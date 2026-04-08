import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import path from 'path'
import os from 'os'

import { readPid, isAlive } from './cli.js'

const TMP = path.join(os.tmpdir(), 'lizz-cli-test-' + process.pid)
const PID_FILE = path.join(TMP, 'lizz.pid')

beforeEach(() => mkdirSync(TMP, { recursive: true }))
afterEach(() => rmSync(TMP, { recursive: true, force: true }))

describe('readPid', () => {
  it('returns null when pid file does not exist', () => {
    expect(readPid(PID_FILE)).toBeNull()
  })

  it('returns null for non-numeric content', () => {
    writeFileSync(PID_FILE, 'notanumber')
    expect(readPid(PID_FILE)).toBeNull()
  })

  it('returns the numeric pid when file contains a valid integer', () => {
    writeFileSync(PID_FILE, '12345')
    expect(readPid(PID_FILE)).toBe(12345)
  })
})

describe('isAlive', () => {
  it('returns true for the current process', () => {
    expect(isAlive(process.pid)).toBe(true)
  })

  it('returns false for a pid that does not exist', () => {
    expect(isAlive(2147483647)).toBe(false)
  })
})
