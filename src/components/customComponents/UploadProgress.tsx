import React from 'react';

interface UploadProgressProps {
  progress: number;
  isVisible: boolean;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Envoi en cours...
          </h3>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progression</span>
              <span>{progress}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Veuillez patienter pendant l'envoi de votre demande...
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadProgress; 