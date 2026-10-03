const moneyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

/** "$ 2.500" */
export function formatMoney(amount: number): string {
  return moneyFormatter.format(amount)
}
