import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Provider } from 'react-redux';
import { store } from './store';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MultiStepForm from './components/MultiStepForm';
import PasswordProtection from './components/PasswordProtection';
import ProtectedRoute from './components/ProtectedRoute';
import SubmitSuccess from './components/SubmitSuccess';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const RootRedirect: React.FC = () => {
  const location = useLocation();

  return <Navigate to={`/form${location.search}`} replace />;
};

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<PasswordProtection />} />
          <Route
            path="/form"
            element={
              <ProtectedRoute>
                <MultiStepForm />
              </ProtectedRoute>
            }
          />
          <Route path="/submit-success" element={<SubmitSuccess />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
