import React from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { resetSubmitted } from '../store/form/formSlice';
import logo from '../assets/logo_white_bold.svg';
import { useNavigate } from 'react-router-dom';
import background from '../assets/background.jpeg';

const SubmitSuccess: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isDevelopment = process.env.NODE_ENV === 'development';
  const navigate = useNavigate();
  const handleReset = () => {
    dispatch(resetSubmitted());
      navigate('/form');
  };



  return (
    <div className="min-h-screen  flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cover bg-center bg-black/50 bg-blend-overlay" style={{ backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center', }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img 
            src={logo} 
            alt="Closing Form" 
            className="h-24 w-auto  "
          />
        </div>
        <div className='flex flex-col items-center justify-center gap-4'>
          <h1 className='text-2xl font-bold text-white mt-4 text-center'>Contract signed successfully!</h1>
          
          {/* Development Mode Reset Button */}
          {  isDevelopment && localStorage.getItem('DISABLE_SUBMISSION_BLOCK') === 'true' && (
            <button
              onClick={handleReset}
              className="mt-4 px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 f "
            >
              Reset & Return to Form (Dev Mode)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 

export default SubmitSuccess; 