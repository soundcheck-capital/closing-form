import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo_white_bold.svg';
import background from '../assets/background.jpeg';
import { getCompanyNameFromUrl } from '../utils/urlParams';

interface PasswordProtectionProps {
  onAuthenticated?: () => void;
}

const PasswordProtection: React.FC<PasswordProtectionProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const onChangePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextPassword = event.target.value;

    if (nextPassword.length > 0) {
      if (nextPassword.trim() === '') {
        setError('Password cannot be empty or contain only spaces');
      } else if (nextPassword.length < 6) {
        setError('Password must be at least 6 characters long');
      } else {
        setError('');
      }
    } else {
      setError('');
    }

    setPassword(nextPassword);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const companyName = getCompanyNameFromUrl();
      const webhookUrl = process.env.REACT_APP_CHECK_PASSWORD_CUSTOMER_LINK_WEBHOOK?.trim();

      if (!webhookUrl) {
        setError('Configuration error. Please contact support.');
        return;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, password })
      });

      if (!response.ok) {
        setError('Incorrect password');
        return;
      }

      const data = await response.json();
      const isValid =
        data === true ||
        data === 'true' ||
        data?.valid === true ||
        data?.success === true ||
        data?.isPasswordValid === true;

      if (!isValid) {
        setError('Incorrect password');
        return;
      }

      localStorage.setItem('formAuthenticated', 'true');

      if (onAuthenticated) {
        onAuthenticated();
      }

      navigate({
        pathname: '/form',
        search: location.search
      });
    } catch (submitError) {
      setError('An error occurred. Please try again.');
      console.error('Password verification error:', submitError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cover bg-center bg-black/50 bg-blend-overlay"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src={logo} alt="SoundCheck" className="h-24 w-auto" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Access Required</h2>
        <p className="mt-2 text-center text-sm text-white">
          Please enter your password to access the application form
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();

              if (!error) {
                void handleSubmit(event);
              }
            }}
          >
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  data-testid="password-input"
                  id="password"
                  name="password"
                  type="password"
                  title="Please enter the password to access the application form"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                  placeholder="Enter password"
                  value={password}
                  onChange={onChangePassword}
                />
              </div>
            </div>

            {error && <div className="text-xs text-red-600">{error}</div>}

            <div>
              <button
                data-testid="password-submit"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Access Form'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordProtection;
