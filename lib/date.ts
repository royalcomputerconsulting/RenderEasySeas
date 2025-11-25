export function createDateFromString(dateString: string): Date {
  if (!dateString) {
    console.warn('[date] Empty date string provided');
    return new Date();
  }

  // Handle ISO date format (YYYY-MM-DD) by parsing components to avoid timezone issues
  // When parsing "2025-12-01", new Date() interprets it as UTC midnight,
  // which becomes the previous day in western timezones
  const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    // Create date using local timezone by using year, month (0-indexed), day
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Handle US date format (M/D/YY or MM/DD/YYYY)
  const usMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (usMatch) {
    const [, month, day, yearStr] = usMatch;
    const year = yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);
    return new Date(year, parseInt(month) - 1, parseInt(day));
  }

  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    console.warn('[date] Invalid date string:', dateString);
    return new Date();
  }
  
  return date;
}

export function formatDate(date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const d = typeof date === 'string' ? createDateFromString(date) : date;
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    case 'medium':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    case 'long':
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    default:
      return d.toLocaleDateString();
  }
}

export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = typeof startDate === 'string' ? createDateFromString(startDate) : startDate;
  const end = typeof endDate === 'string' ? createDateFromString(endDate) : endDate;
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  
  if (startMonth === endMonth && start.getFullYear() === end.getFullYear()) {
    return `${startMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  }
  
  if (start.getFullYear() === end.getFullYear()) {
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
  }
  
  return `${formatDate(start, 'medium')} - ${formatDate(end, 'medium')}`;
}

export function getDaysBetween(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? createDateFromString(startDate) : startDate;
  const end = typeof endDate === 'string' ? createDateFromString(endDate) : endDate;
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function getDaysUntil(date: Date | string): number {
  const targetDate = typeof date === 'string' ? createDateFromString(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function isDateInPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? createDateFromString(date) : date;
  return d < new Date();
}

export function isDateInFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? createDateFromString(date) : date;
  return d > new Date();
}

export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? createDateFromString(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getRelativeTimeString(date: Date | string): string {
  const d = typeof date === 'string' ? createDateFromString(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  if (diffDays > 7 && diffDays <= 30) return `In ${Math.round(diffDays / 7)} weeks`;
  if (diffDays < -7 && diffDays >= -30) return `${Math.round(Math.abs(diffDays) / 7)} weeks ago`;
  
  return formatDate(d, 'medium');
}
