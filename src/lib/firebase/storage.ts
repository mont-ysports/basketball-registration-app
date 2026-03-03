// src/lib/firebase/storage.ts
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { storage } from './config';

// Upload player photo
export const uploadPlayerPhoto = async (
  file: File,
  playerId: string
): Promise<{ url: string; path: string }> => {
  try {
    // Create unique filename
    const timestamp = Date.now();
    const filename = `${playerId}_${timestamp}.${file.name.split('.').pop()}`;
    const storagePath = `players/${playerId}/${filename}`;

    // Create reference
    const storageRef = ref(storage, storagePath);

    // Upload file
    await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    return {
      url: downloadURL,
      path: storagePath
    };
  } catch (error: any) {
    throw new Error(`Error uploading photo: ${error.message}`);
  }
};

// Delete player photo
export const deletePlayerPhoto = async (photoPath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, photoPath);
    await deleteObject(storageRef);
  } catch (error: any) {
    throw new Error(`Error deleting photo: ${error.message}`);
  }
};