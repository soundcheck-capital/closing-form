import React, { useState, useEffect, useCallback } from 'react';
import { makeDocuSignService } from '../services/makeDocuSignService';
import { ContractData } from '../types/docusign';

interface ContractStepProps {
  contractData?: ContractData;
  onContractChange?: (data: ContractData) => void;
  recipientEmail?: string;
  recipientId?: string;
}

const ContractStep: React.FC<ContractStepProps> = ({
  contractData,
  onContractChange,
  recipientEmail = '',
  recipientId = ''
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<string>('unknown');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isIframeClosed, setIsIframeClosed] = useState(false);

  const loadSigningUrl = useCallback(async (envelopeId: string) => {
    console.log('🔄 loadSigningUrl called for envelope:', envelopeId);
    try {
      const result = await makeDocuSignService.getRecipientView({
        envelopeId,
        recipientEmail,
        recipientId,
        returnUrl: window.location.href // URL de retour après signature/fermeture
      });

      console.log('📄 Signing URL result:', result);

      const resultAny = result as any;
      
      // Make.com renvoie un tableau avec body.url
      let signingUrl = null;
      
      if (Array.isArray(resultAny) && resultAny.length > 0 && resultAny[0].body?.url) {
        signingUrl = resultAny[0].body.url;
      } else if (resultAny.signingUrl) {
        signingUrl = resultAny.signingUrl;
      } else if (resultAny.url) {
        signingUrl = resultAny.url;
      }
      
      console.log('📄 Signing URL from Make.com:', signingUrl);

      if (signingUrl) {
        console.log('✅ Signing URL found for client:', signingUrl);
        setSigningUrl(signingUrl);
        setContractStatus('sent');
        
        if (onContractChange) {
          onContractChange({
            envelopeId,
            signingUrl: signingUrl,
            isSigned: false,
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
        console.log('❌ No signing URL in response');
        console.log('📄 Full response structure:', JSON.stringify(resultAny, null, 2));
        setError('No signing URL received from Make.com');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load signing URL';
      console.error('❌ Signing URL loading error:', errorMsg);
      setError(errorMsg);
    }
  }, [recipientEmail, recipientId, onContractChange]);

  const loadContractStatus = useCallback(async () => {
    // Éviter les appels répétés si déjà chargé une fois (sauf si erreur)
    if (hasLoadedOnce && !isCheckingStatus && !error) {
      console.log('🔄 Contract already loaded once, skipping...');
      return;
    }

    // Éviter les appels concurrents
    if (isCheckingStatus) {
      console.log('🔄 Contract status check already in progress, skipping...');
      return;
    }

    try {
      setIsCheckingStatus(true);
      setIsLoading(true);
      setError(null);

      const envelopeId = process.env.REACT_APP_FUTURE_PURCHASE_AGREEMENT_DOCUSIGN_ID;
      if (!envelopeId) {
        throw new Error('Contract ID not configured');
      }

      console.log('📄 Loading contract status for envelope:', envelopeId);

      // Appeler l'endpoint de statut (avec cache intégré)
      console.log('🔄 Calling getEnvelopeStatus...');
      const statusResult = await makeDocuSignService.getEnvelopeStatus(envelopeId);
      console.log('📄 Status result:', statusResult);
      console.log('📄 Status result type:', typeof statusResult);
      console.log('📄 Status result keys:', statusResult ? Object.keys(statusResult) : 'null');
      console.log('📄 Status result structure:', JSON.stringify(statusResult, null, 2));
      console.log('📄 Has status property?', statusResult && 'status' in statusResult);
      console.log('📄 statusResult.status value:', statusResult && 'status' in statusResult ? statusResult.status : 'no status');

      if (statusResult && 'status' in statusResult && statusResult.status) {
        const status = statusResult.status;
        console.log('📄 Found status:', status);
        setContractStatus(status || 'unknown');
        
        if (status === 'completed') {
          console.log('✅ Contract is completed');
          // Pas d'URL nécessaire, le contrat est signé
          setSigningUrl(null);
          
          if (onContractChange) {
            onContractChange({
              envelopeId,
              signingUrl: undefined,
              status: 'completed',
              isSigned: true,
              signedAt: new Date().toISOString(),
              recipientEmail,
              recipientId
            });
          }
        } else {
          console.log('📄 Contract not completed, loading signing URL');
          // Charger l'URL de signature
          await loadSigningUrl(envelopeId);
        }
      } else {
        console.log('📄 No status found in result, loading signing URL');
        console.log('📄 statusResult:', statusResult);
        await loadSigningUrl(envelopeId);
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load contract';
      console.error('❌ Contract loading error:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      setIsCheckingStatus(false);
      setHasLoadedOnce(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckingStatus, onContractChange, recipientEmail, recipientId, loadSigningUrl, hasLoadedOnce]); // error retiré pour éviter les boucles

  // Charger le statut au montage (une seule fois)
  useEffect(() => {
    loadContractStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Vide pour ne charger qu'une fois au montage

  // Détecter quand l'iframe DocuSign est fermée
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // DocuSign envoie des messages quand l'utilisateur interagit avec l'iframe
      console.log('📨 Message received from iframe:', event.data);
      
      if (event.data && typeof event.data === 'object') {
        // Détecter la fermeture de l'iframe DocuSign
        if (event.data.event === 'signing_complete' || 
            event.data.event === 'cancel' || 
            event.data.event === 'decline' ||
            event.data.event === 'session_end' ||
            event.data.event === 'ttl_expired') {
          console.log('🚪 DocuSign iframe closed by user');
          setIsIframeClosed(true);
          
          // Vérifier le statut après fermeture
          if (event.data.event === 'signing_complete') {
            console.log('✅ Signing complete event received, checking status...');
            loadContractStatus();
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadContractStatus]);

  // Polling du statut quand l'iframe est affichée
  useEffect(() => {
    if (!signingUrl || contractStatus === 'completed') {
      return; // Pas de polling si pas d'iframe ou déjà complété
    }

    console.log('🔄 Starting status polling for contract...');
    const pollInterval = setInterval(async () => {
      console.log('⏰ Polling contract status...');
      const envelopeId = process.env.REACT_APP_FUTURE_PURCHASE_AGREEMENT_DOCUSIGN_ID;
      if (!envelopeId) return;

      try {
        const result = await makeDocuSignService.getEnvelopeStatus(envelopeId, true);
        const resultAny = result as any;
        const status = resultAny.status;
        const signedDateTime = resultAny.signedDateTime;

        console.log('📊 Polled status:', { status, signedDateTime });

        if (status === 'completed' || status === 'signed') {
          console.log('✅ Contract completed during polling!');
          setContractStatus('completed');
          setSigningUrl(null);
          setIsIframeClosed(false);
          
          if (onContractChange) {
            onContractChange({
              envelopeId,
              signingUrl: undefined,
              status: 'completed',
              isSigned: true,
              signedAt: signedDateTime || new Date().toISOString(),
              recipientEmail,
              recipientId
            });
          }
        }
      } catch (error) {
        console.error('❌ Error during status polling:', error);
      }
    }, 5000); // Vérifier toutes les 5 secondes

    return () => {
      console.log('🛑 Stopping status polling');
      clearInterval(pollInterval);
    };
  }, [signingUrl, contractStatus, onContractChange, recipientEmail, recipientId]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Contract Signature
        </h3>
        <p className="text-gray-600">
          Please review and sign the contract document, then click Next to continue.
        </p>
      </div>

      {/* Main Content */}
      <div className={`flex-1 rounded-lg overflow-hidden bg-white transition-all duration-300 ease-in-out ${
        contractStatus === 'completed' 
          ? 'min-h-[200px] max-h-[400px]' // Plus petit pour le message de succès
          : 'min-h-[600px]' // Plus grand pour l'iframe
      }`}>
        
        {/* CASE 1: Document signé (status = completed) - PRIORITÉ ABSOLUE */}
        {(contractStatus === 'completed' || contractData?.isSigned === true) ? (
          <div className="flex items-center p-4 justify-center h-full bg-green-50">
            <div className="text-center max-w-md">
              <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-semibold text-green-800 mb-2">Contract Signed!</h3>
              <p className="text-green-700 mb-4">The contract has been completed and signed.</p>
              <p className="text-green-700 text-sm">You can now proceed to the next step.</p>
            </div>
          </div>
        ) : 
        
        /* CASE 2: URL de signature disponible - afficher iframe SEULEMENT si pas encore signé ET pas fermée */
        signingUrl && contractStatus !== 'completed' && !contractData?.isSigned && !isIframeClosed ? (
          <div className="relative w-full p-4 h-full min-h-[500px]">
            <iframe
              src={signingUrl}
              className="w-full h-full min-h-[500px]"
              title="DocuSign Contract"
              onLoad={() => console.log('📄 Contract iframe loaded')}
            />
          </div>
        ) :
        
        /* CASE 2B: Iframe fermée - afficher bouton pour rouvrir */
        signingUrl && isIframeClosed && contractStatus !== 'completed' && !contractData?.isSigned ? (
          <div className="flex items-center justify-center h-full bg-blue-50">
            <div className="text-center max-w-md">
              <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Contract Signing Session Closed</h3>
              <p className="text-gray-600 mb-4">You closed the signing interface. Click below to reopen and complete the signature.</p>
              <button
                onClick={() => setIsIframeClosed(false)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Reopen Contract
              </button>
            </div>
          </div>
        ) : 
        
        /* CASE 3: Chargement ou erreur */
        (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Contract</h3>
                  <p className="text-gray-600">Retrieving contract information from DocuSign...</p>
                </>
              ) : error ? (
                <>
                  <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Contract</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={loadContractStatus}
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Contract Not Available</h3>
                  <p className="text-gray-600 mb-4">Unable to load the contract. Please contact an admin.</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

        {/* Debug Info (Development only) */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 border rounded-lg">
            <h4 className="font-medium mb-2">Contract Debug Info:</h4>
            <pre className="text-xs text-gray-600">
              {JSON.stringify({
        
              error
            }, null, 2)}
          </pre>
        </div>
      )} */}
      
    </div>
  );
};

export default ContractStep;