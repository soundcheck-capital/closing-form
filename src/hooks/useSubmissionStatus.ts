import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { submissionService } from '../services/submissionService';
import { setSubmitted } from '../store/form/formSlice';

interface UseSubmissionStatusReturn {
  isLoading: boolean;
  isSubmitted: boolean;
  error: string | null;
  recheckStatus: () => Promise<void>;
}

export const useSubmissionStatus = (): UseSubmissionStatusReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmittedLocal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  const checkStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const status = await submissionService.checkSubmissionStatus();
      
      setIsSubmittedLocal(status);
      
      // Synchroniser avec Redux si soumis
      if (status) {
        dispatch(setSubmitted());
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ Erreur lors de la vérification du statut:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  // Vérification au montage du composant
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    isLoading,
    isSubmitted,
    error,
    recheckStatus: checkStatus
  };
};

export default useSubmissionStatus;
