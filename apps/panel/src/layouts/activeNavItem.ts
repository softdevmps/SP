/**
 * Devuelve la ruta del ítem del menú que corresponde a la página actual: el de ruta más larga
 * que contiene a la actual, contando también los ítems con submenú. Así /plataforma/finanzas/…
 * marca Finanzas y no Resumen (/plataforma).
 */
export function activeNavItemTo(path: string, itemPaths: string[]): string | null {
  const matches = itemPaths.filter((to) => path === to || path.startsWith(`${to}/`))
  return matches.sort((a, b) => b.length - a.length)[0] ?? null
}
