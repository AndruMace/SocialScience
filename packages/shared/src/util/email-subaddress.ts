/**
 * Suggests a **subaddress** (same inbox, distinct address): `local+tag@domain`.
 * Often called “plus addressing” because many providers use `+` in the local part.
 *
 * Strips any existing `+tag` on the profile address and appends `+ssbsky{n}` so each
 * Bluesky signup gets a unique email while mail still lands in one mailbox (when the
 * provider supports subaddressing).
 */
export function suggestSubaddressEmail(profileEmail: string, slot: number): string | null {
  const trimmed = profileEmail.trim().toLowerCase()
  const at = trimmed.lastIndexOf('@')
  if (at < 1) return null
  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  if (!local || !domain) return null
  const baseLocal = local.split('+')[0] ?? local
  const n = Math.max(1, Math.min(Math.floor(slot), 10))
  return `${baseLocal}+ssbsky${n}@${domain}`
}
