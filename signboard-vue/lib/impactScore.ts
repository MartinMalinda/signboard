export function formatImpactScore(value: unknown) {
  return (typeof value === 'number' && Number.isFinite(value) ? value : 0).toFixed(1)
}
