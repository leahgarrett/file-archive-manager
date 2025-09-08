import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { Photo, DatePrecision, Location } from './types/photo';

const app = express();
app.use(express.json());

const DATA_PATH = path.resolve(__dirname, './data/sample.json');

// Helper function to load photos from JSON
async function loadPhotos(): Promise<Photo[]> {
  try {
    const text = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(text);
  } catch (err) {
    console.error('Failed to load photos:', err);
    return [];
  }
}

// Helper function to save photos to JSON
async function savePhotos(photos: Photo[]): Promise<void> {
  const tmp = DATA_PATH + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(photos, null, 2), 'utf8');
  await fs.rename(tmp, DATA_PATH);
}

// Legacy endpoints (keep for backwards compatibility)
app.get('/api/photos/data', async (_req, res) => {
  try {
    const photos = await loadPhotos();
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: 'failed to read data' });
  }
});

app.post('/api/photos/data', async (req, res) => {
  try {
    const newData = req.body;
    if (!Array.isArray(newData)) {
      return res.status(400).json({ error: 'expected array' });
    }
    await savePhotos(newData);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'failed to write data' });
  }
});

// New RESTful API endpoints
// GET /api/photos/search - Search photos by text
app.get('/api/photos/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'query parameter q is required' });
    }

    const photos = await loadPhotos();
    const searchQuery = q.toLowerCase();

    const results = photos.filter(
      (photo) =>
        photo.tags.some((tag) => tag.toLowerCase().includes(searchQuery)) ||
        photo.people.some((person) => person.toLowerCase().includes(searchQuery)) ||
        photo.location.title.toLowerCase().includes(searchQuery) ||
        photo.location.city?.toLowerCase().includes(searchQuery) ||
        photo.location.country?.toLowerCase().includes(searchQuery) ||
        photo.filename.toLowerCase().includes(searchQuery),
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'failed to search photos' });
  }
});

// GET /api/photos/stats - Get statistics
app.get('/api/photos/stats', async (req, res) => {
  try {
    const photos = await loadPhotos();

    // Group by year
    const photosByYear: { [year: string]: number } = {};
    photos.forEach((photo) => {
      const year = new Date(photo.dateTaken).getFullYear().toString();
      photosByYear[year] = (photosByYear[year] || 0) + 1;
    });

    // Group by precision
    const photosByPrecision: { [precision: string]: number } = {};
    photos.forEach((photo) => {
      photosByPrecision[photo.dateTakenPrecision] =
        (photosByPrecision[photo.dateTakenPrecision] || 0) + 1;
    });

    // Group by location (country)
    const photosByCountry: { [country: string]: number } = {};
    photos.forEach((photo) => {
      const country = photo.location.country || 'Unknown';
      photosByCountry[country] = (photosByCountry[country] || 0) + 1;
    });

    res.json({
      total: photos.length,
      byYear: photosByYear,
      byPrecision: photosByPrecision,
      byCountry: photosByCountry,
    });
  } catch (err) {
    res.status(500).json({ error: 'failed to get stats' });
  }
});

// GET /api/tags - Get all unique tags with counts
app.get('/api/tags', async (req, res) => {
  try {
    const photos = await loadPhotos();
    const tagCounts: { [tag: string]: number } = {};

    photos.forEach((photo) => {
      photo.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Convert to array and sort by count
    const tags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: 'failed to get tags' });
  }
});

// GET /api/people - Get all unique people with counts
app.get('/api/people', async (req, res) => {
  try {
    const photos = await loadPhotos();
    const peopleCounts: { [person: string]: number } = {};

    photos.forEach((photo) => {
      photo.people.forEach((person) => {
        peopleCounts[person] = (peopleCounts[person] || 0) + 1;
      });
    });

    // Convert to array and sort by count
    const people = Object.entries(peopleCounts)
      .map(([person, count]) => ({ person, count }))
      .sort((a, b) => b.count - a.count);

    res.json(people);
  } catch (err) {
    res.status(500).json({ error: 'failed to get people' });
  }
});

// GET /api/locations - Get all unique locations with counts
app.get('/api/locations', async (req, res) => {
  try {
    const photos = await loadPhotos();
    const locationCounts: { [location: string]: number } = {};

    photos.forEach((photo) => {
      const locationKey = `${photo.location.city || 'Unknown'}, ${photo.location.country || 'Unknown'}`;
      locationCounts[locationKey] = (locationCounts[locationKey] || 0) + 1;
    });

    // Convert to array and sort by count
    const locations = Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);

    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: 'failed to get locations' });
  }
});

