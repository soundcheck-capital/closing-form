import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { fetchApplicationById } from '../store/auth/authThunks';
import logo from '../assets/logo_black_bold.svg';
import ButtonSecondary from './customComponents/ButtonSecondary';
import ButtonPrimary from './customComponents/ButtonPrimary';



const MultiStepFormContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const formData = useSelector((state: RootState) => state.form);
  const [saveMessage] = useState('');

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

  

  

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };



  const stepTitles = () => {
    switch (currentStep) {
      case 1:
        return 'Contract';
      case 2:
        return 'RRR';
      case 3:
        return 'ACH Direct Debit';
      default:
        return 'Closing Form';
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ContractStep />;
      case 2:
        return <RRRStep />;
      case 3:
        return <ACHDirectDebitStep />;
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

          {/* Navigation Buttons */}
          <div className="flex mt-8 w-full justify-center gap-4">
            <ButtonSecondary
              onClick={handlePreviousStep}
              disabled={currentStep === 1}
            >
              Previous
            </ButtonSecondary>
            <ButtonPrimary
              onClick={handleNextStep}
              disabled={false}
            >
              {currentStep === 3 ? 'Submit' : 'Next'}
            </ButtonPrimary>
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
    </div>
  );
};

// Contract Step Component
const ContractStep: React.FC = () => {
  return (
    <div className="w-full h-full">
      <iframe
        src=""
        className="w-full h-full border border-gray-300 rounded-lg"
        title="Contract Document"
      />
    </div>
  );
};

// RRR Step Component
const RRRStep: React.FC = () => {
  return (
    <div className="w-full h-full">
      <iframe
        src=""
        className="w-full h-full border border-gray-300 rounded-lg"
        title="RRR Document"
      />
    </div>
  );
};

// ACH Direct Debit Step Component
const ACHDirectDebitStep: React.FC = () => {
  return (
    <div className="w-full h-full">
      <iframe
        src=""
        className="w-full h-full border border-gray-300 rounded-lg"
        title="ACH Direct Debit Form"
      />
    </div>
  );
};

const MultiStepForm: React.FC = () => {
  return <MultiStepFormContent />;
};

export default MultiStepForm;

