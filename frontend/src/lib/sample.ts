export type Location = {
  title: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};

export type Photo = {
  id: string;
  filename: string;
  tags: string[];
  width: number;
  height: number;
  people: string[];
  location: Location;
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
