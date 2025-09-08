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
