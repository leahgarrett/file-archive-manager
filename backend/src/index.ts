import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { parse as parseExif } from 'exifr';
import { Photo, DatePrecision, Location, Metadata } from './types/photo';

const app = express();
app.use(express.json());

// Serve static image files
const IMAGES_PATH = path.resolve(__dirname, './data/test-images');
app.use('/api/images', express.static(IMAGES_PATH));

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

// Helper function to determine date precision based on EXIF data
function determineDatePrecision(exifData: any): DatePrecision {
  if (exifData?.DateTime || exifData?.DateTimeOriginal || exifData?.CreateDate) {
    return 'exact';
  }
  return 'unknown';
}

// Helper function to filter unwanted EXIF metadata fields
function filterExifData(exifData: any): any {
  if (!exifData) return exifData;

  // List of fields to exclude from metadata storage
  const excludedFields = [
    'MediaWhitePoint',
    'RedMatrixColumn',
    'GreenMatrixColumn',
    'BlueMatrixColumn',
    'RedTRC',
    'ChromaticAdaptation',
    'BlueTRC',
    'GreenTRC',
    'makerNote',
  ];

  // Create a copy of the EXIF data without excluded fields
  const filtered = { ...exifData };
  excludedFields.forEach((field) => {
    delete filtered[field];
  });

  return filtered;
}

// Helper function to extract metadata from image file
async function extractImageMetadata(imagePath: string, filename: string): Promise<Partial<Photo>> {
  try {
    // Parse EXIF data with comprehensive options
    const rawExifData = await parseExif(imagePath, true); // true gets all available metadata

    // Filter out unwanted metadata fields
    const exifData = filterExifData(rawExifData);

    // Get file stats
    const stats = await fs.stat(imagePath);

    // Build comprehensive metadata structure
    const metadata: Metadata = {
      // Raw EXIF data (filtered)
      exif: exifData,

      // File system information
      file: {
        size: stats.size,
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        format: path.extname(filename).toLowerCase(),
        mimeType: getMimeType(filename),
      },

      // Technical specifications
      technical: {
        colorSpace: rawExifData?.ColorSpace,
        orientation: rawExifData?.Orientation,
        resolution: {
          x: rawExifData?.XResolution,
          y: rawExifData?.YResolution,
          unit: rawExifData?.ResolutionUnit,
        },
        compression: rawExifData?.Compression,
        bitDepth: rawExifData?.BitsPerSample,
      },

      // GPS and location data
      gps:
        rawExifData?.latitude && rawExifData?.longitude
          ? {
              latitude: rawExifData.latitude,
              longitude: rawExifData.longitude,
              altitude: rawExifData?.GPSAltitude,
              direction: rawExifData?.GPSImgDirection,
              timestamp: rawExifData?.GPSTimeStamp,
            }
          : undefined,

      // Camera settings
      camera: {
        make: rawExifData?.Make,
        model: rawExifData?.Model,
        software: rawExifData?.Software,
        lens: rawExifData?.LensModel || rawExifData?.LensMake,
        focalLength: rawExifData?.FocalLength,
        aperture: rawExifData?.FNumber || rawExifData?.ApertureValue,
        shutterSpeed: rawExifData?.ExposureTime || rawExifData?.ShutterSpeedValue,
        iso: rawExifData?.ISO || rawExifData?.ISOSpeedRatings,
        flash: rawExifData?.Flash !== undefined ? Boolean(rawExifData.Flash) : undefined,
        whiteBalance: rawExifData?.WhiteBalance,
        exposureMode: rawExifData?.ExposureMode,
        meteringMode: rawExifData?.MeteringMode,
      },

      // Timestamps from various sources
      timestamps: {
        dateTimeOriginal: rawExifData?.DateTimeOriginal,
        dateTime: rawExifData?.DateTime,
        createDate: rawExifData?.CreateDate,
        modifyDate: rawExifData?.ModifyDate,
        digitized: rawExifData?.DateTimeDigitized,
      },

      // Processing information
      processing: {
        extractedAt: new Date().toISOString(),
        extractorVersion: '1.0.0',
        source: 'exifr',
      },
    };

    // Get image dimensions (exifr provides these)
    const width = rawExifData?.ExifImageWidth || rawExifData?.ImageWidth || 0;
    const height = rawExifData?.ExifImageHeight || rawExifData?.ImageHeight || 0;

    // Extract date information
    let dateTaken = new Date().toISOString();
    let dateTakenPrecision: DatePrecision = 'unknown';

    const dateOriginal =
      rawExifData?.DateTimeOriginal || rawExifData?.CreateDate || rawExifData?.DateTime;
    if (dateOriginal) {
      try {
        // EXIF dates are usually in format "YYYY:MM:DD HH:MM:SS"
        const dateStr = dateOriginal.toString().replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          dateTaken = parsedDate.toISOString();
          dateTakenPrecision = 'exact';
        }
      } catch (err) {
        console.warn(`Failed to parse date for ${filename}:`, err);
      }
    }

    // Extract GPS location data
    const location: Location = {
      title: 'Unknown Location',
    };

    if (rawExifData?.latitude && rawExifData?.longitude) {
      location.latitude = rawExifData.latitude;
      location.longitude = rawExifData.longitude;
      location.title = `${rawExifData.latitude.toFixed(6)}, ${rawExifData.longitude.toFixed(6)}`;
    }

    // Extract camera/device information for tags - DISABLED to preserve meaningful tags
    // Camera info is now stored in metadata.camera instead
    const tags: string[] = []; // Start with empty tags, let meaningful tags be preserved

    const now = new Date().toISOString();

    return {
      filename,
      width,
      height,
      tags,
      people: [], // No automatic people detection yet
      location,
      dateTaken,
      dateTakenPrecision,
      dateAdded: now,
      dateModified: now,
      metadata, // Include comprehensive metadata
    };
  } catch (err) {
    console.error(`Failed to extract metadata for ${filename}:`, err);

    // Return basic metadata even if EXIF extraction fails
    const now = new Date().toISOString();
    return {
      filename,
      width: 0,
      height: 0,
      tags: [],
      people: [],
      location: { title: 'Unknown Location' },
      dateTaken: now,
      dateTakenPrecision: 'unknown' as DatePrecision,
      dateAdded: now,
      dateModified: now,
      metadata: {
        processing: {
          extractedAt: now,
          extractorVersion: '1.0.0',
          source: 'fallback',
        },
      },
    };
  }
}