// GET /api/photos - List all photos with optional filtering and pagination
app.get('/api/photos', async (req, res) => {
  try {
    const photos = await loadPhotos();
    const {
      tags,
      people,
      location,
      yearFrom,
      yearTo,
      precision,
      limit = '100',
      offset = '0',
    } = req.query;

    let filteredPhotos = photos;

    // Filter by tags
    if (tags && typeof tags === 'string') {
      const tagList = tags.split(',').map((t) => t.trim());
      filteredPhotos = filteredPhotos.filter((photo) =>
        tagList.some((tag) => photo.tags.includes(tag)),
      );
    }

    // Filter by people
    if (people && typeof people === 'string') {
      const peopleList = people.split(',').map((p) => p.trim());
      filteredPhotos = filteredPhotos.filter((photo) =>
        peopleList.some((person) => photo.people.includes(person)),
      );
    }

    // Filter by location (city, state, country or title)
    if (location && typeof location === 'string') {
      const locationQuery = location.toLowerCase();
      filteredPhotos = filteredPhotos.filter(
        (photo) =>
          photo.location.city?.toLowerCase().includes(locationQuery) ||
          photo.location.state?.toLowerCase().includes(locationQuery) ||
          photo.location.country?.toLowerCase().includes(locationQuery) ||
          photo.location.title.toLowerCase().includes(locationQuery),
      );
    }

    // Filter by year range
    if (yearFrom && typeof yearFrom === 'string') {
      const year = parseInt(yearFrom);
      filteredPhotos = filteredPhotos.filter(
        (photo) => new Date(photo.dateTaken).getFullYear() >= year,
      );
    }

    if (yearTo && typeof yearTo === 'string') {
      const year = parseInt(yearTo);
      filteredPhotos = filteredPhotos.filter(
        (photo) => new Date(photo.dateTaken).getFullYear() <= year,
      );
    }

    // Filter by date precision
    if (precision && typeof precision === 'string') {
      filteredPhotos = filteredPhotos.filter((photo) => photo.dateTakenPrecision === precision);
    }

    // Pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedPhotos = filteredPhotos.slice(offsetNum, offsetNum + limitNum);

    res.json({
      photos: paginatedPhotos,
      total: filteredPhotos.length,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (err) {
    res.status(500).json({ error: 'failed to load photos' });
  }
});

// GET /api/photos/:id - Get single photo by ID
app.get('/api/photos/:id', async (req, res) => {
  try {
    const photos = await loadPhotos();
    const photo = photos.find((p) => p.id === req.params.id);

    if (!photo) {
      return res.status(404).json({ error: 'photo not found' });
    }

    res.json(photo);
  } catch (err) {
    res.status(500).json({ error: 'failed to load photo' });
  }
});

// POST /api/photos - Add new photo
app.post('/api/photos', async (req, res) => {
  try {
    const photos = await loadPhotos();
    const newPhoto: Photo = req.body;

    // Validate required fields
    if (!newPhoto.id || !newPhoto.filename) {
      return res.status(400).json({ error: 'id and filename are required' });
    }

    // Check for duplicate ID
    if (photos.some((p) => p.id === newPhoto.id)) {
      return res.status(409).json({ error: 'photo with this ID already exists' });
    }

    // Set timestamps
    const now = new Date().toISOString();
    newPhoto.dateAdded = now;
    newPhoto.dateModified = now;

    photos.push(newPhoto);
    await savePhotos(photos);

    res.status(201).json(newPhoto);
  } catch (err) {
    res.status(500).json({ error: 'failed to create photo' });
  }
});

// PUT /api/photos/:id - Update photo metadata
app.put('/api/photos/:id', async (req, res) => {
  try {
    const photos = await loadPhotos();
    const index = photos.findIndex((p) => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'photo not found' });
    }

    const updatedPhoto = { ...photos[index], ...req.body };
    updatedPhoto.dateModified = new Date().toISOString();

    // Don't allow changing ID or dateAdded
    updatedPhoto.id = photos[index].id;
    updatedPhoto.dateAdded = photos[index].dateAdded;

    photos[index] = updatedPhoto;
    await savePhotos(photos);

    res.json(updatedPhoto);
  } catch (err) {
    res.status(500).json({ error: 'failed to update photo' });
  }
});

// DELETE /api/photos/:id - Delete photo
app.delete('/api/photos/:id', async (req, res) => {
  try {
    const photos = await loadPhotos();
    const index = photos.findIndex((p) => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'photo not found' });
    }

    photos.splice(index, 1);
    await savePhotos(photos);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'failed to delete photo' });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

// Only start server if this file is run directly (not imported)
if (require.main === module) {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`backend listening on http://localhost:${port}`);
  });
}

export default app;
