import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PasswordProtection from './PasswordProtection';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    const authenticated = localStorage.getItem('formAuthenticated') === 'true';
    setIsAuthenticated(authenticated);
  }, [location]);

  // Afficher un loader pendant la vérification
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  // Si authentifié, afficher le contenu protégé
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Sinon, afficher la page de protection par mot de passe
  return <PasswordProtection />;
};

export default ProtectedRoute; 