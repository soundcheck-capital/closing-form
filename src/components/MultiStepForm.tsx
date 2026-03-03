import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import logo from '../assets/logo_side_black.svg';
import ACHDirectDebitStep from './ACHDirectDebitStep';

type SnackMessage = { type: 'success' | 'error'; message: string };

type ACHData = {
  isVerified?: boolean;
  verifiedAt?: string;
  mandateId?: string;
  status?: string;
  financialConnectionsAccountId?: string;
};

const MultiStepForm: React.FC = () => {
  const navigate = useNavigate();
  const formState = useSelector((state: RootState) => state.form);
  const [achData, setACHData] = useState<ACHData>({ isVerified: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [snackMessage, setSnackMessage] = useState<SnackMessage | null>(null);
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    const disableSubmissionBlock = localStorage.getItem('DISABLE_SUBMISSION_BLOCK') === 'true';
    if (formState.isSubmitted && !isDevelopment && !disableSubmissionBlock) {
      navigate('/submit-success');
    }
  }, [formState.isSubmitted, isDevelopment, navigate]);

  const showSuccessMessage = useCallback((message: string) => {
    setSnackMessage({ type: 'success', message });
    setTimeout(() => setSnackMessage(null), 3000);
  }, []);

  const showErrorMessage = useCallback((message: string) => {
    setSnackMessage({ type: 'error', message });
    setTimeout(() => setSnackMessage(null), 5000);
  }, []);

  const submitForm = useCallback(async () => {
    try {
      setIsSubmitting(true);

      const submitEndpoint = process.env.REACT_APP_CLOSING_FORM_SUBMIT_WEBHOOK;
      const hubspotDealId = process.env.REACT_APP_HUBSPOT_DEAL_ID;

      if (!submitEndpoint) {
        throw new Error('REACT_APP_CLOSING_FORM_SUBMIT_WEBHOOK endpoint not configured');
      }

      if (!hubspotDealId) {
        throw new Error('REACT_APP_HUBSPOT_DEAL_ID not configured');
      }

      const response = await fetch(submitEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hubspotDealId,
          timestamp: new Date().toISOString(),
          formData: {
            ach: achData
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setIsFormSubmitted(true);
      navigate('/submit-success');
    } catch (error) {
      showErrorMessage(`Error submitting form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [achData, navigate, showErrorMessage]);

  const handleACHChange = useCallback(
    async (newAchData: ACHData) => {
      const wasVerified = achData.isVerified === true;
      const isNowVerified = newAchData.isVerified === true;

      setACHData(newAchData);

      if (isNowVerified && !wasVerified && !isFormSubmitted) {
        showSuccessMessage('Bank account connected successfully!');
        await submitForm();
      }
    },
    [achData.isVerified, isFormSubmitted, showSuccessMessage, submitForm]
  );

  useEffect(() => {
    if (achData.isVerified === true && !isFormSubmitted && !isSubmitting) {
      submitForm();
    }
  }, [achData.isVerified, isFormSubmitted, isSubmitting, submitForm]);

  return (
    <div className="flex flex-row animate-fade-in-right duration-1000 lg:w-[70%] xs:w-[100%] mx-auto h-full">
      <main className="w-full h-full flex flex-col bg-white p-6">
        <div className="flex justify-center items-center">
          <img src={logo} alt="Logo" className="w-48" />
        </div>

        <div className="min-h-screen bg-white py-8">
          <div className="text-center my-8">
            <h2 className="text-2xl font-bold text-gray-800">Bank Account Connection</h2>
            <p className="text-gray-600 mt-2">
              Connect your bank account through Stripe Financial Connections to complete this form.
            </p>
          </div>

          <div className="w-full h-full">
            <ACHDirectDebitStep achData={achData} onACHChange={handleACHChange} />
          </div>

          {isSubmitting && (
            <div className="mt-4 text-center text-gray-600">Submitting your information...</div>
          )}
        </div>
      </main>

      {snackMessage && (
        <div
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-md w-full mx-4 ${
            snackMessage.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center justify-center">
            <span className="font-medium text-center">{snackMessage.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiStepForm;
