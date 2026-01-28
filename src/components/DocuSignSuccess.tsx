import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logo from '../assets/logo_white_bold.svg';
import background from '../assets/background.jpeg';

const DocuSignSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Récupérer le type de document depuis les paramètres URL (optionnel)
  const documentType = searchParams.get('type') || 'document';
  //const envelopeId = searchParams.get('event') || '';
  
  // Rediriger vers le formulaire après 3 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/form');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

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
            {getDocumentName()} Signed Successfully!
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6 text-lg">
            Thank you for signing the {getDocumentName().toLowerCase()}. 
            You will be redirected back to the form shortly.
          </p>

          {/* Loading indicator */}
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mr-3"></div>
            <span className="text-gray-500 text-sm">Redirecting...</span>
          </div>
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