// Helper function to get MIME type from filename
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
  };
  return mimeTypes[ext] || 'application/octet-stream';
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
// POST /api/photos/extract-metadata - Extract metadata from images and update JSON
app.post('/api/photos/extract-metadata', async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'filename is required' });
    }

    const imagePath = path.join(IMAGES_PATH, filename);

    // Check if image file exists
    try {
      await fs.access(imagePath);
    } catch (err) {
      return res.status(404).json({ error: `Image file ${filename} not found` });
    }

    // Extract metadata
    const metadata = await extractImageMetadata(imagePath, filename);

    // Load existing photos
    const photos = await loadPhotos();

    // Find existing photo or create new one
    const existingPhotoIndex = photos.findIndex((p) => p.filename === filename);

    if (existingPhotoIndex >= 0) {
      // Update existing photo with extracted metadata (preserve meaningful tags and people)
      const existingPhoto = photos[existingPhotoIndex];

      // Preserve existing meaningful tags (not camera metadata)
      const meaningfulTags = existingPhoto.tags.filter(
        (tag) =>
          !tag.includes('iPhone') &&
          !tag.includes('Apple') &&
          !tag.includes('Samsung') &&
          !tag.includes('Canon') &&
          !tag.includes('Nikon') &&
          !tag.includes('Software:') &&
          tag.length > 0,
      );

      photos[existingPhotoIndex] = {
        ...existingPhoto,
        // Update technical fields from metadata
        width: metadata.width || existingPhoto.width,
        height: metadata.height || existingPhoto.height,
        dateTaken: metadata.dateTaken || existingPhoto.dateTaken,
        dateTakenPrecision: metadata.dateTakenPrecision || existingPhoto.dateTakenPrecision,
        // Preserve meaningful content
        tags: meaningfulTags, // Keep only meaningful tags
        people: existingPhoto.people, // Always preserve people data
        // Update location only if it was "Unknown Location" before
        location:
          existingPhoto.location.title === 'Unknown Location'
            ? metadata.location || existingPhoto.location
            : existingPhoto.location,
        // Always update metadata and modification time
        metadata: metadata.metadata,
        dateModified: new Date().toISOString(),
      };
    } else {
      // Create new photo entry
      const { ...metadataWithoutId } = metadata;
      const newPhoto: Photo = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...(metadataWithoutId as Required<Pick<Photo, Exclude<keyof Photo, 'id'>>>),
      };
      photos.push(newPhoto);
    }

    // Save updated photos
    await savePhotos(photos);

    const updatedPhoto = photos.find((p) => p.filename === filename);
    res.json({
      success: true,
      photo: updatedPhoto,
      message: existingPhotoIndex >= 0 ? 'Photo metadata updated' : 'New photo created',
    });
  } catch (err) {
    console.error('Metadata extraction error:', err);
    res.status(500).json({ error: 'Failed to extract metadata' });
  }
});

