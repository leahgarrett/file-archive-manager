import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../index';
import request from 'supertest';

describe('Photo Archive API', () => {
  let server: any;

  beforeAll(() => {
    server = app.listen(0); // Use random port
  });

  afterAll(() => {
    server?.close();
  });

  describe('GET /api/photos', () => {
    it('should return all photos with pagination info', async () => {
      const response = await request(app).get('/api/photos').expect(200);

      expect(response.body).toHaveProperty('photos');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(Array.isArray(response.body.photos)).toBe(true);
    });

    it('should filter by tags', async () => {
      const response = await request(app).get('/api/photos?tags=vacation').expect(200);

      expect(response.body.photos).toHaveLength(1);
      expect(response.body.photos[0].tags).toContain('vacation');
    });

    it('should filter by location', async () => {
      const response = await request(app).get('/api/photos?location=california').expect(200);

      expect(response.body.total).toBeGreaterThan(0);
      response.body.photos.forEach((photo: any) => {
        const location = photo.location;
        expect(
          location.city?.toLowerCase().includes('california') ||
            location.state?.toLowerCase().includes('california') ||
            location.country?.toLowerCase().includes('california') ||
            location.title.toLowerCase().includes('california'),
        ).toBe(true);
      });
    });

    it('should filter by year range', async () => {
      const response = await request(app).get('/api/photos?yearFrom=2023&yearTo=2023').expect(200);

      response.body.photos.forEach((photo: any) => {
        const year = new Date(photo.dateTaken).getFullYear();
        expect(year).toBe(2023);
      });
    });

    it('should filter by date precision', async () => {
      const response = await request(app).get('/api/photos?precision=exact').expect(200);

      response.body.photos.forEach((photo: any) => {
        expect(photo.dateTakenPrecision).toBe('exact');
      });
    });
  });

  describe('GET /api/photos/:id', () => {
    it('should return a single photo by ID', async () => {
      const response = await request(app).get('/api/photos/1').expect(200);

      expect(response.body).toHaveProperty('id', '1');
      expect(response.body).toHaveProperty('filename');
    });

    it('should return 404 for non-existent photo', async () => {
      const response = await request(app).get('/api/photos/non-existent').expect(404);

      expect(response.body).toHaveProperty('error', 'photo not found');
    });
  });

  describe('POST /api/photos', () => {
    it('should create a new photo', async () => {
      const newPhoto = {
        id: 'test-create',
        filename: 'test-create.jpg',
        tags: ['test'],
        width: 1000,
        height: 800,
        people: [],
        location: { title: 'Test Location' },
        dateTaken: '2024-01-01T12:00:00.000Z',
        dateTakenPrecision: 'exact' as const,
      };

      const response = await request(app).post('/api/photos').send(newPhoto).expect(201);

      expect(response.body.id).toBe('test-create');
      expect(response.body).toHaveProperty('dateAdded');
      expect(response.body).toHaveProperty('dateModified');

      // Clean up
      await request(app).delete('/api/photos/test-create');
    });

    it('should reject duplicate IDs', async () => {
      const response = await request(app)
        .post('/api/photos')
        .send({
          id: '1', // Existing ID
          filename: 'duplicate.jpg',
        })
        .expect(409);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/photos/:id', () => {
    it('should update photo metadata', async () => {
      // First create a test photo
      const testPhoto = {
        id: 'test-update',
        filename: 'test-update.jpg',
        tags: ['original'],
        width: 1000,
        height: 800,
        people: [],
        location: { title: 'Original Location' },
        dateTaken: '2024-01-01T12:00:00.000Z',
        dateTakenPrecision: 'exact' as const,
      };

      await request(app).post('/api/photos').send(testPhoto).expect(201);

      // Update it
      const updates = {
        tags: ['updated'],
        location: { title: 'Updated Location' },
      };

      const response = await request(app).put('/api/photos/test-update').send(updates).expect(200);

      expect(response.body.tags).toEqual(['updated']);
      expect(response.body.location.title).toBe('Updated Location');
      expect(response.body.dateModified).not.toBe(response.body.dateAdded);

      // Clean up
      await request(app).delete('/api/photos/test-update');
    });
  });

  describe('DELETE /api/photos/:id', () => {
    it('should delete a photo', async () => {
      // Create test photo
      const testPhoto = {
        id: 'test-delete',
        filename: 'test-delete.jpg',
        tags: [],
        width: 1000,
        height: 800,
        people: [],
        location: { title: 'Test Location' },
        dateTaken: '2024-01-01T12:00:00.000Z',
        dateTakenPrecision: 'exact' as const,
      };

      await request(app).post('/api/photos').send(testPhoto).expect(201);

      // Delete it
      await request(app).delete('/api/photos/test-delete').expect(200);

      // Verify it's gone
      await request(app).get('/api/photos/test-delete').expect(404);
    });
  });

  describe('GET /api/photos/search', () => {
    it('should search photos by query string', async () => {
      const response = await request(app).get('/api/photos/search?q=beach').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((photo: any) => {
        const searchableText = [
          ...photo.tags,
          ...photo.people,
          photo.location.title,
          photo.location.city,
          photo.location.country,
          photo.filename,
        ]
          .join(' ')
          .toLowerCase();
        expect(searchableText).toContain('beach');
      });
    });

    it('should require query parameter', async () => {
      const response = await request(app).get('/api/photos/search').expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/photos/stats', () => {
    it('should return collection statistics', async () => {
      const response = await request(app).get('/api/photos/stats').expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byYear');
      expect(response.body).toHaveProperty('byPrecision');
      expect(response.body).toHaveProperty('byCountry');
      expect(typeof response.body.total).toBe('number');
    });
  });

  describe('GET /api/tags', () => {
    it('should return all tags with counts', async () => {
      const response = await request(app).get('/api/tags').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((item: any) => {
        expect(item).toHaveProperty('tag');
        expect(item).toHaveProperty('count');
        expect(typeof item.count).toBe('number');
      });
    });
  });

  describe('GET /api/people', () => {
    it('should return all people with counts', async () => {
      const response = await request(app).get('/api/people').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((item: any) => {
        expect(item).toHaveProperty('person');
        expect(item).toHaveProperty('count');
      });
    });
  });

  describe('GET /api/locations', () => {
    it('should return all locations with counts', async () => {
      const response = await request(app).get('/api/locations').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((item: any) => {
        expect(item).toHaveProperty('location');
        expect(item).toHaveProperty('count');
      });
    });
  });
});
