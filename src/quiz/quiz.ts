import type { QuizItem } from './items'

export type Answer = 'scam' | 'fine'

/** Fisher–Yates shuffle. Returns a new array; the input is left untouched. */
export function shuffle<T>(list: readonly T[], rng: () => number = Math.random): T[] {
  const result = [...list]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** How many scams and fine items one round draws from the pool. */
export const ROUND_SCAMS = 4
export const ROUND_FINE = 2

/**
 * Draws one round from the pool: 4 random scams and 2 random fine items, in random order.
 * Returns a new array; the input is left untouched.
 */
export function drawRound(list: readonly QuizItem[], rng: () => number = Math.random): QuizItem[] {
  const scams = shuffle(
    list.filter((item) => item.isScam),
    rng,
  ).slice(0, ROUND_SCAMS)
  const fine = shuffle(
    list.filter((item) => !item.isScam),
    rng,
  ).slice(0, ROUND_FINE)
  return shuffle([...scams, ...fine], rng)
}

export function isCorrect(item: QuizItem, answer: Answer): boolean {
  return item.isScam === (answer === 'scam')
}

/** Counts correct answers. Each entry pairs an item with the answer given for it. */
export function scoreOf(answers: readonly { item: QuizItem; answer: Answer }[]): number {
  return answers.filter(({ item, answer }) => isCorrect(item, answer)).length
}

export function resultText(score: number, total: number): string {
  if (score >= total) return 'Perfekt! Du spottede det hele.'
  if (score >= total - 2) return 'Flot! Du har godt øje for svindel.'
  return 'Svindlere kan være svære at gennemskue, men nu kender du tegnene.'
}

/**
 * Splits `text` around the first occurrence of `warning`. Returns `[text]` when there is no
 * warning or it isn't found.
 */
export function splitOnWarning(text: string, warning?: string): [string] | [string, string, string] {
  if (!warning) return [text]
  const start = text.indexOf(warning)
  if (start === -1) return [text]
  return [text.slice(0, start), warning, text.slice(start + warning.length)]
}
