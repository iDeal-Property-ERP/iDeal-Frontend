'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  deletePropertyPhoto,
  reorderPropertyPhotos,
  uploadPropertyPhotos,
} from '@/libs/management/propertiesAdapter';
import type { PropertyPhoto } from '@/types/property';

export type LocalPhotoItem = {
  id: number;
  file?: File;
  previewUrl: string;
  is_primary: boolean;
  sort_order: number;
  caption?: string | null;
};

export type UsePropertyPhotosResult = {
  photos: PropertyPhoto[];
  uploading: boolean;
  localFiles: File[];
  upload: (files: File[]) => Promise<void>;
  remove: (photoId: number) => Promise<void>;
  setCover: (photoId: number) => Promise<void>;
  updateCaption?: (photoId: number, caption: string) => void;
};

/**
 * Manages a property's photos with in-memory local state in create mode (propertyId === null)
 * and server persistence in edit mode (propertyId !== null).
 * @param propertyId - The property id, or null in create mode.
 * @param initial - The initial photo list.
 * @param labels - Localized error toast strings.
 * @returns The photo list, local files, and upload/remove/setCover actions.
 */
export function usePropertyPhotos(
  propertyId: number | null,
  initial: PropertyPhoto[],
  labels: { uploadError: string; needsDraft?: string },
): UsePropertyPhotosResult {
  const [photos, setPhotos] = useState<PropertyPhoto[]>(initial);
  const [localItems, setLocalItems] = useState<LocalPhotoItem[]>(() =>
    initial.map((p, idx) => ({
      id: p.id,
      previewUrl: p.image_url,
      is_primary: p.is_primary,
      sort_order: p.sort_order ?? idx,
      caption: p.caption,
    })),
  );
  const [uploading, setUploading] = useState(false);
  const nextTempId = useRef(-1);
  const objectUrls = useRef(new Map<number, string>());

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const url of urls.values()) {
        URL.revokeObjectURL(url);
      }
      urls.clear();
    };
  }, []);

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return;
      }
      if (propertyId === null) {
        // In-memory create mode
        const newItems: LocalPhotoItem[] = files.map((file) => {
          const tempId = nextTempId.current;
          nextTempId.current -= 1;
          const url = URL.createObjectURL(file);
          objectUrls.current.set(tempId, url);
          return {
            id: tempId,
            file,
            previewUrl: url,
            is_primary: false,
            sort_order: 0,
            caption: null,
          };
        });

        setLocalItems((prev) => {
          const combined = [...prev, ...newItems];
          return combined.map((item, idx) => ({
            ...item,
            sort_order: idx,
            is_primary: idx === 0,
          }));
        });
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
    [propertyId, labels.uploadError],
  );

  const remove = useCallback(
    async (photoId: number) => {
      if (propertyId === null) {
        const objectUrl = objectUrls.current.get(photoId);
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrls.current.delete(photoId);
        }
        setLocalItems((prev) => {
          const filtered = prev.filter((item) => item.id !== photoId);
          return filtered.map((item, idx) => ({
            ...item,
            sort_order: idx,
            is_primary: idx === 0,
          }));
        });
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
        setLocalItems((prev) =>
          prev.map((item) => ({
            ...item,
            is_primary: item.id === photoId,
          })),
        );
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

  const updateCaption = useCallback((photoId: number, caption: string) => {
    setLocalItems((prev) =>
      prev.map((item) => (item.id === photoId ? { ...item, caption } : item)),
    );
  }, []);

  const activePhotos: PropertyPhoto[] =
    propertyId === null
      ? localItems.map((item) => ({
          id: item.id,
          image_url: item.previewUrl,
          caption: item.caption ?? null,
          is_primary: item.is_primary,
          sort_order: item.sort_order,
        }))
      : photos;

  const localFiles = localItems
    .filter((item): item is LocalPhotoItem & { file: File } => Boolean(item.file))
    .map((item) => item.file);

  return { photos: activePhotos, uploading, localFiles, upload, remove, setCover, updateCaption };
}
