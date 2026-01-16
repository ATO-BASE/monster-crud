/**
 * Formats a price value as USD currency
 * @param price - The price value to format
 * @returns Formatted price string in USD (e.g., "$1,234.56")
 */
export function formatPriceUSD(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  
  if (isNaN(numPrice)) {
    return '$0.00'
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numPrice)
}
