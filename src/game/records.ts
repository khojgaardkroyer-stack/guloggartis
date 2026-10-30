// The game's records (HI), one per mode, kept in localStorage. Plain functions over a storage
// getter, so they can be tested with a fake storage; every access is wrapped in try/catch, since
// storage can be missing or throw (private mode, blocked site data).
import type { GameMode } from './engine'

export type RecordStorage = Pick<Storage, 'getItem' | 'setItem'>

export const RECORD_KEYS: Record<GameMode, string> = {
  '2d': 'ggame-highscore-2d',
  '3d': 'ggame-highscore-3d',
}
/** The single record from before there were two modes; it becomes the 2D record */
export const OLD_RECORD_KEY = 'ggame-highscore'

/**
 * The record for `mode`, or 0. The first time the 2D record is read and missing, the old record
 * is copied over to it (the old key is left alone).
 */
export function readRecord(getStorage: () => RecordStorage, mode: GameMode): number {
  let storage: RecordStorage
  let value: string | null
  try {
    storage = getStorage()
    value = storage.getItem(RECORD_KEYS[mode])
  } catch {
    return 0
  }
  if (value === null && mode === '2d') {
    try {
      value = storage.getItem(OLD_RECORD_KEY)
      if (value !== null) storage.setItem(RECORD_KEYS['2d'], value)
    } catch {
      // keep whatever was read; the copy is tried again on the next read
    }
  }
  return Number(value) || 0
}

/** Saves `score` as the record for `mode` if it beats the stored one. Returns the record after. */
export function saveRecord(getStorage: () => RecordStorage, mode: GameMode, score: number): number {
  const best = readRecord(getStorage, mode)
  if (score <= best) return best
  try {
    getStorage().setItem(RECORD_KEYS[mode], String(score))
  } catch {
    // storage unavailable; the record is kept for this visit only
  }
  return score
}
