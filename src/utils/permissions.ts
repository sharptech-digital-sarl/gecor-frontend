export function hasPermission(
  user: { permissions?: string[] } | null | undefined,
  key: string
): boolean {
  return !!user?.permissions?.includes(key)
}
