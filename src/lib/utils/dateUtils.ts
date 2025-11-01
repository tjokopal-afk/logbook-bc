// =========================================
// DATE UTILITY FUNCTIONS
// =========================================

/**
 * Format ISO date string to Indonesian date format
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string (e.g., "12 Jan 2025")
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  } catch (error) {
    return dateString;
  }
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 * @returns Today's date string
 */
export function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get the next day from a given date in ISO format
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Next day's date string in YYYY-MM-DD format
 */
export function getNextDay(dateString: string): string {
  try {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  } catch (error) {
    return getTodayDate();
  }
}

/**
 * Generate default week name based on date range
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Week name string (e.g., "Minggu 1 - Januari 2025")
 */
export function generateDefaultWeekName(startDate: string, endDate: string): string {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = months[start.getMonth()];
    const endMonth = months[end.getMonth()];
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    // Calculate week number in the month
    const weekNum = Math.ceil(startDay / 7);

    if (startMonth === endMonth && startYear === endYear) {
      return `Minggu ${weekNum} - ${startMonth} ${startYear}`;
    } else if (startYear === endYear) {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
    } else {
      return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
    }
  } catch (error) {
    return 'Logbook Mingguan';
  }
}

/**
 * Calculate duration between two time strings
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Duration string (e.g., "2h 30m") or null if invalid
 */
export function calculateDuration(startTime: string, endTime: string): string | null {
  try {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    if (
      isNaN(startHour) || isNaN(startMin) ||
      isNaN(endHour) || isNaN(endMin)
    ) {
      return null;
    }

    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    // Handle negative duration (invalid time range)
    if (totalMinutes <= 0) {
      return null;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Calculate total duration from an array of duration strings
 * @param durations - Array of duration strings (e.g., ["2h 30m", "1h 15m"])
 * @returns Total duration string (e.g., "3h 45m")
 */
export function calculateTotalDuration(durations: string[]): string {
  try {
    let totalMinutes = 0;

    for (const duration of durations) {
      if (!duration) continue;

      // Parse duration string (e.g., "2h 30m", "1h", "45m")
      const hourMatch = duration.match(/(\d+)h/);
      const minMatch = duration.match(/(\d+)m/);

      const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
      const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;

      totalMinutes += hours * 60 + minutes;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0 && minutes === 0) {
      return '0m';
    } else if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  } catch (error) {
    return '0m';
  }
}
