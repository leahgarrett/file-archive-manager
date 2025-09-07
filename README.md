# Photo Archive Manager (PAM)

**PAM** is a tool for organising and enriching your photo collection.  
It helps you keep your photos safe, searchable, and easy to browse — while your original files remain untouched.

---

## Features

**Date Management:**

- Photos store three ISO 8601 timestamp fields: `dateTaken`, `dateAdded`, `dateModified`
- Easy searching by date range or year with string comparison
- User-friendly date formatting with timezone awareness
- Chronological sorting capabilities

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

- `findByDateRange()`, `findByYear()` - Search by date
- `formatDateForDisplay()` - Locale-aware formatting
- `sortByDateTaken()` - Chronological sorting
