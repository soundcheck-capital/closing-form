import { useState, useCallback } from 'react';
import googleDriveService from '../services/googleDriveService';

interface UploadProgress {
  total: number;
  completed: number;
  currentFile?: string;
}

interface UseGoogleDriveUploadReturn {
  isUploading: boolean;
  uploadProgress: UploadProgress;
  uploadFiles: (files: File[], folderName?: string) => Promise<Array<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }>>;
  uploadFile: (file: File, folderName?: string) => Promise<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }>;
  resetProgress: () => void;
}

export const useGoogleDriveUpload = (): UseGoogleDriveUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    total: 0,
    completed: 0
  });

  const uploadFile = useCallback(async (file: File, folderName: string = 'Closing Applications') => {
    setIsUploading(true);
    setUploadProgress({
      total: 1,
      completed: 0,
      currentFile: file.name
    });

    try {
      const result = await googleDriveService.uploadFile(file, folderName);
      
      setUploadProgress(prev => ({
        ...prev,
        completed: prev.completed + 1
      }));

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadFiles = useCallback(async (files: File[], folderName: string = 'Closing Applications') => {
    setIsUploading(true);
    setUploadProgress({
      total: files.length,
      completed: 0
    });

    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      setUploadProgress(prev => ({
        ...prev,
        currentFile: file.name
      }));

      try {
        const result = await googleDriveService.uploadFile(file, folderName);
        results.push(result);
        
        setUploadProgress(prev => ({
          ...prev,
          completed: prev.completed + 1
        }));
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
        
        setUploadProgress(prev => ({
          ...prev,
          completed: prev.completed + 1
        }));
      }
    }

    setIsUploading(false);
    return results;
  }, []);

  const resetProgress = useCallback(() => {
    setUploadProgress({
      total: 0,
      completed: 0
    });
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadFiles,
    uploadFile,
    resetProgress
  };
}; 