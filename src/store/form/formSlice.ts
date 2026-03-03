import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FormState } from './formTypes';
import { initialState } from './initialFormState';

const saveToLocalStorage = (state: FormState) => {
  try {
    localStorage.setItem(
      'closingFormData',
      JSON.stringify({
        formData: state.formData,
        diligenceInfo: state.diligenceInfo,
        currentStep: state.currentStep
      })
    );
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const loadFromLocalStorage = (): Partial<FormState> | null => {
  try {
    const saved = localStorage.getItem('closingFormData');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

const formSlice = createSlice({
  name: 'form',
  initialState: (() => {
    const savedData = loadFromLocalStorage();

    if (savedData) {
      return {
        ...initialState,
        ...savedData,
        isSubmitted: false
      };
    }

    return initialState;
  })(),
  reducers: {
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
      saveToLocalStorage(state);
    },
    updatePersonalInfo: (state, action: PayloadAction<Partial<FormState['formData']>>) => {
      state.formData = { ...state.formData, ...action.payload };
      saveToLocalStorage(state);
    },
    updateCompanyInfo: (state, action: PayloadAction<Partial<FormState['formData']['companyInfo']>>) => {
      state.formData.companyInfo = { ...state.formData.companyInfo, ...action.payload };
      saveToLocalStorage(state);
    },
    updateFundsInfo: (state, action: PayloadAction<Partial<FormState['formData']['fundsInfo']>>) => {
      state.formData.fundsInfo = { ...state.formData.fundsInfo, ...action.payload };
      saveToLocalStorage(state);
    },
    updateOwnershipInfo: (state, action: PayloadAction<Partial<FormState['formData']['ownershipInfo']>>) => {
      state.formData.ownershipInfo = { ...state.formData.ownershipInfo, ...action.payload };
      saveToLocalStorage(state);
    },
    updateFinancesInfo: (state, action: PayloadAction<Partial<FormState['formData']['financesInfo']>>) => {
      state.formData.financesInfo = { ...state.formData.financesInfo, ...action.payload };
      saveToLocalStorage(state);
    },
    updateDiligenceInfo: (state, action: PayloadAction<Partial<FormState['diligenceInfo']>>) => {
      state.diligenceInfo = { ...state.diligenceInfo, ...action.payload };
      saveToLocalStorage(state);
    },
    loadSavedApplication: (state, action) => {
      const newState = {
        ...state,
        currentStep: action.payload.currentStep || 0,
        formData: action.payload.formData || initialState.formData,
        diligenceInfo: action.payload.diligenceInfo || initialState.diligenceInfo
      };
      saveToLocalStorage(newState);
      return newState;
    },
    clearFormData: () => {
      localStorage.removeItem('closingFormData');
      return initialState;
    },
    setSubmitted: (state) => {
      state.isSubmitted = true;
      saveToLocalStorage(state);
    },
    resetSubmitted: (state) => {
      state.isSubmitted = false;
      localStorage.removeItem('closingFormData');
    }
  }
});

export const {
  setCurrentStep,
  updatePersonalInfo,
  updateCompanyInfo,
  updateFundsInfo,
  updateOwnershipInfo,
  updateFinancesInfo,
  updateDiligenceInfo,
  loadSavedApplication,
  clearFormData,
  setSubmitted,
  resetSubmitted
} = formSlice.actions;

export default formSlice.reducer;