// POST /api/photos/extract-all-metadata - Extract metadata from all images in directory
app.post('/api/photos/extract-all-metadata', async (req, res) => {
  try {
    // Get all image files in the directory
    const files = await fs.readdir(IMAGES_PATH);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'];
    const imageFiles = files.filter((file) =>
      imageExtensions.some((ext) => file.toLowerCase().endsWith(ext)),
    );

    if (imageFiles.length === 0) {
      return res.json({ success: true, message: 'No image files found', processed: [] });
    }

    // Load existing photos
    const photos = await loadPhotos();
    const processed: string[] = [];
    const errors: { filename: string; error: string }[] = [];

    // Process each image file
    for (const filename of imageFiles) {
      try {
        const imagePath = path.join(IMAGES_PATH, filename);
        const metadata = await extractImageMetadata(imagePath, filename);

        // Find existing photo or create new one
        const existingPhotoIndex = photos.findIndex((p) => p.filename === filename);

        if (existingPhotoIndex >= 0) {
          // Update existing photo with extracted metadata (preserve meaningful tags and people)
          const existingPhoto = photos[existingPhotoIndex];

          // Preserve existing meaningful tags (not camera metadata)
          const meaningfulTags = existingPhoto.tags.filter(
            (tag) =>
              !tag.includes('iPhone') &&
              !tag.includes('Apple') &&
              !tag.includes('Samsung') &&
              !tag.includes('Canon') &&
              !tag.includes('Nikon') &&
              !tag.includes('Software:') &&
              tag.length > 0,
          );

          photos[existingPhotoIndex] = {
            ...existingPhoto,
            // Update technical fields from metadata
            width: metadata.width || existingPhoto.width,
            height: metadata.height || existingPhoto.height,
            dateTaken: metadata.dateTaken || existingPhoto.dateTaken,
            dateTakenPrecision: metadata.dateTakenPrecision || existingPhoto.dateTakenPrecision,
            // Preserve meaningful content
            tags: meaningfulTags, // Keep only meaningful tags
            people: existingPhoto.people, // Always preserve people data
            // Update location only if it was "Unknown Location" before
            location:
              existingPhoto.location.title === 'Unknown Location'
                ? metadata.location || existingPhoto.location
                : existingPhoto.location,
            // Always update metadata and modification time
            metadata: metadata.metadata,
            dateModified: new Date().toISOString(),
          };
        } else {
          // Create new photo entry
          const { ...metadataWithoutId } = metadata;
          const newPhoto: Photo = {
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...(metadataWithoutId as Required<Pick<Photo, Exclude<keyof Photo, 'id'>>>),
          };
          photos.push(newPhoto);
        }

        processed.push(filename);
      } catch (err) {
        console.error(`Failed to process ${filename}:`, err);
        errors.push({ filename, error: (err as Error).message });
      }
    }

    // Save updated photos
    await savePhotos(photos);

    res.json({
      success: true,
      message: `Processed ${processed.length} of ${imageFiles.length} images`,
      processed,
      errors: errors.length > 0 ? errors : undefined,
      totalImages: imageFiles.length,
    });
  } catch (err) {
    console.error('Batch metadata extraction error:', err);
    res.status(500).json({ error: 'Failed to extract metadata from images' });
  }
});

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
