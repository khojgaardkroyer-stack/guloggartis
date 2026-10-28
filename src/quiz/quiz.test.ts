import { describe, expect, it } from 'vitest'
import { items, type QuizItem } from './items'
import { drawRound, isCorrect, resultText, scoreOf, shuffle, splitOnWarning } from './quiz'

/** Deterministic pseudo-random sequence for tests. */
function seededRng(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const scam = items.find((item) => item.isScam)!
const fine = items.find((item) => !item.isScam)!

describe('shuffle', () => {
  it('returns the same items in a new order for a given rng', () => {
    const input = [1, 2, 3, 4, 5, 6]
    const result = shuffle(input, seededRng(42))
    expect(result).not.toEqual(input)
    expect([...result].sort()).toEqual(input)
  })

  it('is deterministic for the same rng', () => {
    expect(shuffle(items, seededRng(7))).toEqual(shuffle(items, seededRng(7)))
  })

  it('never loses or duplicates an item', () => {
    for (let seed = 0; seed < 50; seed++) {
      const result = shuffle(items, seededRng(seed))
      expect(result).toHaveLength(items.length)
      expect(new Set(result.map((item) => item.id))).toEqual(new Set(items.map((item) => item.id)))
    }
  })

  it('handles an rng at the edges of its range', () => {
    expect([...shuffle([1, 2, 3], () => 0)].sort()).toEqual([1, 2, 3])
    expect([...shuffle([1, 2, 3], () => 0.999999)].sort()).toEqual([1, 2, 3])
  })

  it('does not mutate its input', () => {
    const input = [1, 2, 3, 4, 5, 6]
    const copy = [...input]
    shuffle(input, seededRng(1))
    expect(input).toEqual(copy)
  })
})

describe('isCorrect', () => {
  it('"Svindel" is right for scams and wrong for fine items', () => {
    expect(isCorrect(scam, 'scam')).toBe(true)
    expect(isCorrect(fine, 'scam')).toBe(false)
  })

  it('"I orden" is right for fine items and wrong for scams', () => {
    expect(isCorrect(fine, 'fine')).toBe(true)
    expect(isCorrect(scam, 'fine')).toBe(false)
  })
})

describe('scoreOf', () => {
  it('counts correct answers', () => {
    expect(scoreOf([])).toBe(0)
    expect(
      scoreOf([
        { item: scam, answer: 'scam' },
        { item: fine, answer: 'scam' },
        { item: fine, answer: 'fine' },
        { item: scam, answer: 'fine' },
      ]),
    ).toBe(2)
  })
})

describe('resultText', () => {
  it('returns the right tier text', () => {
    expect(resultText(6, 6)).toBe('Perfekt! Du spottede det hele.')
    expect(resultText(5, 6)).toBe('Flot! Du har godt øje for svindel.')
    expect(resultText(4, 6)).toBe('Flot! Du har godt øje for svindel.')
    expect(resultText(3, 6)).toBe('Svindlere kan være svære at gennemskue, men nu kender du tegnene.')
    expect(resultText(0, 6)).toBe('Svindlere kan være svære at gennemskue, men nu kender du tegnene.')
  })
})

describe('splitOnWarning', () => {
  it('splits around the warning', () => {
    expect(splitOnWarning('Hej! Send pengene nu, tak.', 'Send pengene nu')).toEqual([
      'Hej! ',
      'Send pengene nu',
      ', tak.',
    ])
  })

  it('returns the whole text unsplit when there is no warning', () => {
    expect(splitOnWarning('Alt er fint.')).toEqual(['Alt er fint.'])
    expect(splitOnWarning('Alt er fint.', undefined)).toEqual(['Alt er fint.'])
  })
})

function warningField(item: QuizItem): string | undefined {
  if (item.warningIn === 'text' && item.kind === 'chat') return item.text
  if (item.warningIn === 'title' && item.kind === 'ad') return item.title
  if (item.warningIn === 'description' && item.kind === 'ad') return item.description
  return undefined
}

describe('items', () => {
  it('has 12 items, exactly 4 of them fine', () => {
    expect(items).toHaveLength(12)
    expect(items.filter((item) => !item.isScam)).toHaveLength(4)
  })

  it('has unique ids', () => {
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length)
  })

  it.each(items.filter((item) => item.isScam).map((item) => [item.id, item] as const))(
    'scam %s has a warning that is an exact substring of its warningIn field',
    (_id, item) => {
      expect(item.warning).toBeTruthy()
      const field = warningField(item)
      expect(field).toBeDefined()
      expect(field).toContain(item.warning)
    },
  )

  it('no fine item has a warning', () => {
    for (const item of items.filter((item) => !item.isScam)) {
      expect(item.warning).toBeUndefined()
      expect(item.warningIn).toBeUndefined()
    }
  })
})

describe('drawRound', () => {
  const rngs: [string, () => number][] = [
    ['always 0', () => 0],
    ['always just under 1', () => 0.999999],
    ...[1, 2, 3, 42, 1234].map((seed) => [`seed ${seed}`, seededRng(seed)] as [string, () => number]),
  ]

  it.each(rngs)('returns 6 distinct pool items, 4 scams and 2 fine (%s)', (_name, rng) => {
    const round = drawRound(items, rng)
    expect(round).toHaveLength(6)
    expect(new Set(round.map((item) => item.id)).size).toBe(6)
    for (const item of round) expect(items).toContain(item)
    expect(round.filter((item) => item.isScam)).toHaveLength(4)
    expect(round.filter((item) => !item.isScam)).toHaveLength(2)
  })

  it('does not mutate its input', () => {
    const copy = [...items]
    drawRound(items, seededRng(5))
    expect(items).toEqual(copy)
  })
})
