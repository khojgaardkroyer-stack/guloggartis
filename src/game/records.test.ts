import { describe, expect, it } from 'vitest'
import { OLD_RECORD_KEY, RECORD_KEYS, readRecord, saveRecord, type RecordStorage } from './records'

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  const storage: RecordStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
  }
  return { data, get: () => storage }
}

const throwing: RecordStorage = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
}

describe('readRecord', () => {
  it('reads each mode’s own record, and 0 when there is none', () => {
    const { get } = fakeStorage({ [RECORD_KEYS['2d']]: '123', [RECORD_KEYS['3d']]: '45' })
    expect(readRecord(get, '2d')).toBe(123)
    expect(readRecord(get, '3d')).toBe(45)
    expect(readRecord(fakeStorage().get, '2d')).toBe(0)
    expect(readRecord(fakeStorage().get, '3d')).toBe(0)
  })

  it('treats a value that is not a number as 0', () => {
    expect(readRecord(fakeStorage({ [RECORD_KEYS['3d']]: 'abc' }).get, '3d')).toBe(0)
  })

  it('copies the old record to the 2D record once, and leaves the old key alone', () => {
    const { data, get } = fakeStorage({ [OLD_RECORD_KEY]: '321' })
    expect(readRecord(get, '2d')).toBe(321)
    expect(data.get(RECORD_KEYS['2d'])).toBe('321')
    expect(data.get(OLD_RECORD_KEY)).toBe('321')

    // From now on the 2D record is its own: a later change to the old key is not copied again
    data.set(OLD_RECORD_KEY, '999')
    expect(readRecord(get, '2d')).toBe(321)
  })

  it('does not migrate when there is a 2D record already, and never into the 3D record', () => {
    const { data, get } = fakeStorage({ [OLD_RECORD_KEY]: '321', [RECORD_KEYS['2d']]: '50' })
    expect(readRecord(get, '2d')).toBe(50)
    expect(readRecord(get, '3d')).toBe(0)
    expect(data.has(RECORD_KEYS['3d'])).toBe(false)
  })

  it('returns 0 when the storage throws, or cannot be reached at all', () => {
    expect(readRecord(() => throwing, '2d')).toBe(0)
    expect(
      readRecord(() => {
        throw new Error('SecurityError')
      }, '3d'),
    ).toBe(0)
  })

  it('still returns the old record if copying it fails', () => {
    const storage: RecordStorage = {
      getItem: (key) => (key === OLD_RECORD_KEY ? '77' : null),
      setItem: () => {
        throw new Error('quota')
      },
    }
    expect(readRecord(() => storage, '2d')).toBe(77)
  })
})

describe('saveRecord', () => {
  it('writes the score only when it beats the mode’s record', () => {
    const { data, get } = fakeStorage({ [RECORD_KEYS['2d']]: '100' })
    expect(saveRecord(get, '2d', 90)).toBe(100)
    expect(data.get(RECORD_KEYS['2d'])).toBe('100')
    expect(saveRecord(get, '2d', 100)).toBe(100)
    expect(saveRecord(get, '2d', 150)).toBe(150)
    expect(data.get(RECORD_KEYS['2d'])).toBe('150')
  })

  it('keeps the two modes apart', () => {
    const { data, get } = fakeStorage({ [RECORD_KEYS['2d']]: '500' })
    expect(saveRecord(get, '3d', 40)).toBe(40)
    expect(data.get(RECORD_KEYS['3d'])).toBe('40')
    expect(data.get(RECORD_KEYS['2d'])).toBe('500')
  })

  it('compares with the migrated old record', () => {
    const { data, get } = fakeStorage({ [OLD_RECORD_KEY]: '300' })
    expect(saveRecord(get, '2d', 200)).toBe(300)
    expect(data.get(RECORD_KEYS['2d'])).toBe('300')
  })

  it('returns the new record for this visit when the storage throws', () => {
    expect(saveRecord(() => throwing, '3d', 60)).toBe(60)
    expect(saveRecord(() => throwing, '3d', 0)).toBe(0)
  })
})
