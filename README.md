# Photo Archive Manager (PAM)

**PAM** is a tool for organising and enriching your photo collection.  
It helps you keep your photos safe, searchable, and easy to browse — while your original files remain untouched.

---

## Features

**Date Management:**

- Photos store three ISO 8601 timestamp fields: `dateTaken`, `dateAdded`, `dateModified`
- **Date precision tracking**: `dateTakenPrecision` field indicates confidence level
  - `'exact'`: From EXIF data or known exact time
  - `'day'`: Know the exact day but not the time
  - `'month'`: Know month and year but not day
  - `'year'`: Only know the year
  - `'decade'`: Best guess within a decade (e.g., "1980s")
  - `'unknown'`: Complete guess/placeholder
- Easy searching by date range or year with string comparison
- User-friendly date formatting with precision indicators (e.g., "1985 (est.)", "1980s (est.)")
- Chronological sorting capabilities
- Helper functions for creating estimated dates

_(more features to be added as the project develops)_

---

## Roadmap

- [x] JSON-based metadata storage ✅
- [x] REST API with CRUD operations ✅
- [x] Advanced search & filtering ✅
- [x] Collection statistics & analytics ✅
- [x] Date precision handling for old photos ✅
- [ ] Metadata extraction (technical + descriptive)
- [ ] React-based gallery view with detail editing panel
- [ ] Bulk tagging and editing
- [ ] File upload & thumbnail generation
- [ ] Optional video previews
- [ ] AI-powered auto-tagging (objects, people, locations)
- [ ] Map view using geotags
- [ ] Export/share collections as JSON snippets or PDFs
- [ ] Mobile-friendly UI
- [ ] Cloud sync (optional)

---

## Tech Stack

- **Frontend:** React (with Tailwind).
- **Backend:** Node.js with Express API.
- **Utilities:** Go scripts for metadata extraction (wrappers around tools like `exiftool` or `ffprobe`).
- **Storage:** JSON file as the primary database, with optional PostgreSQL for scaling.

---

## API Implementation Status ✅

The backend REST API is now fully implemented with comprehensive CRUD operations, search capabilities, and statistics. All endpoints are tested with a complete test suite (17 passing tests).

### **Core API Endpoints**

#### Photos CRUD

- `GET /api/photos` - List with filtering & pagination
- `GET /api/photos/:id` - Single photo by ID
- `POST /api/photos` - Create new photos
- `PUT /api/photos/:id` - Update photo metadata
- `DELETE /api/photos/:id` - Delete photos

#### Search & Discovery

- `GET /api/photos/search?q=<query>` - Full-text search
- `GET /api/photos/stats` - Collection statistics
- `GET /api/tags` - All tags with usage counts
- `GET /api/people` - All people with counts
- `GET /api/locations` - All locations with counts

#### Advanced Filtering

- Filter by `tags`, `people`, `location`, `yearFrom`, `yearTo`, `precision`
- Smart location search (matches city, state, country, title)
- Pagination support (`limit`/`offset`)

### **API Test Commands**

Start the development server:

```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:3001
```

**Basic Operations:**

```bash
# Get all photos with pagination info
curl "http://localhost:3001/api/photos"

# Get single photo by ID
curl "http://localhost:3001/api/photos/1"

# Create new photo
curl -X POST "http://localhost:3001/api/photos" \
  -H "Content-Type: application/json" \
  -d '{"id":"test-photo","filename":"test.jpg","tags":["test"],...}'

# Update photo metadata
curl -X PUT "http://localhost:3001/api/photos/1" \
  -H "Content-Type: application/json" \
  -d '{"tags":["updated","vacation"]}'

# Delete photo
curl -X DELETE "http://localhost:3001/api/photos/test-photo"
```

**Search & Filtering:**

```bash
# Search for photos with "beach"
curl "http://localhost:3001/api/photos/search?q=beach"

# Filter by tags
curl "http://localhost:3001/api/photos?tags=vacation"

# Filter by location (matches city, state, country, title)
curl "http://localhost:3001/api/photos?location=california"

# Filter by year range
curl "http://localhost:3001/api/photos?yearFrom=2023&yearTo=2023"

# Filter by date precision (uncertain dates)
curl "http://localhost:3001/api/photos?precision=decade"

# Multiple filters
curl "http://localhost:3001/api/photos?location=california&tags=vacation&yearFrom=2020"
```

**Statistics & Aggregations:**

```bash
# Collection statistics
curl "http://localhost:3001/api/photos/stats" | python3 -m json.tool

# All tags with usage counts
curl "http://localhost:3001/api/tags" | python3 -m json.tool

# All people mentioned in photos
curl "http://localhost:3001/api/people"

# All locations with counts
curl "http://localhost:3001/api/locations"
```

**Example API Response (stats):**

```json
{
  "total": 8,
  "byYear": { "2023": 5, "2024": 1, "1985": 1, "1965": 1 },
  "byPrecision": { "exact": 5, "day": 1, "decade": 1, "year": 1 },
  "byCountry": { "USA": 8 }
}
```

### **Key Technical Features**

