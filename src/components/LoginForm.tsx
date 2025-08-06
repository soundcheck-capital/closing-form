import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { loginUser, registerUser, fetchUserApplication, fetchUserProfile } from '../store/auth/authThunks';
import { AppDispatch } from '../store';

interface LoginFormProps {
  onClose?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  const validateForm = () => {
    if (!email || !password) {
      setError('Please fill in all required fields');
      return false;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      
     
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const result = await dispatch(loginUser({ email, password }));
        if (result.payload?.token) {
          dispatch(fetchUserProfile());
          // Fetch user's saved application if available
          dispatch(fetchUserApplication(result.payload.id));
          // Redirect to dashboard
          navigate('/dashboard');
          // Call onClose if it exists
          if (onClose) onClose();
        } else {
          setError('Invalid login credentials');
        }
      } else {
        const result = await dispatch(registerUser({ email, password, lastname, firstname }));
        if (result.payload?.token) {
            setEmail(result.payload.email);
            setId(result.payload.id);
          // Redirect to dashboard
          navigate('/dashboard');
          // Call onClose if it exists
          if (onClose) onClose();
        } else {
          setError('Registration failed. This email might already be in use.');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
        <h1>Closing Form</h1>
      <h2 className='auth-title'>{mode === 'login' ? 'Welcome back!' : "Let's create your account"}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
          
        <div className="form-group-login">
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="form-control-login"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group-login">
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            className="form-control-login"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {mode === 'register' && (
          <>
            <div className="form-group-login">
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                className="form-control-login"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group-login">

            <input
            id="firstname"
            type="text"
            placeholder="Enter your first name"
            className="form-control-login"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            required
          />
        </div>
        <div className="form-group-login">
          <input
            id="lastname"
            type="text"
            placeholder="Enter your last name"
            className="form-control-login"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            required
          />
        </div>
          
          </>
        )}
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary-pink" 
            disabled={loading}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </div>
      </form>
      
      <div className="login-toggle">
        {mode === 'login' ? (
          <p>Don't have an account? <button type="button" onClick={toggleMode}>Register</button></p>
        ) : (
          <p>Already have an account? <button type="button" onClick={toggleMode}>Login</button></p>
        )}
      </div>
    </div>
  );
};

export default LoginForm; 