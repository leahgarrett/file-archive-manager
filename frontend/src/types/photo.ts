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

// Raw metadata structure for storing all extracted metadata
export type Metadata = {
  // EXIF data (camera/device information)
  exif?: {
    [key: string]: any; // Raw EXIF data
  };
  // File system information
  file?: {
    size?: number;
    created?: string;
    modified?: string;
    format?: string;
    mimeType?: string;
  };
  // Technical specifications
  technical?: {
    colorSpace?: string;
    orientation?: number;
    resolution?: {
      x?: number;
      y?: number;
      unit?: string;
    };
    compression?: string;
    bitDepth?: number;
  };
  // GPS and location data
  gps?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    direction?: number;
    timestamp?: string;
  };
  // Camera settings
  camera?: {
    make?: string;
    model?: string;
    software?: string;
    lens?: string;
    focalLength?: number;
    aperture?: number;
    shutterSpeed?: string;
    iso?: number;
    flash?: boolean;
    whiteBalance?: string;
    exposureMode?: string;
    meteringMode?: string;
  };
  // Timestamps from various sources
  timestamps?: {
    dateTimeOriginal?: string;
    dateTime?: string;
    createDate?: string;
    modifyDate?: string;
    digitized?: string;
  };
  // Processing information
  processing?: {
    extractedAt?: string; // When we extracted this metadata
    extractorVersion?: string; // Version of extraction tool
    source?: string; // Where metadata came from (EXIF, filename, etc.)
  };
};

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
  metadata?: Metadata; // Raw metadata storage
};

export type PhotoListResponse = {
  photos: Photo[];
  total: number;
  limit: number;
  offset: number;
};

export type StatsResponse = {
  total: number;
  byYear: { [year: string]: number };
  byPrecision: { [precision: string]: number };
  byCountry: { [country: string]: number };
};

export type TagResponse = {
  tag: string;
  count: number;
};

export type PersonResponse = {
  person: string;
  count: number;
};

export type LocationResponse = {
  location: string;
  count: number;
};
