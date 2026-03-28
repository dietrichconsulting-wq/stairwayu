/**
 * Prompt-injection defense for AI routes.
 *
 * Two layers:
 *  1. sanitize() — cleans a single user-supplied string
 *  2. userBlock() — wraps sanitized content in XML-style delimiters
 *     that the system prompt can reference unambiguously
 */

const MAX_SHORT = 200   // school name, major, essay type, etc.
const MAX_MEDIUM = 500  // extracurriculars, background blurbs
const MAX_LONG = 12_000 // essay drafts

/** Patterns that attempt to override system instructions. */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /ignore\s+(all\s+)?above\s+instructions/gi,
  /you\s+are\s+now\s+(a|an)\b/gi,
  /disregard\s+(all\s+)?(prior|previous|above)/gi,
  /new\s+instructions?\s*:/gi,
  /system\s*:\s*/gi,
  /assistant\s*:\s*/gi,
  /\buser\s*:\s*/gi,
  /<<\s*SYS\s*>>/gi,
  /<\/?system>/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
]

/**
 * Sanitize a user-supplied string before inserting it into a prompt.
 *
 * @param raw   The raw input (may be undefined/null)
 * @param max   Maximum character length (truncated, not rejected)
 * @returns     Cleaned string, or empty string for falsy input
 */
export function sanitize(raw: unknown, max: number = MAX_SHORT): string {
  if (raw == null) return ''
  let s = String(raw).trim()

  // Truncate
  if (s.length > max) s = s.slice(0, max) + '…'

  // Neutralise injection phrases by inserting a zero-width space so the
  // semantic meaning is broken for the model but the text is still readable
  // if echoed back.
  for (const pat of INJECTION_PATTERNS) {
    s = s.replace(pat, (match) => match.slice(0, 1) + '\u200B' + match.slice(1))
  }

  return s
}

/** Shorthand presets */
export const sShort  = (v: unknown) => sanitize(v, MAX_SHORT)
export const sMedium = (v: unknown) => sanitize(v, MAX_MEDIUM)
export const sLong   = (v: unknown) => sanitize(v, MAX_LONG)

/**
 * Wrap user-supplied content in XML-style delimiters so the system prompt can
 * instruct the model to treat everything between the tags as opaque data.
 */
export function userBlock(label: string, content: string): string {
  return `<user-provided-${label}>\n${content}\n</user-provided-${label}>`
}

/**
 * Sanitize a value that should be numeric. Returns the number as a string,
 * or the fallback label.
 */
export function sNum(raw: unknown, fallback = 'Not provided'): string {
  if (raw == null || raw === '') return fallback
  const n = Number(raw)
  if (Number.isNaN(n)) return fallback
  return String(n)
}
