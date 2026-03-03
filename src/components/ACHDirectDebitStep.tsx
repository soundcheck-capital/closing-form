import React, { useState, useEffect, useRef } from 'react';
import { stripeFCAService } from '../services/stripeFCAService';

interface ACHDirectDebitStepProps {
  // Props pour la gestion des données ACH
  achData?: {
    isVerified?: boolean;
    verifiedAt?: string;
    mandateId?: string;
    status?: string;
    financialConnectionsAccountId?: string;
    customerInfo?: {
      fullName: string;
      companyName: string;
      email: string;
    };
    stripeSessionData?: any;
  };
  onACHChange?: (data: any) => void;
}

type CustomerInfo = {
  fullName: string;
  companyName: string;
  email: string;
};

declare global {
  interface Window {
    Stripe: any;
  }
}

const ACHDirectDebitStep: React.FC<ACHDirectDebitStepProps> = ({ 
  achData, 
  onACHChange 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: '',
    companyName: '',
    email: ''
  });
  const [touchedFields, setTouchedFields] = useState({
    fullName: false,
    companyName: false,
    email: false
  });
  const stripeRef = useRef<any>(null);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const customerInfoErrors = {
    fullName:
      customerInfo.fullName.trim().length < 2
        ? 'Please enter a valid full name.'
        : '',
    companyName:
      customerInfo.companyName.trim().length < 2
        ? 'Please enter a valid company name.'
        : '',
    email: emailPattern.test(customerInfo.email.trim())
      ? ''
      : 'Please enter a valid email address.'
  };
  const isCustomerInfoValid =
    !customerInfoErrors.fullName &&
    !customerInfoErrors.companyName &&
    !customerInfoErrors.email;

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerInfoBlur = (field: keyof CustomerInfo) => {
    setTouchedFields((prev) => ({
      ...prev,
      [field]: true
    }));
  };

  const toJsonSafe = (value: any) => {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  };


  // Surveiller les appels à l'endpoint Stripe complete
  useEffect(() => {
    const originalFetch = window.fetch;
    
    // Intercepter les appels fetch pour détecter l'endpoint complete
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Vérifier si c'est l'appel à l'endpoint complete de Stripe
      const url = args[0]?.toString() || '';
      if (url.includes('api.stripe.com/v1/link_account_sessions/complete')) {
        console.log('🎉 Stripe link_account_sessions/complete detected!');
        
        // Vérifier si la réponse est un succès
        if (response.ok) {
          console.log('✅ Bank account connection completed successfully via Stripe API');
          // La snackbar sera affichée par le parent via onACHChange
        }
      }
      
      return response;
    };
    
    // Nettoyer l'interception au démontage
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Charger Stripe au montage du composant (sans dépendre de FCA)
  useEffect(() => {
    const loadStripe = async () => {
      const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

      console.log('🔍 Stripe config check:', {
        hasPublishableKey: !!stripePublishableKey,
        publishableKeyPrefix: stripePublishableKey?.substring(0, 7),
        publishableKeyLength: stripePublishableKey?.length
      });

      if (!stripePublishableKey) {
        setError('Stripe API key is missing. Please check environment variables.');
        setIsLoading(false);
        return;
      }

      // Vérifier que c'est bien une clé publique
      if (!stripePublishableKey.startsWith('pk_')) {
        setError('Invalid Stripe key. Please use a publishable key (starts with pk_).');
        setIsLoading(false);
        return;
      }

      try {
        // Charger le script Stripe
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        script.onload = async () => {
          if (window.Stripe) {
            try {
              stripeRef.current = window.Stripe(stripePublishableKey);
              setStripeLoaded(true);
              console.log('✅ Stripe loaded successfully');
              
              // Petit délai pour s'assurer que Stripe est complètement initialisé
              await new Promise(resolve => setTimeout(resolve, 100));
              
              setIsLoading(false);
              console.log('✅ Stripe initialization complete');
            } catch (err) {
              console.error('❌ Error initializing Stripe:', err);
              setError('Failed to initialize Stripe.');
              setIsLoading(false);
            }
          }
        };
        script.onerror = () => {
          setError('Failed to load Stripe. Please check your internet connection.');
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } catch (err) {
        setError('Failed to initialize Stripe.');
        setIsLoading(false);
      }
    };

    loadStripe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Charger Stripe une seule fois au montage

  const startFinancialConnections = async () => {
    if (!stripeRef.current) {
      setError('Stripe not loaded. Please try again.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    // TOUJOURS charger une nouvelle session FCA au clic
    try {
      console.log('🔄 Loading fresh FCA data on button click...');
      const result = await stripeFCAService.getFCAData();
      
      if (!result.success || !result.data) {
        setError(result.error || 'Failed to load Financial Connections session');
        setIsConnecting(false);
        return;
      }

      const sessionData = result.data;
      const sessionSecret = result.data.fcsess_client_secret;
      
      console.log('✅ FCA data loaded successfully:', sessionData);
      console.log('🔄 Starting Financial Connections with FCA session...');
      console.log('📄 Using session data:', {
        sessionId: sessionData?.sessionId,
        permissions: sessionData?.permissions,
        clientSecretPrefix: sessionSecret?.substring(0, 20) + '...',
        clientSecretLength: sessionSecret?.length,
        clientSecretFull: sessionSecret
      });
      
      // Vérification finale avant l'appel Stripe
      if (!sessionSecret || !sessionSecret.startsWith('fcsess_client_secret_')) {
        setError(`Invalid client secret format: ${sessionSecret}`);
        setIsConnecting(false);
        return;
      }

      console.log('🚀 Calling Stripe collectFinancialConnectionsAccounts with:', {
        clientSecret: sessionSecret,
        stripeLoaded: !!stripeRef.current,
        stripeVersion: stripeRef.current?.version,
        sessionPermissions: sessionData?.permissions,
        sessionFilters: sessionData?.filters
      });

      const stripe = stripeRef.current;
      const stripeResult = await stripe.collectFinancialConnectionsAccounts({
        clientSecret: sessionSecret,
      });

      if (stripeResult.error) {
        console.error('❌ Stripe Financial Connections Error:', {
          error: stripeResult.error,
          errorType: stripeResult.error.type,
          errorCode: stripeResult.error.code,
          errorMessage: stripeResult.error.message,
          clientSecret: sessionSecret,
          sessionId: sessionData?.sessionId
        });
        setError(`Error: ${stripeResult.error.message}`);
        setIsConnecting(false);
        return;
      }

      // Vérifier si l'utilisateur a vraiment connecté un compte
      console.log("✅ FC Session completed:", stripeResult.financialConnectionsSession);
      
      const session = stripeResult.financialConnectionsSession;
      
      // Vérifier différentes structures possibles pour les comptes
      const accounts = 
        session?.accounts?.data || 
        session?.accounts || 
        (session?.accounts && Array.isArray(session.accounts) ? session.accounts : []) ||
        [];
      
      console.log("🔍 Accounts found:", accounts.length, accounts);
      console.log("🔍 Full session structure:", JSON.stringify(session, null, 2));

      // Vérifier aussi le statut de la session
      const sessionStatus = session?.status;
      const sessionId = session?.id;
      console.log("🔍 Session status:", sessionStatus);
      console.log("🔍 Session ID:", sessionId);

      // Seulement marquer comme vérifié si on a RÉELLEMENT des comptes connectés
      // Pas de fallback avec sessionId - si pas de comptes, c'est que l'utilisateur a annulé
      if (accounts.length > 0) {
        const fcaId = accounts[0]?.id || accounts[0];
        
        // Vérifier que l'ID du compte existe vraiment et est un vrai compte (commence par 'fca_')
        // Les session IDs commencent par 'fcsess_', les comptes par 'fca_'
        if (!fcaId || fcaId === sessionId || !fcaId.toString().startsWith('fca_')) {
          console.log("⚠️ Account ID is invalid or same as session ID");
          console.log("⚠️ Account ID:", fcaId, "Session ID:", sessionId);
          console.log("⚠️ User likely closed modal without connecting");
          setError('Connection cancelled. Please click "Connect Bank Account" to try again.');
          return;
        }
        
        console.log("✅ Financial Connections Account connected:", fcaId);
        
        console.log("🎉 Bank account connection process completed!");
        
        // Nettoyer l'erreur si elle existait
        setError(null);
        
        // Mettre à jour les données ACH immédiatement
        if (onACHChange) {
          const achDataToSend = {
            isVerified: true,
            verifiedAt: new Date().toISOString(),
            mandateId: `mandate_${Date.now()}`,
            status: 'completed',
            financialConnectionsAccountId: fcaId,
            customerInfo,
            stripeSessionData: {
              stripeResult: toJsonSafe(stripeResult),
              financialConnectionsSession: toJsonSafe(session),
              accounts: toJsonSafe(accounts),
              sessionStatus: sessionStatus,
              fcaBootstrapData: toJsonSafe(sessionData)
            }
          };
          console.log('🏦 ACH Sending to parent (onACHChange):', achDataToSend);
          onACHChange(achDataToSend);
        }
        
        // Success message will be handled by parent component via onACHChange
        console.log("✅ Bank account connected successfully!");
      } else {
        // Pas de comptes connectés = l'utilisateur a fermé la modal ou annulé
        console.log("⚠️ No accounts found in Financial Connections session");
        console.log("⚠️ Session data:", session);
        console.log("⚠️ User likely closed the modal without connecting");
        
        // Message d'erreur non-bloquant (le bouton reste visible pour réessayer)
        setError('Connection cancelled. Please click "Connect Bank Account" to try again.');
        
        // Ne pas marquer comme vérifié si aucun compte n'est connecté
        // Ne pas appeler onACHChange ici
      }
    } catch (error) {
      setError('Failed to connect bank account. Please try again.');
      console.error('Financial Connections error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Debug logs pour voir les données reçues
  console.log('🔍 ACHDirectDebitStep render - achData:', achData);
  console.log('🔍 ACHDirectDebitStep render - isVerified:', achData?.isVerified);

  return (
    <div className="w-full h-full flex flex-col ">
      {/* Verification Status */}
      {achData?.isVerified && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="text-green-800 font-medium">
                Bank account connected on {achData.verifiedAt ? new Date(achData.verifiedAt).toLocaleDateString() : 'Unknown date'}
              </span>
             
             
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Loading Status */}
      {isLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800 font-medium">Loading Stripe...</span>
          </div>
        </div>
      )}

      {/* Main Content - LOGIQUE SIMPLIFIÉE */}
      <div className="flex-1 rounded-lg overflow-hidden min-h-[300px]">
        
        {/* CASE 1: Compte vérifié (isVerified = true) */}
        {achData?.isVerified ? (
          <div className="flex items-center p-4 justify-center h-full bg-green-50">
            <div className="text-center max-w-md">
              <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-semibold text-green-800 mb-2">Bank Account Connected!</h3>
              <p className="text-green-700 mb-4">Your bank account has been successfully connected.</p>
              <p className="text-green-700 text-sm">You can now proceed to submit the form.</p>
             
            </div>
          </div>
        ) : 
        
        /* CASE 2: Connexion en cours ou prête */
        (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Loading Stripe...
                  </h3>
                  <p className="text-gray-600">
                    Initializing secure payment processing...
                  </p>
                </>
              ) : error && (error.includes('missing') || error.includes('Invalid Stripe key') || error.includes('Failed to load Stripe')) ? (
                <>
                  <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Configuration Error</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                </>
              ) : (
                <>
                  <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Bank Account</h3>
                  <p className="text-gray-600 mb-6">
                    Securely connect your bank account using Stripe Financial Connections.
                  </p>
                  <div className="space-y-4 mb-6 text-left">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={customerInfo.fullName}
                        onChange={(e) => handleCustomerInfoChange('fullName', e.target.value)}
                        onBlur={() => handleCustomerInfoBlur('fullName')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="John Doe"
                      />
                      {touchedFields.fullName && customerInfoErrors.fullName && (
                        <p className="mt-1 text-xs text-red-600">{customerInfoErrors.fullName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={customerInfo.companyName}
                        onChange={(e) => handleCustomerInfoChange('companyName', e.target.value)}
                        onBlur={() => handleCustomerInfoBlur('companyName')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Acme Inc."
                      />
                      {touchedFields.companyName && customerInfoErrors.companyName && (
                        <p className="mt-1 text-xs text-red-600">{customerInfoErrors.companyName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                        onBlur={() => handleCustomerInfoBlur('email')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="john@company.com"
                      />
                      {touchedFields.email && customerInfoErrors.email && (
                        <p className="mt-1 text-xs text-red-600">{customerInfoErrors.email}</p>
                      )}
                    </div>
                    {!isCustomerInfoValid && (
                      <p className="text-xs text-gray-500">
                        Fill in full name, company name, and a valid email to enable bank connection.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setError(null); // Nettoyer l'erreur avant de recommencer
                      setTouchedFields({
                        fullName: true,
                        companyName: true,
                        email: true
                      });
                      startFinancialConnections();
                    }}
                    disabled={!stripeLoaded || isConnecting || !isCustomerInfoValid}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 font-medium"
                  >
                    {isConnecting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Connecting...
                      </div>
                    ) : (
                      'Connect Bank Account'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>


      {/* {/* Security Notice *
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Security Notice</h4>
            <p className="text-yellow-700 text-sm">
              Your banking information is encrypted and securely transmitted. We use industry-standard security measures to protect your data.
            </p>
          </div>
        </div>
      </div> */}

      {/* Debug Info (Development only) */}
     {/*    {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 border rounded-lg">
            <h4 className="font-medium mb-2">ACH Debug Info:</h4>
            <pre className="text-xs text-gray-600">
              {JSON.stringify({
                achVerified: achData?.isVerified,
                achStatus: achData?.status,
                stripeLoaded,
                isLoading,
                error,
                hasPublishableKey: !!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
                hasClientSecret: !!process.env.REACT_APP_FC_SESSION_CLIENT_SECRET
              }, null, 2)}
            </pre>
          </div>
        )} */}
    </div>
  );
};

export default ACHDirectDebitStep;
