import { useState, useEffect } from 'react';
import { Photo, TagResponse, DatePrecision } from './types/photo';
import { api, formatDateForDisplay, getThumbnailUrl } from './utils/api';
import PhotoGrid from './components/PhotoGrid';
import FilterPanel from './components/FilterPanel';
import SearchBar from './components/SearchBar';

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    tags: [] as string[],
    people: [] as string[],
    location: '',
    yearFrom: '',
    yearTo: '',
    precision: null as DatePrecision | null,
    searchQuery: '',
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [photos, filters]);

  async function loadData() {
    try {
      setLoading(true);
      const [photosResult, tagsResult] = await Promise.all([api.getPhotos(), api.getTags()]);

      setPhotos(photosResult.photos);
      setTags(tagsResult);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function applyFilters() {
    let filtered = photos;

    // Search query filter
    if (filters.searchQuery.trim()) {
      try {
        const searchResults = await api.searchPhotos(filters.searchQuery);
        const searchIds = new Set(searchResults.map((p) => p.id));
        filtered = filtered.filter((photo) => searchIds.has(photo.id));
      } catch (err) {
        console.error('Search failed:', err);
      }
    }

    // Tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter((photo) => filters.tags.some((tag) => photo.tags.includes(tag)));
    }

    // People filter
    if (filters.people.length > 0) {
      filtered = filtered.filter((photo) =>
        filters.people.some((person) => photo.people.includes(person)),
      );
    }

    // Location filter
    if (filters.location.trim()) {
      const locationQuery = filters.location.toLowerCase();
      filtered = filtered.filter(
        (photo) =>
          photo.location.title.toLowerCase().includes(locationQuery) ||
          photo.location.city?.toLowerCase().includes(locationQuery) ||
          photo.location.state?.toLowerCase().includes(locationQuery) ||
          photo.location.country?.toLowerCase().includes(locationQuery),
      );
    }

    // Year range filters
    if (filters.yearFrom) {
      const yearFrom = parseInt(filters.yearFrom);
      filtered = filtered.filter((photo) => new Date(photo.dateTaken).getFullYear() >= yearFrom);
    }

    if (filters.yearTo) {
      const yearTo = parseInt(filters.yearTo);
      filtered = filtered.filter((photo) => new Date(photo.dateTaken).getFullYear() <= yearTo);
    }

    // Precision filter
    if (filters.precision) {
      filtered = filtered.filter((photo) => photo.dateTakenPrecision === filters.precision);
    }

    // Sort by date taken (newest first)
    filtered.sort((a, b) => new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime());

    setFilteredPhotos(filtered);
  }

  function updateFilter(key: keyof typeof filters, value: any) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters({
      tags: [],
      people: [],
      location: '',
      yearFrom: '',
      yearTo: '',
      precision: null,
      searchQuery: '',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading photos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Photo Archive Manager</h1>
          <p className="text-gray-600 mt-2">
            {filteredPhotos.length} of {photos.length} photos
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar with filters */}
          <aside className="lg:w-80 space-y-6">
            <SearchBar
              query={filters.searchQuery}
              onQueryChange={(query) => updateFilter('searchQuery', query)}
            />

            <FilterPanel
              filters={filters}
              tags={tags}
              onFilterChange={updateFilter}
              onClearFilters={clearFilters}
            />
          </aside>

          {/* Main content */}
          <main className="flex-1">
            {filteredPhotos.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-500 text-lg mb-2">No photos found</p>
                <p className="text-gray-400">Try adjusting your filters or search terms</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-700"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <PhotoGrid photos={filteredPhotos} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
