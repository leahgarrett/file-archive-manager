import { TagResponse, DatePrecision } from '../types/photo';

interface FilterPanelProps {
  filters: {
    tags: string[];
    people: string[];
    location: string;
    yearFrom: string;
    yearTo: string;
    precision: DatePrecision | null;
  };
  tags: TagResponse[];
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
}

export default function FilterPanel({
  filters,
  tags,
  onFilterChange,
  onClearFilters,
}: FilterPanelProps) {
  const precisionOptions: { value: DatePrecision; label: string }[] = [
    { value: 'exact', label: 'Exact time' },
    { value: 'day', label: 'Day only' },
    { value: 'month', label: 'Month only' },
    { value: 'year', label: 'Year only' },
    { value: 'decade', label: 'Decade estimate' },
    { value: 'unknown', label: 'Unknown date' },
  ];

  const hasActiveFilters =
    filters.tags.length > 0 ||
    filters.people.length > 0 ||
    filters.location.length > 0 ||
    filters.yearFrom.length > 0 ||
    filters.yearTo.length > 0 ||
    filters.precision !== null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button onClick={onClearFilters} className="text-sm text-blue-600 hover:text-blue-700">
            Clear all
          </button>
        )}
      </div>

      {/* Tags Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {tags.slice(0, 10).map(({ tag, count }) => (
            <label key={tag} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.tags.includes(tag)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onFilterChange('tags', [...filters.tags, tag]);
                  } else {
                    onFilterChange(
                      'tags',
                      filters.tags.filter((t) => t !== tag),
                    );
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {tag} <span className="text-gray-500">({count})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Location Filter */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          id="location"
          type="text"
          value={filters.location}
          onChange={(e) => onFilterChange('location', e.target.value)}
          placeholder="City, state, or country"
          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Year Range Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Year Range</label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={filters.yearFrom}
            onChange={(e) => onFilterChange('yearFrom', e.target.value)}
            placeholder="From"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="number"
            value={filters.yearTo}
            onChange={(e) => onFilterChange('yearTo', e.target.value)}
            placeholder="To"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Date Precision Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date Precision</label>
        <select
          value={filters.precision || ''}
          onChange={(e) => onFilterChange('precision', e.target.value || null)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All precisions</option>
          {precisionOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
