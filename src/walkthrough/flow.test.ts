import { describe, expect, it } from 'vitest'
import { isEnd, nextSteps, type Role, startStep, type StepId, steps, viewFor } from './flow'

const roles: Role[] = ['buyer', 'seller']
const allIds = Object.keys(steps) as StepId[]

/** Every path from the start for one role, following every choice, event and "Videre". */
function allPaths(role: Role): StepId[][] {
  const paths: StepId[][] = []
  function walk(path: StepId[]) {
    const current = path[path.length - 1]
    const next = nextSteps(current, role)
    if (next.length === 0) {
      paths.push(path)
      return
    }
    for (const id of next) {
      if (path.includes(id)) throw new Error(`Cycle for ${role}: ${[...path, id].join(' → ')}`)
      walk([...path, id])
    }
  }
  walk([startStep()])
  return paths
}

function reachable(role: Role): Set<StepId> {
  return new Set(allPaths(role).flat())
}

/** The path taken by always picking the choice with this label (or the only next step). */
function pathVia(role: Role, picks: string[]): StepId[] {
  return allPaths(role).find((path) =>
    picks.every((label) =>
      path.some((id, i) => {
        const view = viewFor(id, role)
        return view.kind === 'choices' && view.choices.some((c) => c.label === label && c.next === path[i + 1])
      }),
    ),
  )!
}

describe('flow data', () => {
  it('has every step stored under its own id', () => {
    for (const id of allIds) expect(steps[id].id).toBe(id)
  })

  it('only points to steps that exist', () => {
    for (const id of allIds) {
      for (const role of roles) {
        if (!steps[id][role]) continue
        for (const next of nextSteps(id, role)) expect(allIds).toContain(next)
      }
    }
  })

  it('can reach every step from the start for at least one role', () => {
    const seen = new Set([...reachable('buyer'), ...reachable('seller')])
    expect([...seen].sort()).toEqual([...allIds].sort())
  })

  it.each(roles)('reaches an end on every path without cycles as %s', (role) => {
    const paths = allPaths(role)
    expect(paths.length).toBeGreaterThan(1)
    for (const path of paths) expect(isEnd(path[path.length - 1])).toBe(true)
  })

  it.each(roles)('ends the normal path with the money at the seller as %s', (role) => {
    const approve = role === 'buyer' ? 'Godkend varen' : 'Køber er glad'
    const path = pathVia(role, [approve])
    expect(path).toContain('udbetaling')
    expect(steps[path[path.length - 1]].money).toBe('seller')
  })

  it.each(roles)('gives the buyer the money back on the return path as %s', (role) => {
    const reject = role === 'buyer' ? 'Afvis varen' : 'Køber afviser varen'
    const path = pathVia(role, [reject])
    expect(path).toEqual(expect.arrayContaining(['retur', 'returtjek']))
    const end = path[path.length - 1]
    expect(end).toBe('penge-tilbage')
    expect(steps[end].money).toBe('refunded')
  })

  it.each(roles)('keeps the money on the trade account from Betaling until payout or refund as %s', (role) => {
    for (const path of allPaths(role)) {
      const approval = path.indexOf('godkendelse')
      const paid = path.indexOf('betaling')
      path.forEach((id, i) => {
        const { money } = steps[id]
        if (i <= approval) expect(money).not.toBe('seller')
        if (i < paid) expect(money).toBe('buyer')
        if (i >= paid && money !== 'seller' && money !== 'refunded') expect(money).toBe('escrow')
      })
      // Once paid out or refunded, the money never returns to the trade account.
      const settled = path.findIndex((id) => ['seller', 'refunded'].includes(steps[id].money))
      expect(settled).toBeGreaterThan(approval)
      for (const id of path.slice(settled)) expect(['seller', 'refunded']).toContain(steps[id].money)
    }
  })

  it.each(roles)('gives the acting role choices and the other role an event or plain Videre as %s', (role) => {
    for (const id of reachable(role)) {
      const { actor } = steps[id]
      const kind = viewFor(id, role).kind
      if (isEnd(id)) {
        expect(kind).toBe('end')
      } else if (actor === role || actor === 'both') {
        expect(kind).toBe('choices')
      } else if (id === 'godkendelse' && role === 'seller') {
        // Decided exception: the visiting seller picks the buyer's reaction.
        expect(kind).toBe('choices')
      } else {
        expect(['event', 'continue']).toContain(kind)
        if (actor === null) expect(kind).toBe('continue')
        else expect(kind).toBe('event')
      }
    }
  })

  it('takes the buyer from "Gør ingenting" to Udbetaling via the 12-hour step', () => {
    const view = viewFor('godkendelse', 'buyer')
    expect(view.kind).toBe('choices')
    const nothing = view.kind === 'choices' && view.choices.find((c) => c.label === 'Gør ingenting')
    expect(nothing && nothing.next).toBe('tolv-timer')
    expect(nextSteps('tolv-timer', 'buyer')).toEqual(['udbetaling'])
    expect(steps['tolv-timer'].progress).toEqual({ step: 5, total: 7 })
  })
})

describe('viewFor', () => {
  it('returns choices for the actor and an event for the other role', () => {
    expect(viewFor('betaling', 'buyer').kind).toBe('choices')
    expect(viewFor('betaling', 'seller')).toMatchObject({ kind: 'event', next: 'forsendelse' })
    expect(viewFor('forsendelse', 'seller').kind).toBe('choices')
    expect(viewFor('forsendelse', 'buyer')).toMatchObject({ kind: 'event', next: 'levering' })
  })

  it('returns a plain Videre when nobody acts and an end on end steps', () => {
    expect(viewFor('levering', 'buyer')).toMatchObject({ kind: 'continue', next: 'godkendelse' })
    expect(viewFor('afsluttet', 'seller').kind).toBe('end')
    expect(viewFor('penge-tilbage', 'buyer').kind).toBe('end')
  })

  it('throws for a step the role never sees', () => {
    expect(() => viewFor('tolv-timer', 'seller')).toThrow()
  })
})
