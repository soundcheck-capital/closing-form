import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { fetchApplicationById } from '../store/auth/authThunks';
import logo from '../assets/logo_black_bold.svg';
import ButtonSecondary from './customComponents/ButtonSecondary';
import ButtonPrimary from './customComponents/ButtonPrimary';
import ContractStep from './ContractStep';
import RRStep from './RRStep';
import ACHDirectDebitStep from './ACHDirectDebitStep';



const MultiStepFormContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const formData = useSelector((state: RootState) => state.form);
  const [saveMessage] = useState('');

  // État pour les données de chaque étape
  const [contractData, setContractData] = useState({
    envelopeId: '',
    signingUrl: '',
    isSigned: false,
    signedAt: '',
    status: '',
    recipientEmail: '',
    recipientName: ''
  });

  const [rrData, setRRData] = useState({
    envelopeId: '',
    signingUrl: '',
    isCompleted: false,
    completedAt: '',
    status: '',
    rrNumber: '',
    recipientEmail: '',
    recipientName: ''
  });

  const [achData, setACHData] = useState({
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking' as 'checking' | 'savings',
    isVerified: false,
    verifiedAt: ''
  });

  // État pour tracker si la soumission a été effectuée
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  
  // État pour gérer la vérification en cours
  const [isCheckingSignature, setIsCheckingSignature] = useState(false);

  const isDevelopment = process.env.NODE_ENV === 'development';


  // Vérifier si le formulaire a été soumis avec succès
  useEffect(() => {
    const disableSubmissionBlock = localStorage.getItem('DISABLE_SUBMISSION_BLOCK') === 'true';
    if (formData.isSubmitted && !isDevelopment && !disableSubmissionBlock) {
      // Rediriger vers la page de succès si le formulaire a été soumis
      navigate('/submit-success');
    }
  }, [formData.isSubmitted, navigate, isDevelopment]);

  // Load application data if ID is provided
  useEffect(() => {
    if (id) {
      dispatch(fetchApplicationById(id));
    }
  }, [id, dispatch]);

  // Auto-submit si le compte est déjà vérifié mais pas encore soumis
  useEffect(() => {
    if (currentStep === 3 && achData?.isVerified === true && !isFormSubmitted && !isCheckingSignature) {
      console.log('🚀 Account already verified, auto-submitting form...');
      submitForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, achData?.isVerified, isFormSubmitted, isCheckingSignature]);

  

  

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Ancienne fonction supprimée - remplacée par la nouvelle logique

  // État pour les messages snack
  const [snackMessage, setSnackMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Fonctions pour afficher les messages
  const showSuccessMessage = useCallback((message: string) => {
    console.log('🎉 showSuccessMessage called with:', message);
    setSnackMessage({type: 'success', message});
    console.log('🎉 snackMessage set to:', {type: 'success', message});
    setTimeout(() => {
      console.log('🎉 Clearing snackMessage after 3 seconds');
      setSnackMessage(null);
    }, 3000);
  }, []);
  
  const showErrorMessage = useCallback((message: string) => {
    setSnackMessage({type: 'error', message});
    setTimeout(() => setSnackMessage(null), 5000);
  }, []);

  // Handler pour les changements ACH avec message de succès et soumission automatique
  const handleACHChange = async (newAchData: typeof achData) => {
    console.log('🔍 handleACHChange called with:', newAchData);
    console.log('🔍 Current achData:', achData);
    
    const wasVerified = achData?.isVerified === true;
    const isNowVerified = newAchData?.isVerified === true;
    
    setACHData(newAchData);
    
    // Si la connexion bancaire vient d'être vérifiée
    if (isNowVerified && !wasVerified) {
      console.log('🎉 Showing success message for bank account connection');
      showSuccessMessage('🏦 Bank account connected successfully!');
      
      // Appeler automatiquement le webhook de soumission
      console.log('🚀 Auto-submitting form after bank account connection...');
      await submitForm();
    } else {
      console.log('🔍 No success message shown:', { isNowVerified, wasVerified });
    }
  };

  // Fonction pour soumettre le formulaire
  const submitForm = useCallback(async () => {
    try {
      console.log('🚀 Submitting form...');
      setIsCheckingSignature(true);
      
      const submitEndpoint = process.env.REACT_APP_CLOSING_FORM_SUBMIT_WEBHOOK;
      const hubspotDealId = process.env.REACT_APP_HUBSPOT_DEAL_ID;
      
      if (!submitEndpoint) {
        throw new Error('REACT_APP_CLOSING_FORM_SUBMIT_WEBHOOK endpoint not configured');
      }
      
      if (!hubspotDealId) {
        throw new Error('REACT_APP_HUBSPOT_DEAL_ID not configured');
      }
      
      console.log('📤 Calling submit endpoint:', submitEndpoint);
      console.log('📋 HubSpot Deal ID:', hubspotDealId);
      
      const response = await fetch(submitEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hubspotDealId: hubspotDealId,
          timestamp: new Date().toISOString(),
          formData: {
            contract: contractData,
            rr: rrData,
            ach: achData
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.text();
      console.log('✅ Submit response:', result);
      
      // Marquer la soumission comme effectuée
      setIsFormSubmitted(true);
      
      showSuccessMessage('✅ Form submitted successfully!');
      
      // Passer à l'étape suivante (page de succès)
      setCurrentStep(currentStep + 1);
      
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      showErrorMessage(`❌ Error submitting form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCheckingSignature(false);
    }
  }, [currentStep, contractData, rrData, achData, showSuccessMessage, showErrorMessage]);
  
  // Import des services de vérification
  const { makeDocuSignService } = require('../services/makeDocuSignService');
  
  // Fonction pour vérifier la signature du contrat
  const checkContractSignature = async (): Promise<boolean> => {
    try {
      const envelopeId = process.env.REACT_APP_FUTURE_PURCHASE_AGREEMENT_DOCUSIGN_ID;
      if (!envelopeId) return false;

      console.log('🔍 Checking contract signature status for envelope:', envelopeId);
      
      // Utiliser l'endpoint dédié pour vérifier le statut (forcer le refresh pour avoir le statut à jour)
      const result = await makeDocuSignService.getEnvelopeStatus(envelopeId, true); // forceRefresh = true

      console.log('🔍 Contract status response:', result);
      
      const resultAny = result as any;
      
      // Make.com filtre déjà le bon signer (client), on vérifie juste le statut
      const status = resultAny.status;
      const signedDateTime = resultAny.signedDateTime;
      
      console.log('📄 Client status from Make.com:', { status, signedDateTime });
      
      if (status) {
        const isCompleted = status === 'completed' || status === 'signed';
        
        if (isCompleted) {
          console.log('✅ Contract is completed by client!');
          setContractData({
            ...contractData,
            isSigned: true,
            signedAt: signedDateTime || new Date().toISOString(),
            status: 'completed'
          });
        } else {
          console.log('⏳ Contract not yet completed by client, status:', status);
        }
        
        return isCompleted;
      }
      
      console.log('⚠️ No status found in response');
      return false;
    } catch (error) {
      console.error('❌ Error checking contract signature:', error);
      return false;
    }
  };
  
  // Fonction pour vérifier la signature RR
  const checkRRSignature = async (): Promise<boolean> => {
    try {
      const envelopeId = process.env.REACT_APP_RR_DOCUSIGN_ID;
      if (!envelopeId) return false;

      console.log('🔍 Checking RR signature status for envelope:', envelopeId);
      
      // Utiliser l'endpoint dédié pour vérifier le statut (forcer le refresh pour avoir le statut à jour)
      const result = await makeDocuSignService.getEnvelopeStatus(envelopeId, true); // forceRefresh = true

      console.log('🔍 RR status response:', result);
      
      const resultAny = result as any;
      
      // Make.com filtre déjà le bon signer (client), on vérifie juste le statut
      const status = resultAny.status;
      const signedDateTime = resultAny.signedDateTime;
      
      console.log('📄 RR Client status from Make.com:', { status, signedDateTime });
      
      if (status) {
        const isCompleted = status === 'completed' || status === 'signed';
        
        if (isCompleted) {
          console.log('✅ RR Document is completed by client!');
          setRRData({
            ...rrData,
            isCompleted: true,
            completedAt: signedDateTime || new Date().toISOString(),
            status: 'completed'
          });
        } else {
          console.log('⏳ RR Document not yet completed by client, status:', status);
        }
        
        return isCompleted;
      }
      
      console.log('⚠️ No status found in RR response');
      return false;
    } catch (error) {
      console.error('❌ Error checking RR signature:', error);
      return false;
    }
  };

  // Fonction pour vérifier le statut de signature au clic Next
  const handleNextStep = async () => {
    console.log('🚀 handleNextStep called for step:', currentStep);
    
    if (currentStep === 1) {
      console.log('📄 Checking contract signature...');
      // Vérifier le statut du contrat avant de passer à l'étape suivante
      setIsCheckingSignature(true);
      try {
        const contractSigned = await checkContractSignature();
        console.log('📄 Contract signature result:', contractSigned);
        if (contractSigned) {
          showSuccessMessage('✅ Contract signed successfully!');
          setCurrentStep(2);
        } else {
          showErrorMessage('❌ Please sign the contract before proceeding.');
        }
      } catch (error) {
        console.error('❌ Error in handleNextStep:', error);
        showErrorMessage('❌ Error checking contract status. Please try again.');
      } finally {
        setIsCheckingSignature(false);
      }
    } else if (currentStep === 2) {
      console.log('📄 Checking RR signature...');
      // Vérifier le statut RR avant de passer à l'étape suivante
      setIsCheckingSignature(true);
      try {
        const rrSigned = await checkRRSignature();
        console.log('📄 RR signature result:', rrSigned);
        if (rrSigned) {
          showSuccessMessage('✅ RR Document signed successfully!');
          setCurrentStep(3);
        } else {
          showErrorMessage('❌ Please sign the RR document before proceeding.');
        }
      } catch (error) {
        console.error('❌ Error in handleNextStep RR:', error);
        showErrorMessage('❌ Error checking RR status. Please try again.');
      } finally {
        setIsCheckingSignature(false);
      }
    } else if (currentStep === 3) {
      console.log('📄 ACH step - submitting form...');
      // Si le compte est vérifié, soumettre le formulaire
      if (achData?.isVerified === true && !isFormSubmitted) {
        await submitForm();
      } else if (!achData?.isVerified) {
        showErrorMessage('❌ Please connect your bank account before submitting.');
      } else {
        console.log('📄 Form already submitted');
      }
    }
  };

  // Fonction pour vérifier si on peut passer à l'étape suivante
  const canProceedToNextStep = () => {
    // Le bouton Next est toujours activé, la vérification se fait au clic
    return true;
  };

  // Message du bouton simplifié
  const getNextButtonMessage = () => {
    return currentStep === 3 ? 'Submit' : 'Next';
  };

  // Message d'avertissement quand l'utilisateur clique sur un bouton désactivé
  const [warningMessage, setWarningMessage] = useState<string | null>(null);





  const stepTitles = () => {
    switch (currentStep) {
      case 1:
        return 'Contract';
      case 2:
        return 'RR';
      case 3:
        return 'ACH Direct Debit';
      default:
        return 'Closing Form';
    }
  };

  const renderStep = () => {
    console.log('🔍 MultiStepForm renderStep - currentStep:', currentStep);
    console.log('🔍 MultiStepForm renderStep - contractData:', contractData);
    console.log('🔍 MultiStepForm renderStep - contractData.isSigned:', contractData?.isSigned);
    console.log('🔍 MultiStepForm renderStep - canProceedToNextStep:', canProceedToNextStep());
    console.log('🔍 MultiStepForm renderStep - nextButtonMessage:', getNextButtonMessage());
    
    switch (currentStep) {
      case 1:
        return (
          <ContractStep 
            contractData={contractData}
            onContractChange={(data) => {
              console.log('🔍 Contract data received:', data);
              setContractData(data as typeof contractData);
            }}
            recipientEmail={formData.formData.personalInfo.email}
            recipientId='1'
          />
        );
      case 2:
        return (
          <RRStep 
            rrData={rrData}
            onRRChange={(data) => {
              console.log('🔍 RR data received:', data);
              setRRData(data as typeof rrData);
            }}
            recipientEmail={formData.formData.personalInfo.email}
            recipientId='1'
          />
        );
      case 3:
        return (
          <ACHDirectDebitStep 
            achData={achData}
            onACHChange={handleACHChange}
          />
        );
      default:
        return null;
    }
  };

  function DevToggle({ isDevelopment }: { isDevelopment: boolean }) {
    // 1. initialiser le state depuis localStorage (vaut true/false selon la chaîne stockée)
    const [disableValidation, setDisableValidation] = useState(() => {
      return localStorage.getItem('DISABLE_VALIDATION') === 'true' ? true : false;
    });
  
    // 2. synchroniser localStorage si le state change (optionnel, car on l'écrit déjà dans onChange)
    useEffect(() => {
      localStorage.setItem('DISABLE_VALIDATION', disableValidation.toString());
    }, [disableValidation]);
  
    if (!isDevelopment) return null;
  
    return (
      <div className="flex justify-center mt-4">
        <label className="flex items-center text-sm text-gray-600">
          <input
            type="checkbox"
            checked={disableValidation}
            onChange={(e) => {
              // 3. mettre à jour le state (ce qui force le re-render)
              setDisableValidation(e.target.checked);
              console.log("DISABLE_VALIDATION", e.target.checked);
            }}
            className="mr-2"
          />
          Disable step validation (dev mode only)
        </label>
      </div>
    );
  }
  
  return (
    <div className="flex flex-row animate-fade-in-right duration-1000 lg:w-[70%] xs:w-[100%] mx-auto h-full ">
      <main className="w-full h-full flex flex-col bg-white p-6">
        <div className="flex justify-center items-center">
          <img src={logo} alt="Logo" className="w-24 " />
        </div>

        <div className="min-h-screen bg-white py-8">
          {/* Progress Bar */}
          <div className="w-full mx-auto">
            <div className="relative w-[40%] mx-auto">
              <div className="rounded-xl absolute top-0 left-0 h-1 bg-gray-200 w-full"></div>
              <div
                className="rounded-xl absolute top-0 bg-gradient-to-r from-[#F99927] to-[#EF2A5F] left-0 h-1 transition-all duration-300"
                style={{ width: `${((currentStep) / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Title */}
          <div className="text-center my-8"> 
            <h2 className="text-2xl font-bold text-gray-800">{stepTitles()}</h2>
          </div>

          {/* Step Content */}
          <div className="w-full h-full">
            {renderStep()}
          </div>

          {/* Warning Message */}
          {warningMessage && (
            <div className="mt-4 mx-auto max-w-md">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg animate-pulse">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-orange-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-orange-800 font-medium text-sm">
                      {warningMessage}
                    </p>
                  </div>
                  <button
                    onClick={() => setWarningMessage(null)}
                    className="text-orange-500 hover:text-orange-700 ml-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Navigation Buttons */}
          <div className="flex mt-8 w-full justify-center gap-4">
            {currentStep !== 1 && (
              <ButtonSecondary
              onClick={handlePreviousStep}
              disabled={currentStep === 1}
            >
              Previous
            </ButtonSecondary>
            )}
        {/* Cacher le bouton Submit à l'étape 3 si le compte est vérifié et soumission déjà faite */}
        {!(currentStep === 3 && achData?.isVerified === true && isFormSubmitted) && (
          <ButtonPrimary
            onClick={handleNextStep}
            disabled={isCheckingSignature || !canProceedToNextStep()}
            className={(isCheckingSignature || !canProceedToNextStep()) ? '!bg-gray-500 !hover:bg-gray-600 !opacity-70 !cursor-not-allowed !from-gray-500 !to-gray-600' : ''}
          >
          {isCheckingSignature ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Checking...
            </div>
          ) : (
            getNextButtonMessage()
          )}
        </ButtonPrimary>
        )}
          </div>

          

          {saveMessage && (
            <div className={`mt-4 p-4 rounded-lg ${
              saveMessage.startsWith('Error') 
                ? 'bg-red-50 border border-red-200 text-red-800' 
                : 'bg-green-50 border border-green-200 text-green-800'
            }`}>
              {saveMessage}
            </div>
          )}

          <DevToggle isDevelopment={isDevelopment} />
        </div>
      </main>
        {/* Snack Message */}
        {snackMessage && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            snackMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {snackMessage.type === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">{snackMessage.message}</span>
            </div>
          </div>
        )}
    </div>
  );
};


const MultiStepForm: React.FC = () => {
  return <MultiStepFormContent />;
};

export default MultiStepForm;

