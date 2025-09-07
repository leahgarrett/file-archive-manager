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

- [ ] JSON-based metadata storage
- [ ] Metadata extraction (technical + descriptive)
- [ ] Search & indexing (fuzzy search, filters)
- [ ] React-based gallery view with detail editing panel
- [ ] Bulk tagging and editing
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
