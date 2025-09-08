import {
  Photo,
  PhotoListResponse,
  StatsResponse,
  TagResponse,
  PersonResponse,
  LocationResponse,
  DatePrecision,
} from '../types/photo';

const API_BASE = '/api';

// API functions
export const api = {
  // Get photos with optional filtering
  async getPhotos(params?: {
    tags?: string;
    people?: string;
    location?: string;
    yearFrom?: number;
    yearTo?: number;
    precision?: DatePrecision;
    limit?: number;
    offset?: number;
  }): Promise<PhotoListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.tags) searchParams.set('tags', params.tags);
    if (params?.people) searchParams.set('people', params.people);
    if (params?.location) searchParams.set('location', params.location);
    if (params?.yearFrom) searchParams.set('yearFrom', params.yearFrom.toString());
    if (params?.yearTo) searchParams.set('yearTo', params.yearTo.toString());
    if (params?.precision) searchParams.set('precision', params.precision);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const response = await fetch(`${API_BASE}/photos?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch photos');
    return response.json();
  },

  // Get single photo by ID
  async getPhoto(id: string): Promise<Photo> {
    const response = await fetch(`${API_BASE}/photos/${id}`);
    if (!response.ok) throw new Error('Failed to fetch photo');
    return response.json();
  },

  // Search photos
  async searchPhotos(query: string): Promise<Photo[]> {
    const response = await fetch(`${API_BASE}/photos/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search photos');
    return response.json();
  },

  // Get statistics
  async getStats(): Promise<StatsResponse> {
    const response = await fetch(`${API_BASE}/photos/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  // Get all tags
  async getTags(): Promise<TagResponse[]> {
    const response = await fetch(`${API_BASE}/tags`);
    if (!response.ok) throw new Error('Failed to fetch tags');
    return response.json();
  },

  // Get all people
  async getPeople(): Promise<PersonResponse[]> {
    const response = await fetch(`${API_BASE}/people`);
    if (!response.ok) throw new Error('Failed to fetch people');
    return response.json();
  },

  // Get all locations
  async getLocations(): Promise<LocationResponse[]> {
    const response = await fetch(`${API_BASE}/locations`);
    if (!response.ok) throw new Error('Failed to fetch locations');
    return response.json();
  },
};

// Date formatting utilities
export function formatDateForDisplay(dateString: string, precision: DatePrecision): string {
  const date = new Date(dateString);

  switch (precision) {
    case 'exact':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

    case 'day':
      return (
        date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) + ' (est.)'
      );

    case 'month':
      return (
        date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
        }) + ' (est.)'
      );

    case 'year':
      return date.getFullYear().toString() + ' (est.)';

    case 'decade':
      const year = date.getFullYear();
      const decade = Math.floor(year / 10) * 10;
      return `${decade}s (est.)`;

    case 'unknown':
      return 'Date unknown';

    default:
      return date.toLocaleDateString();
  }
}

export function formatDateShort(dateString: string, precision: DatePrecision): string {
  const date = new Date(dateString);

  switch (precision) {
    case 'exact':
    case 'day':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

    case 'month':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });

    case 'year':
      return date.getFullYear().toString();

    case 'decade':
      const year = date.getFullYear();
      const decade = Math.floor(year / 10) * 10;
      return `${decade}s`;

    case 'unknown':
      return '?';

    default:
      return date.toLocaleDateString();
  }
}

// Get image URL (placeholder for now since we don't have actual image serving)
export function getImageUrl(photo: Photo): string {
  // In a real app, this would return the URL to the actual image
  // For now, we'll use placeholder images
  return `https://picsum.photos/${photo.width}/${photo.height}?random=${photo.id}`;
}

// Get thumbnail URL
export function getThumbnailUrl(photo: Photo): string {
  // Generate a smaller thumbnail
  const thumbWidth = Math.min(400, photo.width);
  const thumbHeight = Math.round((thumbWidth / photo.width) * photo.height);
  return `https://picsum.photos/${thumbWidth}/${thumbHeight}?random=${photo.id}`;
}
