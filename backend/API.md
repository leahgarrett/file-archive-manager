# Photo Archive Manager API

A RESTful API for managing photo archives with support for metadata, searching, filtering, and statistics.

## Endpoints

### Photos

#### List Photos

`GET /api/photos`

Lists all photos with optional filtering and pagination.

**Query Parameters:**

- `tags` - Comma-separated list of tags to filter by
- `people` - Comma-separated list of people to filter by
- `location` - Search text for location (matches city, state, country, or title)
- `yearFrom` - Filter photos from this year onwards
- `yearTo` - Filter photos up to this year
- `precision` - Filter by date precision (`exact`, `day`, `month`, `year`, `decade`, `unknown`)
- `limit` - Maximum number of results (default: 100)
- `offset` - Number of results to skip (default: 0)

**Example:**

```bash
curl "http://localhost:3001/api/photos?tags=vacation&limit=10"
```

**Response:**

```json
{
  "photos": [
    /* array of photo objects */
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

#### Get Single Photo

`GET /api/photos/:id`

Returns a single photo by ID.

**Example:**

```bash
curl "http://localhost:3001/api/photos/1"
```

#### Create Photo

`POST /api/photos`

Creates a new photo record.

**Body:** Photo object (JSON)
**Example:**

```bash
curl -X POST "http://localhost:3001/api/photos" \
  -H "Content-Type: application/json" \
  -d '{"id":"new-photo","filename":"test.jpg",...}'
```

#### Update Photo

`PUT /api/photos/:id`

Updates an existing photo's metadata.

#### Delete Photo

`DELETE /api/photos/:id`

Deletes a photo record.

### Search & Discovery

#### Search Photos

`GET /api/photos/search?q=<query>`

Full-text search across photo metadata (tags, people, location, filename).

**Example:**

```bash
curl "http://localhost:3001/api/photos/search?q=beach"
```

#### Get Statistics

`GET /api/photos/stats`

Returns aggregate statistics about the photo collection.

**Response:**

```json
{
  "total": 8,
  "byYear": { "2023": 5, "2024": 1, "1985": 1, "1965": 1 },
  "byPrecision": { "exact": 5, "day": 1, "decade": 1, "year": 1 },
  "byCountry": { "USA": 8 }
}
```

#### Get All Tags

`GET /api/tags`

Returns all unique tags with usage counts, sorted by frequency.

**Response:**

```json
[
  { "tag": "holiday", "count": 3 },
  { "tag": "friends", "count": 2 },
  { "tag": "vacation", "count": 1 }
]
```

#### Get All People

`GET /api/people`

Returns all unique people mentioned in photos with counts.

#### Get All Locations

`GET /api/locations`

Returns all unique locations with counts.

### Legacy Endpoints

#### Get All Data (Legacy)

`GET /api/photos/data`

Returns all photos as a simple array (backwards compatibility).

#### Replace All Data (Legacy)

`POST /api/photos/data`

Replaces entire photo collection (backwards compatibility).

## Data Types

### Photo

```typescript
type Photo = {
  id: string;
  filename: string;
  tags: string[];
  width: number;
  height: number;
  people: string[];
  location: Location;
  dateTaken: string; // ISO 8601 format
  dateTakenPrecision: DatePrecision;
  dateAdded: string; // ISO 8601 format
  dateModified: string; // ISO 8601 format
};
```

### Location

```typescript
type Location = {
  title: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};
```

### DatePrecision

```typescript
type DatePrecision =
  | 'exact' // From EXIF data or known exact time
  | 'day' // Know the exact day but not time
  | 'month' // Know month and year but not day
  | 'year' // Only know the year
  | 'decade' // Best guess within a decade (e.g., "1980s")
  | 'unknown'; // Complete guess/placeholder
```

## Examples

### Filter photos from California taken in 2023

```bash
curl "http://localhost:3001/api/photos?location=california&yearFrom=2023&yearTo=2023"
```

### Search for photos with "beach" or people named "Sarah"

```bash
curl "http://localhost:3001/api/photos/search?q=beach"
curl "http://localhost:3001/api/photos?people=Sarah"
```

### Get photos with uncertain dates

```bash
curl "http://localhost:3001/api/photos?precision=decade,year,unknown"
```

### Get collection statistics

```bash
curl "http://localhost:3001/api/photos/stats" | jq .
```

## Running the Server

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:3001`
