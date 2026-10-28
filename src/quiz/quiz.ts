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
