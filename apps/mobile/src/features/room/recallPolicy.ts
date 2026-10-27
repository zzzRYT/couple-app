/**
 * When the room recalls the mascot automatically: once per room opening, only when the mascot is missing
 * and nobody holds the prompt lease. The exact moment is an assumption (interaction-notes §11) kept in this one place.
 */
export function shouldAutoRecall({ hasMascot, occupied, online, alreadyTried }: { hasMascot: boolean; occupied: boolean; online: boolean; alreadyTried: boolean }): boolean {
  return !hasMascot && !occupied && online && !alreadyTried;
}
