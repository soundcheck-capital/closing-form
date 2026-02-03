import React, { useState, useEffect, useCallback } from 'react';
import { makeDocuSignService } from '../services/makeDocuSignService';
import { RRData } from '../types/docusign';

interface RRStepProps {
  rrData?: RRData;
  onRRChange?: (data: RRData) => void;
  recipientEmail?: string;
  recipientId?: string;
}

const RRStep: React.FC<RRStepProps> = ({
  rrData,
  onRRChange,
  recipientEmail = '',
  recipientId = ''
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [rrStatus, setRrStatus] = useState<string>('unknown');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isIframeClosed, setIsIframeClosed] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const loadSigningUrl = useCallback(async (envelopeId: string) => {
    try {
      const result = await makeDocuSignService.getRecipientView({
        envelopeId,
        recipientEmail,
        recipientId,
        returnUrl: `${window.location.origin}/docusign-success?type=rr` // URL de retour après signature/fermeture
      });

      console.log('📄 RR Signing URL result:', result);

      const resultAny = result as any;
      
      // Vérifier d'abord si le document est déjà signé (status: "completed" ou isSigned: true)
      if (resultAny.status === 'completed' || resultAny.isSigned === true || resultAny.isCompleted === true) {
        console.log('✅ RR Document is already completed/signed!');
        setRrStatus('completed');
        setSigningUrl(null);
        
        if (onRRChange) {
          onRRChange({
            envelopeId: resultAny.envelopeId || envelopeId,
            signingUrl: undefined,
            isCompleted: true,
            status: 'completed',
            completedAt: new Date().toISOString(),
            recipientEmail,
            recipientId
          });
        }
        return; // Pas besoin de charger l'URL de signature si déjà signé
      }
      
      // Make.com renvoie un tableau avec body.url
      let signingUrl = null;
      
      if (Array.isArray(resultAny) && resultAny.length > 0 && resultAny[0].body?.url) {
        signingUrl = resultAny[0].body.url;
      } else if (resultAny.signingUrl) {
        signingUrl = resultAny.signingUrl;
      } else if (resultAny.url) {
        signingUrl = resultAny.url;
      }
      
      console.log('📄 RR Signing URL from Make.com:', signingUrl);

      if (signingUrl) {
        console.log('✅ RR Signing URL found for client:', signingUrl);
        setSigningUrl(signingUrl);
        setRrStatus('sent');
        // Garder le loader actif jusqu'à ce que l'iframe soit chargée
        setIsIframeLoading(true);
        
        if (onRRChange) {
          onRRChange({
            envelopeId,
            signingUrl: signingUrl,
            isCompleted: false,
            status: 'sent',
            recipientEmail,
            recipientId
          });
        }
      } else if (resultAny.error) {
        console.log('❌ Error from Make.com:', resultAny.error);
        // Gérer l'erreur de routing order
        if (resultAny.error.includes('out of sequence') || resultAny.status === 'waiting') {
          setError('Please wait for other signers to complete the document first.');
        } else {
          setError(resultAny.error);
        }
      } else {
        console.log('⚠️ No signing URL in RR response, but checking if document is already signed...');
        console.log('📄 Full RR response structure:', JSON.stringify(resultAny, null, 2));
        // Si pas d'URL mais pas d'erreur, ne pas afficher d'erreur (peut-être déjà signé)
        if (!resultAny.status || resultAny.status !== 'completed') {
          setError('No signing URL received from Make.com');
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load RR signing URL';
      console.error('❌ RR Signing URL loading error:', errorMsg);
      setError(errorMsg);
    }
  }, [recipientEmail, recipientId, onRRChange]);

  const loadRRStatus = useCallback(async () => {
    // Éviter les appels répétés si déjà chargé une fois (sauf si erreur)
    if (hasLoadedOnce && !isCheckingStatus && !error) {
      console.log('🔄 RR already loaded once, skipping...');
      return;
    }

    // Éviter les appels concurrents
    if (isCheckingStatus) {
      console.log('🔄 RR status check already in progress, skipping...');
      return;
    }

    try {
      setIsCheckingStatus(true);
      setIsLoading(true);
      setError(null);

      const envelopeId = process.env.REACT_APP_RR_DOCUSIGN_ID;
      if (!envelopeId) {
        throw new Error('RR Document ID not configured');
      }

      console.log('📄 Loading RR status for envelope:', envelopeId);

      // Appeler l'endpoint de statut (avec cache intégré)
      const statusResult = await makeDocuSignService.getEnvelopeStatus(envelopeId);
      console.log('📄 RR Status result:', statusResult);

      if (statusResult && 'status' in statusResult) {
        const status = statusResult.status;
        setRrStatus(status || 'unknown');
        
        if (status === 'completed') {
          console.log('✅ RR Document is completed');
          // Pas d'URL nécessaire, le document est signé
          setSigningUrl(null);
          
          if (onRRChange) {
            onRRChange({
              envelopeId,
              signingUrl: undefined,
              status: 'completed',
              isCompleted: true,
              completedAt: new Date().toISOString(),
              recipientEmail,
              recipientId
            });
          }
        } else {
          console.log('📄 RR Document not completed, loading signing URL');
          // Charger l'URL de signature
          await loadSigningUrl(envelopeId);
        }
      } else {
        console.log('📄 No RR status found, loading signing URL');
        await loadSigningUrl(envelopeId);
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load RR document';
      console.error('❌ RR loading error:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      setIsCheckingStatus(false);
      setHasLoadedOnce(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckingStatus, onRRChange, recipientEmail, recipientId, loadSigningUrl, hasLoadedOnce]); // error retiré pour éviter les boucles

  // Charger le statut au montage (une seule fois)
  useEffect(() => {
    loadRRStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Vide pour ne charger qu'une fois au montage

  // Détecter quand l'iframe DocuSign est fermée
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // DocuSign envoie des messages quand l'utilisateur interagit avec l'iframe
      console.log('📨 RR Message received from iframe:', event.data);
      
      if (event.data && typeof event.data === 'object') {
        // Détecter la fermeture de l'iframe DocuSign
        if (event.data.event === 'signing_complete' || 
            event.data.event === 'cancel' || 
            event.data.event === 'decline' ||
            event.data.event === 'session_end' ||
            event.data.event === 'ttl_expired') {
          console.log('🚪 RR DocuSign iframe closed by user');
          setIsIframeClosed(true);
          
          // Note: Le statut sera vérifié au clic sur "Next"
          // Pas de vérification automatique pour éviter les boucles
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); // Pas de dépendances pour éviter les re-créations

  // Pas de polling automatique pour éviter les boucles
  // La vérification se fait uniquement au clic sur "Next"

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          RR Document Signature
        </h3>
        <p className="text-gray-600">
          Please review and sign the Reporting and Remittance Letter document, then click Next to continue.
        </p>
      </div>

      {/* Main Content */}
      <div className={`flex-1 rounded-lg overflow-hidden  transition-all duration-300 ease-in-out ${
        rrStatus === 'completed' 
          ? 'min-h-[300px] max-h-[400px]' // Plus petit pour le message de succès
          : 'min-h-[600px]' // Plus grand pour l'iframe
      }`}>
        
        {/* CASE 1: Document complété (status = completed) - PRIORITÉ ABSOLUE */}
        {(rrStatus === 'completed' || rrData?.isCompleted === true) ? (
          <div className="flex items-center justify-center p-4 h-full bg-green-50">
            <div className="text-center max-w-md">
              <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-semibold text-green-800 mb-2">RR Document Completed!</h3>
              <p className="text-green-700 mb-4">The Reporting and Remittance Letter has been completed and signed.</p>
              <p className="text-green-700 text-sm">You can now proceed to the next step.</p>
            </div>
          </div>
        ) : 
        
        /* CASE 2: URL de signature disponible - afficher iframe SEULEMENT si pas encore signé ET pas fermée */
        signingUrl && rrStatus !== 'completed' && !rrData?.isCompleted && !isIframeClosed ? (
          <div className="relative w-full h-full min-h-[600px]">
            {isIframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Document</h3>
                  <p className="text-gray-600">Please wait while the document loads...</p>
                </div>
              </div>
            )}
            <iframe
              src={signingUrl}
              className="w-full h-full min-h-[600px]"
              title="DocuSign RR Document"
              onLoad={() => {
                console.log('📄 RR iframe loaded');
                setIsIframeLoading(false);
                setIsLoading(false);
              }}
              onError={() => {
                console.error('❌ RR iframe failed to load');
                setIsIframeLoading(false);
                setIsLoading(false);
                setError('Failed to load the document. Please try again.');
              }}
            />
          </div>
        ) :
        
        /* CASE 2B: Iframe fermée - afficher bouton pour rouvrir */
        signingUrl && isIframeClosed && rrStatus !== 'completed' && !rrData?.isCompleted ? (
          <div className="flex items-center justify-center h-full bg-blue-50">
            <div className="text-center max-w-md">
              <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">RR Signing Session Closed</h3>
              <p className="text-gray-600 mb-4">You closed the signing interface. Click below to reopen and complete the signature.</p>
              <button
                onClick={() => {
                  setIsIframeClosed(false);
                  setIsIframeLoading(true);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Reopen RR Document
              </button>
            </div>
          </div>
        ) : 
        
        /* CASE 3: Chargement ou erreur */
        (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              {(isLoading || isIframeLoading) ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Loading RR Document</h3>
                  <p className="text-gray-600">Retrieving RR document information from DocuSign...</p>
                </>
              ) : error ? (
                <>
                  <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading RR Document</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={loadRRStatus}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    Retry
                  </button>
                </>
              ) : (
                <>
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">RR Document Not Available</h3>
                  <p className="text-gray-600 mb-4">Unable to load the RR document. Please contact an admin.</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      
    </div>
  );
};

export default RRStep;