const MAX_REGEX_LENGTH = 100
const MAX_NESTING_DEPTH = 3
const REGEX_TIMEOUT_MS = 100

const CATASTROPHIC_PATTERNS = [
  /\(\w+\+\)\+/,
  /\(\w+\*\|\w+\)\+/,
  /\(\.\*\)\+/,
]

function nestingDepth(pattern: string): number {
  let depth = 0
  let max = 0
  for (const ch of pattern) {
    if (ch === '(') { depth++; max = Math.max(max, depth) }
    else if (ch === ')') depth--
  }
  return max
}

export function isSafeRegexSync(pattern: string): { ok: boolean; error?: string } {
  if (pattern.length > MAX_REGEX_LENGTH) {
    return { ok: false, error: `Regex too long (max ${MAX_REGEX_LENGTH} characters)` }
  }
  if (nestingDepth(pattern) > MAX_NESTING_DEPTH) {
    return { ok: false, error: `Regex nesting too deep (max ${MAX_NESTING_DEPTH} levels)` }
  }
  for (const cp of CATASTROPHIC_PATTERNS) {
    if (cp.test(pattern)) {
      return { ok: false, error: 'Pattern may cause catastrophic backtracking' }
    }
  }
  try {
    new RegExp(pattern)
  } catch (e) {
    return { ok: false, error: `Invalid regex: ${(e as Error).message}` }
  }
  return { ok: true }
}

export function isSafeRegexAsync(pattern: string): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('../workers/regexWorker.ts', import.meta.url), { type: 'module' })
    const timer = setTimeout(() => {
      worker.terminate()
      resolve({ ok: false, error: 'Regex timed out (too complex)' })
    }, REGEX_TIMEOUT_MS)
    worker.onmessage = (e) => {
      clearTimeout(timer)
      worker.terminate()
      resolve(e.data)
    }
    worker.postMessage({ pattern })
  })
}
