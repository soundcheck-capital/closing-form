import { configureStore } from '@reduxjs/toolkit';
import formReducer from './form/formSlice';
import authReducer from './auth/authSlice';
export const store = configureStore({
  reducer: {
    form: formReducer,
    auth: authReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 