/** Master or director — can access user list API. */
export function isAdminUser(role: string | undefined | null): boolean {
  if (!role) return false
  const r = String(role).toLowerCase()
  return r === 'master' || r === 'director'
}

/** Only master can change roles (matches backend). */
export function isMasterUser(role: string | undefined | null): boolean {
  return String(role || '').toLowerCase() === 'master'
}
