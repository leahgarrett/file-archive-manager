import { Photo } from '../types/photo';
import { formatDateForDisplay, getThumbnailUrl } from '../utils/api';

interface PhotoGridProps {
  photos: Photo[];
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  );
}

interface PhotoCardProps {
  photo: Photo;
}

function PhotoCard({ photo }: PhotoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="aspect-square bg-gray-200 relative overflow-hidden">
        <img
          src={getThumbnailUrl(photo)}
          alt={photo.filename}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Date precision indicator */}
        {photo.dateTakenPrecision !== 'exact' && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            {photo.dateTakenPrecision}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Filename */}
        <h3 className="font-semibold text-gray-900 truncate mb-2">{photo.filename}</h3>

        {/* Date */}
        <p className="text-sm text-gray-600 mb-2">
          {formatDateForDisplay(photo.dateTaken, photo.dateTakenPrecision)}
        </p>

        {/* Location */}
        <p className="text-sm text-gray-600 mb-3 truncate">📍 {photo.location.title}</p>

        {/* Tags */}
        {photo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {photo.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {photo.tags.length > 3 && (
              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                +{photo.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* People */}
        {photo.people.length > 0 && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">People:</span>{' '}
            {photo.people.length <= 2
              ? photo.people.join(', ')
              : `${photo.people.slice(0, 2).join(', ')} +${photo.people.length - 2} more`}
          </div>
        )}

        {/* Dimensions */}
        <div className="text-xs text-gray-500 mt-2">
          {photo.width} × {photo.height}
        </div>
      </div>
    </div>
  );
}
