// Direction rules for menus near the top or bottom edge of the panel.

import { describe, expect, test } from 'vitest'
import { shouldOpenUp } from '../src/logic/popover'

describe('shouldOpenUp', () => {
  test('a top model menu opens downward when there is no room above', () => {
    expect(shouldOpenUp({ preferUp: true, above: 40, below: 420, height: 180 })).toBe(false)
  })

  test('a bottom composer menu opens upward when there is no room below', () => {
    expect(shouldOpenUp({ preferUp: false, above: 420, below: 40, height: 180 })).toBe(true)
  })

  test('a preferred upward menu stays upward when it fits', () => {
    expect(shouldOpenUp({ preferUp: true, above: 300, below: 40, height: 180 })).toBe(true)
  })

  test('a normal downward menu stays downward when it fits', () => {
    expect(shouldOpenUp({ preferUp: false, above: 40, below: 300, height: 180 })).toBe(false)
  })
})
