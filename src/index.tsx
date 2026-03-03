import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Provider } from 'react-redux';
import { store } from './store';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MultiStepForm from './components/MultiStepForm';
import FormSubmissionGuard from './components/FormSubmissionGuard';
import reportWebVitals from './reportWebVitals';
import SubmitSuccess from './components/SubmitSuccess';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/form" replace />} />
          <Route
            path="/form"
            element={
              <FormSubmissionGuard>
                <MultiStepForm />
              </FormSubmissionGuard>
            }
          />
          <Route path="/submit-success" element={<SubmitSuccess />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

reportWebVitals();
