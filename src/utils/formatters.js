import numeral from 'numeral'

const EMPTY_VALUE = '—'
const MAX_PRICE_DECIMALS = 8

/*
 * numeral 2.0.6 formats by way of String(value), so any number JavaScript renders in
 * exponential notation comes back as the literal string "NaN". That covers two ranges
 * we genuinely hit:
 *
 *   |value| < 1e-6    every sub-cent crypto price (0.00000001 -> "1e-8" -> NaN)
 *   |value| >= 1e21   beyond numeral's parser
 *
 * Both bypass numeral and fall back to toFixed / Intl.
 */
const NUMERAL_LOWER_BOUND = 1e-6
const NUMERAL_UPPER_BOUND = 1e21

const largeNumberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: MAX_PRICE_DECIMALS })

function toFiniteNumber (value) {
  // Number(null) and Number('') are both 0, which is finite — without this check a
  // missing value would render as a confident "0" instead of a dash.
  if (value === null || value === '') return null

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function trimTrailingZeros (text) {
  return text.includes('.') ? text.replace(/0+$/, '').replace(/\.$/, '') : text
}

function isOutsideNumeralRange (value) {
  const magnitude = Math.abs(value)
  return magnitude !== 0 && (magnitude < NUMERAL_LOWER_BOUND || magnitude >= NUMERAL_UPPER_BOUND)
}

function formatOutsideNumeralRange (value) {
  if (Math.abs(value) >= NUMERAL_UPPER_BOUND) return largeNumberFormatter.format(value)
  return trimTrailingZeros(value.toFixed(MAX_PRICE_DECIMALS))
}

/**
 * General purpose number formatting.
 * The second argument is a numeral format string (previously Intl options); no caller
 * passed the old argument, so the change is contained to this module.
 */
export function formatNumber (value, format = '0,0.[00000000]') {
  const numericValue = toFiniteNumber(value)
  if (numericValue === null) return EMPTY_VALUE
  if (isOutsideNumeralRange(numericValue)) return formatOutsideNumeralRange(numericValue)

  return numeral(numericValue).format(format)
}

/**
 * Prices use tiered precision: separators for large values, cents in the normal range,
 * and up to eight decimals for sub-dollar tokens.
 */
export function formatPrice (value) {
  const numericValue = toFiniteNumber(value)
  if (numericValue === null) return EMPTY_VALUE
  if (isOutsideNumeralRange(numericValue)) return formatOutsideNumeralRange(numericValue)

  const magnitude = Math.abs(numericValue)
  if (magnitude >= 1000) return numeral(numericValue).format('0,0.[00]')
  if (magnitude >= 1 || magnitude === 0) return numeral(numericValue).format('0,0.00')

  return numeral(numericValue).format('0.[00000000]')
}

export function formatPercent (value) {
  const numericValue = toFiniteNumber(value)
  if (numericValue === null) return EMPTY_VALUE

  return `${numericValue > 0 ? '+' : ''}${numeral(numericValue).format('0.00')}%`
}

/** Abbreviates large values, e.g. 1820000000 -> "1.82B". numeral emits a lowercase suffix. */
export function formatCompactNumber (value) {
  const numericValue = toFiniteNumber(value)
  if (numericValue === null) return EMPTY_VALUE
  if (isOutsideNumeralRange(numericValue)) return formatOutsideNumeralRange(numericValue)

  return numeral(numericValue).format('0.[00]a').replace(/[a-z]$/, suffix => suffix.toUpperCase())
}

/**
 * Renders a value in the given currency. numeral 2.0.6 only knows the single currency
 * symbol of its active locale, so symbol placement is delegated to Intl.
 */
export function formatCurrency (value, currencyCode = 'USD', { compact = false } = {}) {
  const numericValue = toFiniteNumber(value)
  if (numericValue === null) return EMPTY_VALUE

  const magnitude = Math.abs(numericValue)
  const maximumFractionDigits = magnitude !== 0 && magnitude < 1 ? MAX_PRICE_DECIMALS : 2

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      notation: compact ? 'compact' : 'standard',
      // Zero-decimal currencies such as PKR default to no decimals, which leaves columns
      // ragged when switching currency. Pin the minimum so every currency aligns.
      minimumFractionDigits: compact ? 0 : 2,
      maximumFractionDigits: compact ? 2 : maximumFractionDigits
    }).format(numericValue)
  } catch (error) {
    // Intl throws RangeError on an unrecognised currency code.
    return `${formatPrice(numericValue)} ${currencyCode}`
  }
}

export function formatTime (timestamp) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}
