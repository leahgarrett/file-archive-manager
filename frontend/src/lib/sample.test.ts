import { describe, it, expect } from 'vitest';
import { findByTag } from './sample';

describe('sample data', () => {
  it('finds photos by tag', () => {
    const results = findByTag('beach');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].tags).toContain('beach');
  });
});
