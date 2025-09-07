import { describe, it, expect } from 'vitest';
import {
  findByTag,
  findByYear,
  findByDateRange,
  formatDateForDisplay,
  sortByDateTaken,
  createEstimatedDate,
  createDecadeEstimate,
  filterByPrecision,
  type DatePrecision,
} from './sample';

describe('sample data', () => {
  it('finds photos by tag', () => {
    const results = findByTag('beach');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].tags).toContain('beach');
  });

  it('finds photos by year', () => {
    const photos2023 = findByYear(2023);
    expect(photos2023.length).toBeGreaterThan(0);
    photos2023.forEach((photo) => {
      expect(photo.dateTaken).toMatch(/^2023-/);
    });
  });

  it('finds photos by date range', () => {
    const summerPhotos = findByDateRange('2023-06-01T00:00:00.000Z', '2023-08-31T23:59:59.999Z');
    expect(summerPhotos.length).toBeGreaterThan(0);
    summerPhotos.forEach((photo) => {
      expect(photo.dateTaken >= '2023-06-01T00:00:00.000Z').toBe(true);
      expect(photo.dateTaken <= '2023-08-31T23:59:59.999Z').toBe(true);
    });
  });

  it('formats dates for display', () => {
    const formatted = formatDateForDisplay('2023-12-25T16:45:00.000Z');
    // Allow for timezone differences - just check that it's a properly formatted date in December 2023
    expect(formatted).toMatch(/(December|Dec) (24|25|26), 2023|(24|25|26) (December|Dec) 2023/);
  });

  it('formats dates with precision indicators', () => {
    const exactDate = formatDateForDisplay('2023-12-25T16:45:00.000Z', 'exact');
    const dayKnown = formatDateForDisplay('2023-12-25T16:45:00.000Z', 'day');
    const monthEst = formatDateForDisplay('2023-12-25T16:45:00.000Z', 'month');
    const yearEst = formatDateForDisplay('2023-12-25T16:45:00.000Z', 'year');
    const decadeEst = formatDateForDisplay('1985-12-25T16:45:00.000Z', 'decade');
    const unknown = formatDateForDisplay('2023-12-25T16:45:00.000Z', 'unknown');

    expect(dayKnown).toContain('(day known)');
    expect(monthEst).toContain('(est.)');
    expect(yearEst).toMatch(/2023 \(est\.\)/);
    expect(decadeEst).toMatch(/1980s \(est\.\)/);
    expect(unknown).toBe('Date unknown');
  });

  it('creates estimated dates', () => {
    const date1985 = createEstimatedDate(1985);
    expect(date1985).toMatch(/^1985-06-15T12:00:00\.000Z$/);

    const dateCustom = createEstimatedDate(2020, 3, 10);
    expect(dateCustom).toMatch(/^2020-03-10T12:00:00\.000Z$/);
  });

  it('creates decade estimates', () => {
    const eighties = createDecadeEstimate(1980);
    expect(eighties).toMatch(/^1985-06-15T12:00:00\.000Z$/);
  });

  it('filters by date precision', () => {
    const exactPhotos = filterByPrecision('exact');
    const estimatedPhotos = filterByPrecision(['decade', 'year']);

    expect(exactPhotos.length).toBeGreaterThan(0);
    exactPhotos.forEach((photo) => {
      expect(photo.dateTakenPrecision).toBe('exact');
    });

    estimatedPhotos.forEach((photo) => {
      expect(['decade', 'year']).toContain(photo.dateTakenPrecision);
    });
  });

  it('sorts photos by date taken', () => {
    const vacationPhotos = findByTag('vacation');
    const sorted = sortByDateTaken(vacationPhotos, true); // descending

    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].dateTaken >= sorted[i].dateTaken).toBe(true);
    }
  });
});
