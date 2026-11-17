// Popover direction chosen from the space around its trigger, not its position in the panel.

/** Inputs for {@link shouldOpenUp}. */
export interface PopoverSpace {
  readonly preferUp: boolean
  readonly above: number
  readonly below: number
  readonly height: number
}

/** Choose upward only when the preferred side fits, or the other side is too small. */
export function shouldOpenUp({ preferUp, above, below, height }: PopoverSpace): boolean {
  const room = height + 12
  if (preferUp) return above >= room || below < room
  return below < room && above > below
}
