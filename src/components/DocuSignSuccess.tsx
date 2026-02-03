import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { makeDocuSignService } from '../services/makeDocuSignService';
import logo from '../assets/logo_white_bold.svg';
import background from '../assets/background.jpeg';

const DocuSignSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<string>('checking');
  const [isLoading, setIsLoading] = useState(true);
  
  // Récupérer le type de document depuis les paramètres URL
  const documentType = searchParams.get('type') || 'document';
  
  // Vérifier le statut de l'enveloppe DocuSign
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setIsLoading(true);
        
        // Déterminer l'envelopeId selon le type de document
        const envelopeId = documentType === 'contract' 
          ? process.env.REACT_APP_FUTURE_PURCHASE_AGREEMENT_DOCUSIGN_ID
          : process.env.REACT_APP_RR_DOCUSIGN_ID;
        
        if (!envelopeId) {
          console.error('❌ Envelope ID not configured');
          setStatus('unknown');
          setIsLoading(false);
          return;
        }
        
        console.log('🔍 Checking DocuSign status for:', documentType, envelopeId);
        
        // Vérifier le statut avec forceRefresh pour avoir le statut à jour
        const statusResult = await makeDocuSignService.getEnvelopeStatus(envelopeId, true);
        
        console.log('📄 ===== STATUS RESULT DEBUG =====');
        console.log('📄 Status result:', statusResult);
        console.log('📄 Status result type:', typeof statusResult);
        console.log('📄 Is array?', Array.isArray(statusResult));
        console.log('📄 Status result keys:', statusResult && typeof statusResult === 'object' && !Array.isArray(statusResult) ? Object.keys(statusResult) : 'N/A');
        console.log('📄 Full status result (stringified):', JSON.stringify(statusResult, null, 2));
        console.log('📄 Has status property?', statusResult && typeof statusResult === 'object' && 'status' in statusResult);
        console.log('📄 Has isSigned property?', statusResult && typeof statusResult === 'object' && 'isSigned' in statusResult);
        if (statusResult && typeof statusResult === 'object' && 'status' in statusResult) {
          console.log('📄 status value:', (statusResult as any).status);
        }
        if (statusResult && typeof statusResult === 'object' && 'isSigned' in statusResult) {
          console.log('📄 isSigned value:', (statusResult as any).isSigned);
        }
        console.log('📄 ===== END DEBUG =====');
        
        // Vérifier différentes structures de réponse possibles
        let envelopeStatus: string | undefined;
        let isSigned: boolean | undefined;
        
        // Vérifier si c'est une erreur
        if (statusResult && typeof statusResult === 'object' && !Array.isArray(statusResult)) {
          const result = statusResult as any;
          
          if ('success' in result && result.success === false) {
            console.error('❌ Error in status result:', result.error);
            setStatus('error');
            setIsLoading(false);
            return;
          }
        }
        
        // Extraire le statut et isSigned de différentes structures possibles
        if (statusResult && typeof statusResult === 'object' && !Array.isArray(statusResult)) {
          const result = statusResult as any;
          
          // Cas 1: Format direct { status: "completed", isSigned: true, ... }
          if (result.status !== undefined && result.status !== null) {
            envelopeStatus = String(result.status);
            console.log('✅ Found status directly:', envelopeStatus);
          }
          
          if (result.isSigned !== undefined && result.isSigned !== null) {
            isSigned = Boolean(result.isSigned);
            console.log('✅ Found isSigned directly:', isSigned);
          }
          
          // Cas 2: Format avec data { data: { status: "completed", ... } }
          if (result.data && typeof result.data === 'object') {
            if (result.data.status !== undefined && result.data.status !== null) {
              envelopeStatus = String(result.data.status);
              console.log('✅ Found status in data:', envelopeStatus);
            }
            if (result.data.isSigned !== undefined && result.data.isSigned !== null) {
              isSigned = Boolean(result.data.isSigned);
              console.log('✅ Found isSigned in data:', isSigned);
            }
          }
        }
        
        // Déterminer le statut final - priorité à status, sinon utiliser isSigned
        console.log('🔍 Final check - envelopeStatus:', envelopeStatus, 'isSigned:', isSigned);
        
        if (envelopeStatus) {
          console.log('📄 Setting envelope status to:', envelopeStatus);
          setStatus(envelopeStatus);
        } else if (isSigned === true) {
          console.log('✅ Found isSigned: true, setting status to completed');
          setStatus('completed');
        } else {
          console.log('⚠️ No status or isSigned found in response');
          console.log('⚠️ Full result structure:', JSON.stringify(statusResult, null, 2));
          setStatus('unknown');
        }
      } catch (error) {
        console.error('❌ Error checking DocuSign status:', error);
        setStatus('error');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkStatus();
  }, [documentType]);
  
  // Rediriger vers le formulaire après 5 secondes si le statut est completed
  useEffect(() => {
    if (status === 'completed') {
      const timer = setTimeout(() => {
        navigate('/form');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  const getDocumentName = () => {
    switch (documentType) {
      case 'contract':
        return 'Contract';
      case 'rr':
        return 'RR Document';
      default:
        return 'Document';
    }
  };

  const getNextStepMessage = () => {
    if (documentType === 'contract') {
      return 'Please proceed to the RR Document step to complete your application.';
    } else if (documentType === 'rr') {
      return 'Please proceed to the ACH Direct Debit step to complete your application.';
    }
    return 'Please proceed to the next step to complete your application.';
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center py-12 px-6 bg-cover bg-center bg-black/50 bg-blend-overlay" 
      style={{ 
        backgroundImage: `url(${background})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      }}
    >
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src={logo} 
            alt="SoundCheck" 
            className="h-24 w-auto"
          />
        </div>

        {/* Success Message */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-green-600" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {isLoading ? (
              'Checking Signature Status...'
            ) : status === 'completed' ? (
              `${getDocumentName()} Signed Successfully!`
            ) : status === 'error' ? (
              'Error Checking Status'
            ) : (
              `${getDocumentName()} Signing In Progress`
            )}
          </h1>

          {/* Message */}
          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-4"></div>
              <p className="text-gray-600 mb-6 text-lg">
                Verifying your signature status...
              </p>
            </div>
          ) : status === 'completed' ? (
            <>
              <p className="text-gray-600 mb-4 text-lg">
                ✅ Thank you for signing the {getDocumentName().toLowerCase()}!
              </p>
              <p className="text-gray-700 mb-6 font-semibold text-lg">
                {getNextStepMessage()}
              </p>
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mr-3"></div>
                <span className="text-gray-500 text-sm">Redirecting to form...</span>
              </div>
            </>
          ) : status === 'error' ? (
            <p className="text-gray-600 mb-6 text-lg">
              There was an error verifying your signature. Please return to the form to check your status.
            </p>
          ) : (
            <p className="text-gray-600 mb-6 text-lg">
              Your signature is being processed. Please return to the form to check your status.
            </p>
          )}
        </div>

        {/* Manual redirect button */}
        <button
          onClick={() => navigate('/form')}
          className="mt-6 px-6 py-3 bg-white/90 hover:bg-white text-gray-900 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Return to Form Now
        </button>
      </div>
    </div>
  );
};

export default DocuSignSuccess;
