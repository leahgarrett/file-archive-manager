export type Location = {
  title: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};

export type DatePrecision =
  | 'exact' // From EXIF data or known exact time
  | 'day' // Know the exact day but not time
  | 'month' // Know month and year but not day
  | 'year' // Only know the year
  | 'decade' // Best guess within a decade (e.g., "1980s")
  | 'unknown'; // Complete guess/placeholder

export type Photo = {
  id: string;
  filename: string;
  tags: string[];
  width: number;
  height: number;
  people: string[];
  location: Location;
  dateTaken: string; // ISO 8601 format: "2023-12-25T10:30:00.000Z"
  dateTakenPrecision: DatePrecision; // How accurate is dateTaken?
  dateAdded: string; // ISO 8601 format: when added to archive
  dateModified: string; // ISO 8601 format: when metadata last updated
};

let photos: Photo[] = [];

// In Node (tests) load the JSON from the backend package data path.
// In the browser, fetch from the server endpoint (backend should serve it) or
// the bundler can be configured to copy backend data to the public folder.
if (typeof window === 'undefined') {
  // running in Node (vitest)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sample = require('../../../backend/src/data/sample.json');
  photos = sample as unknown as Photo[];
} else {
  // runtime browser: lazy load via fetch
  // callers should await loadPhotos() before using findByTag
  photos = [];
}

export async function loadPhotos(): Promise<void> {
  if (photos.length > 0) return;
  const res = await fetch('/api/photos/data');
  if (!res.ok) throw new Error('failed to fetch photos');
  photos = await res.json();
}

export function findByTag(tag: string): Photo[] {
  return photos.filter((p) => p.tags.includes(tag));
}

export function findByDateRange(startDate: string, endDate: string): Photo[] {
  return photos.filter((photo) => photo.dateTaken >= startDate && photo.dateTaken <= endDate);
}

export function findByYear(year: number): Photo[] {
  const startDate = `${year}-01-01T00:00:00.000Z`;
  const endDate = `${year}-12-31T23:59:59.999Z`;
  return findByDateRange(startDate, endDate);
}

export function formatDateForDisplay(
  isoDateString: string,
  precision: DatePrecision = 'exact',
): string {
  const date = new Date(isoDateString);

  switch (precision) {
    case 'exact':
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'day':
      return (
        date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }) + ' (day known)'
      );
    case 'month':
      return (
        date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
        }) + ' (est.)'
      );
    case 'year':
      return date.getFullYear().toString() + ' (est.)';
    case 'decade':
      const decade = Math.floor(date.getFullYear() / 10) * 10;
      return `${decade}s (est.)`;
    case 'unknown':
      return 'Date unknown';
    default:
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
  }
}

export function createEstimatedDate(year: number, month = 6, day = 15): string {
  // Use mid-year, mid-month defaults for estimated dates
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString();
}

export function createDecadeEstimate(decade: number): string {
  // Use middle of decade (e.g., 1985 for "1980s")
  return createEstimatedDate(decade + 5);
}

export function filterByPrecision(precision: DatePrecision | DatePrecision[]): Photo[] {
  const precisions = Array.isArray(precision) ? precision : [precision];
  return photos.filter((photo) => precisions.includes(photo.dateTakenPrecision));
}

export function sortByDateTaken(photos: Photo[], descending = true): Photo[] {
  return [...photos].sort((a, b) => {
    return descending
      ? b.dateTaken.localeCompare(a.dateTaken)
      : a.dateTaken.localeCompare(b.dateTaken);
  });
}
