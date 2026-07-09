'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  deletePropertyPhoto,
  reorderPropertyPhotos,
  uploadPropertyPhotos,
} from '@/libs/management/propertiesAdapter';
import type { PropertyPhoto } from '@/types/property';

export type UsePropertyPhotosResult = {
  photos: PropertyPhoto[];
  uploading: boolean;
  upload: (files: File[]) => Promise<void>;
  remove: (photoId: number) => Promise<void>;
  setCover: (photoId: number) => Promise<void>;
};

/**
 * Manages a property's photos with optimistic UI and revert-on-error. Requires a
 * persisted property id (drafts must be created first via autosave).
 * @param propertyId - The property id, or null when no draft exists yet.
 * @param initial - The initial photo list.
 * @param labels - Localized error toast strings.
 * @returns The photo list plus upload/remove/setCover actions.
 */
export function usePropertyPhotos(
  propertyId: number | null,
  initial: PropertyPhoto[],
  labels: { uploadError: string; needsDraft: string },
): UsePropertyPhotosResult {
  const [photos, setPhotos] = useState<PropertyPhoto[]>(initial);
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (files: File[]) => {
      if (propertyId === null) {
        toast.error(labels.needsDraft);
        return;
      }
      if (files.length === 0) {
        return;
      }
      setUploading(true);
      try {
        const updated = await uploadPropertyPhotos(propertyId, files);
        setPhotos(updated.photos);
      } catch {
        toast.error(labels.uploadError);
      } finally {
        setUploading(false);
      }
    },
    [propertyId, labels.uploadError, labels.needsDraft],
  );

  const remove = useCallback(
    async (photoId: number) => {
      if (propertyId === null) {
        return;
      }
      const previous = photos;
      setPhotos((current) => current.filter((photo) => photo.id !== photoId));
      try {
        const updated = await deletePropertyPhoto(propertyId, photoId);
        setPhotos(updated.photos);
      } catch {
        setPhotos(previous);
        toast.error(labels.uploadError);
      }
    },
    [propertyId, photos, labels.uploadError],
  );

  const setCover = useCallback(
    async (photoId: number) => {
      if (propertyId === null) {
        return;
      }
      const previous = photos;
      setPhotos((current) =>
        current.map((photo) => ({ ...photo, is_primary: photo.id === photoId })),
      );
      try {
        const items = photos.map((photo, index) => ({
          id: photo.id,
          sort_order: index,
          is_primary: photo.id === photoId,
        }));
        const updated = await reorderPropertyPhotos(propertyId, items);
        setPhotos(updated.photos);
      } catch {
        setPhotos(previous);
        toast.error(labels.uploadError);
      }
    },
    [propertyId, photos, labels.uploadError],
  );

  return { photos, uploading, upload, remove, setCover };
}
