/**
 * Lightweight date utilities used across the app.
 * No external dependencies, small and well-typed helpers.
 */

export type DateInput = Date | string | number | null | undefined

/** Parse a DateInput into a Date or return null if invalid. */
export function parseDate(input?: DateInput): Date | null {
	if (input == null) return null
	if (input instanceof Date) {
		return Number.isNaN(input.getTime()) ? null : new Date(input)
	}
	if (typeof input === "number") {
		const d = new Date(input)
		return Number.isNaN(d.getTime()) ? null : d
	}
	if (typeof input === "string") {
		// Try numeric string
		if (/^\d+$/.test(input)) {
			const n = Number(input)
			const d = new Date(n)
			return Number.isNaN(d.getTime()) ? null : d
		}
		// Let Date parse ISO-like strings and fall back to Date constructor
		const d = new Date(input)
		return Number.isNaN(d.getTime()) ? null : d
	}
	return null
}

/** Return a new Date that represents the start of the day (00:00:00.000) in local time. */
export function startOfDay(input: DateInput): Date | null {
	const d = parseDate(input)
	if (!d) return null
	return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Return a new Date that represents the end of the day (23:59:59.999) in local time. */
export function endOfDay(input: DateInput): Date | null {
	const s = startOfDay(input)
	if (!s) return null
	const e = new Date(s)
	e.setDate(e.getDate() + 1)
	e.setMilliseconds(e.getMilliseconds() - 1)
	return e
}

/** Return the current calendar year as a number (e.g. 2025). */
export function getCurrentYear(): number {
	return new Date().getFullYear()
}

/** Return true if the provided date falls in the current year. If no value provided, returns true. */
export function isThisYear(input?: DateInput): boolean {
	if (!input) return true
	const d = parseDate(input)
	if (!d) return false
	return d.getFullYear() === getCurrentYear()
}

/** Add days (can be negative) and return a new Date. */
export function addDays(input: DateInput, days: number): Date | null {
	const d = parseDate(input) ?? new Date()
	const n = new Date(d)
	n.setDate(n.getDate() + days)
	return n
}

/** Add months (can be negative) and return a new Date (keeps day-of-month where possible). */
export function addMonths(input: DateInput, months: number): Date | null {
	const d = parseDate(input) ?? new Date()
	const n = new Date(d)
	const desiredMonth = n.getMonth() + months
	n.setMonth(desiredMonth)
	return n
}

/** Add years (can be negative) and return a new Date. */
export function addYears(input: DateInput, years: number): Date | null {
	const d = parseDate(input) ?? new Date()
	const n = new Date(d)
	n.setFullYear(n.getFullYear() + years)
	return n
}

/** Are two inputs on the same calendar day (local time)? */
export function isSameDay(a?: DateInput, b?: DateInput): boolean {
	const da = parseDate(a)
	const db = parseDate(b)
	if (!da || !db) return false
	return (
		da.getFullYear() === db.getFullYear() &&
		da.getMonth() === db.getMonth() &&
		da.getDate() === db.getDate()
	)
}

/** Return true if `a` is strictly before `b`. Null/invalid values are treated as incomparable (return false). */
export function isBefore(a?: DateInput, b?: DateInput): boolean {
	const da = parseDate(a)
	const db = parseDate(b)
	if (!da || !db) return false
	return da.getTime() < db.getTime()
}

/** Return true if `a` is strictly after `b`. */
export function isAfter(a?: DateInput, b?: DateInput): boolean {
	const da = parseDate(a)
	const db = parseDate(b)
	if (!da || !db) return false
	return da.getTime() > db.getTime()
}

/** Is the given date in the past (strictly before now)? */
export function isPast(input?: DateInput): boolean {
	const d = parseDate(input)
	if (!d) return false
	return d.getTime() < Date.now()
}

/** Is the given date in the future (strictly after now)? */
export function isFuture(input?: DateInput): boolean {
	const d = parseDate(input)
	if (!d) return false
	return d.getTime() > Date.now()
}

/** Difference in whole days (a - b). Returns null if either is invalid. */
export function differenceInDays(a?: DateInput, b?: DateInput): number | null {
	const da = parseDate(a)
	const db = parseDate(b)
	if (!da || !db) return null
	const msPerDay = 24 * 60 * 60 * 1000
	// floor to avoid fractional-day issues
	return Math.floor((da.getTime() - db.getTime()) / msPerDay)
}

/** Return a YYYY-MM-DD string in local time. */
export function toIsoDateString(input?: DateInput): string | null {
	const d = parseDate(input)
	if (!d) return null
	const y = d.getFullYear()
	const m = String(d.getMonth() + 1).padStart(2, "0")
	const day = String(d.getDate()).padStart(2, "0")
	return `${y}-${m}-${day}`
}

/**
 * Return the ISO week number for the given date. Algorithm based on ISO-8601.
 * Returns 1..53 or null if invalid input.
 */
export function getWeekOfYear(input?: DateInput): number | null {
	const d = parseDate(input) ?? new Date()
	if (!d) return null
	// Copy date and set to nearest Thursday (current week) to calculate week number
	const target = new Date(d.valueOf())
	const dayNr = (d.getDay() + 6) % 7 // Monday=0, Sunday=6
	target.setDate(target.getDate() - dayNr + 3)
	const firstThursday = new Date(target.getFullYear(), 0, 4)
	const firstDayNr = (firstThursday.getDay() + 6) % 7
	firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3)
	const weekNumber = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000))
	return weekNumber
}

/** Simple human-friendly formatting via Intl.DateTimeFormat. */
export function formatDate(
	input?: DateInput,
	options?: Intl.DateTimeFormatOptions & { locale?: string }
): string | null {
	const d = parseDate(input)
	if (!d) return null
	const locale = options?.locale ?? undefined
	// Create a shallow copy without `locale` so it's valid for Intl.DateTimeFormat
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { locale: _loc, ...fmtOptions } = options ?? {}
	return new Intl.DateTimeFormat(locale, fmtOptions as Intl.DateTimeFormatOptions).format(d)
}

export default {
	parseDate,
	startOfDay,
	endOfDay,
	getCurrentYear,
	isThisYear,
	addDays,
	addMonths,
	addYears,
	isSameDay,
	isBefore,
	isAfter,
	isPast,
	isFuture,
	differenceInDays,
	toIsoDateString,
	getWeekOfYear,
	formatDate,
}