- ✅ **TypeScript-First** - Shared types between frontend/backend
- ✅ **Robust Date Handling** - Supports uncertain dates with precision levels
- ✅ **Comprehensive Testing** - 17 test cases covering all endpoints
- ✅ **RESTful Design** - Following REST conventions with proper HTTP status codes
- ✅ **Legacy Compatibility** - Kept existing `/api/photos/data` endpoints
- ✅ **Production Ready** - Error handling, validation, and proper JSON responses

**Run Tests:**

```bash
cd backend
npm test
```

For complete API documentation, see `backend/API.md`.

---

## Log of co-pilot instructions

### Date Format Decision (2025-09-07)

**Question:** "What dates would you receommend we store and what forat? We want easy searching and good user readability"

**Decision:** Store dates as ISO 8601 strings (`YYYY-MM-DDTHH:mm:ss.sssZ`)
**Rationale:**

- ✅ Easy searching: String comparison works for date ranges
- ✅ User readable: Human-interpretable format
- ✅ TypeScript/JSON native compatibility
- ✅ Timezone aware (UTC timestamps)
- ✅ Sortable: Lexicographic = chronological order

**Date Fields Added:**

- `dateTaken`: When photo was captured (primary for user UX)
- `dateAdded`: When added to archive (import tracking)
- `dateModified`: When metadata last updated (sync/backup)

**Utility Functions Created:**

**Utility Functions Created:**

- `findByDateRange()`, `findByYear()` - Search by date
- `formatDateForDisplay()` - Locale-aware formatting with precision indicators
- `sortByDateTaken()` - Chronological sorting
- `createEstimatedDate()`, `createDecadeEstimate()` - Generate estimated dates
- `filterByPrecision()` - Filter photos by date confidence level

### Date Precision Enhancement (2025-09-07)

**Question:** "If we are adding old photos we may not have the data (or even year) the photo was taken. How can we indicate that the datetaken is an estimate?"

**Solution:** Added `DatePrecision` type and `dateTakenPrecision` field
**Approach:**

- Added 6 precision levels: `exact`, `day`, `month`, `year`, `decade`, `unknown`
- Enhanced display formatting to show estimation indicators
- Maintained ISO 8601 date format for consistency and searchability
- Created helper functions for generating reasonable estimated dates (mid-year, mid-decade defaults)

**Benefits:**

- ✅ Clear indication of date reliability in UI
- ✅ Maintains searchable date format
- ✅ Graceful handling of incomplete information
- ✅ Future-proof for AI-assisted date estimation

### API Implementation Complete (2025-09-08)

**Request:** "Can you add this summary to the README and include the `curl` commands you used to test the API"

**Completed:** Full REST API implementation with comprehensive documentation
**Achievements:**

- ✅ Built complete CRUD API with 11+ endpoints
- ✅ Advanced filtering (tags, people, location, date range, precision)
- ✅ Full-text search across all metadata fields
- ✅ Statistics and aggregation endpoints
- ✅ 17 comprehensive test cases (all passing)
- ✅ Production-ready error handling and validation
- ✅ TypeScript types shared between frontend/backend
- ✅ RESTful design with proper HTTP status codes

**Key Endpoints Implemented:**

- Photos CRUD: GET, POST, PUT, DELETE `/api/photos`
- Search: `/api/photos/search?q=<query>`
- Analytics: `/api/photos/stats`, `/api/tags`, `/api/people`, `/api/locations`
- Legacy compatibility: `/api/photos/data`

**Testing Commands Added:** Complete curl examples for all endpoints including filtering, search, statistics, and CRUD operations.

### Frontend Implementation Complete (2025-09-08)

**Request:** "Lets create the front for this app. Lets display data only for now. Lets display and filter the images in the sample.json"

**Completed:** Full React frontend with photo display and filtering capabilities
**Achievements:**

- ✅ Modern React + TypeScript frontend with Vite
- ✅ Responsive photo grid with Tailwind CSS styling
- ✅ Real-time search across all photo metadata
- ✅ Advanced filtering by tags, location, year range, date precision
- ✅ Photo cards showing thumbnails, dates, tags, people, locations
- ✅ Loading states and error handling
- ✅ Proxy configuration for seamless API integration
- ✅ Date precision indicators on photo cards
- ✅ Placeholder image service for demonstration
- ✅ Mobile-responsive design

**Key Components Built:**

- `App.tsx`: Main application with state management and API integration
- `PhotoGrid.tsx`: Responsive grid displaying photo cards with metadata
- `FilterPanel.tsx`: Comprehensive filtering interface with tag checkboxes, location search, year range, precision selector
- `SearchBar.tsx`: Full-text search with clear functionality
- `utils/api.ts`: Complete API client with error handling and date formatting utilities
- `types/photo.ts`: Shared TypeScript types matching backend schema

**Access Points:**

- Frontend: http://localhost:3000 (Vite dev server)
- Backend API: http://localhost:3001 (Express server)
- Real photo data from `backend/src/data/sample.json` with 8 sample photos
- Filtering works in real-time with multiple simultaneous filters
- Search queries all metadata fields (tags, people, location, filename)
