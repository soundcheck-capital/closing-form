import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PasswordProtection from './PasswordProtection';
import { getCompanyNameFromUrl } from '../utils/urlParams';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const companyNameInUrl = getCompanyNameFromUrl();

    if (!companyNameInUrl) {
      setIsAuthenticated(true);
      return;
    }

    const authenticated = localStorage.getItem('formAuthenticated') === 'true';
    setIsAuthenticated(authenticated);
  }, [location]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <PasswordProtection onAuthenticated={() => setIsAuthenticated(true)} />;
};

export default ProtectedRoute;
