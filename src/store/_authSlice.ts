import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Define the API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Set up axios with credentials
axios.defaults.withCredentials = true;

// Application interface
interface Application {
  id: string;
  name: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Define interface for auth state
interface AuthState {
  user: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  applications: Application[];
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
  applications: []
};

// Login thunk
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      console.log('response', response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Register thunk
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: { email: string; password: string; lastname: string; firstname: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

// Logout thunk
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    localStorage.removeItem('token');
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    }
    return null;
  }
);

// Fetch user profile
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState };
      console.log('auth', auth);
      const config = {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/users/${auth.user?.id}`, config);
      console.log('response', response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile');
    }
  }
);

// Fetch user's saved application
export const fetchUserApplication = createAsyncThunk(
  'auth/fetchUserApplication',
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState() as { auth: AuthState };
      
      const config = {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/applications/current`, config);
      
      // If we have a saved application, update the form data in the formSlice
      if (response.data) {
        dispatch({ type: 'form/loadSavedApplication', payload: response.data });
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch saved application');
    }
  }
);

// Save current application
export const saveApplication = createAsyncThunk(
  'auth/saveApplication',
  async (formData: any, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState };
      
      const config = {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      };
      
      const response = await axios.post(`${API_URL}/applications/update`, { formData }, config);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save application');
    }
  }
);

// Fetch user's applications
export const fetchApplications = createAsyncThunk(
  'auth/fetchApplications',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState };
      
      const config = {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/applications/all`, config);
      
      // Ensure we always return an array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      return []; // Return empty array on error instead of rejecting
    }
  }
);

// Fetch application by ID
export const fetchApplicationById = createAsyncThunk(
  'auth/fetchApplicationById',
  async (id: string, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState() as { auth: AuthState };
      
      const config = {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/applications/${id}`, config);
      
      // If we have application data, update the form data
      if (response.data) {
        dispatch({ type: 'form/loadSavedApplication', payload: response.data });
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch application');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      console.log('Thunk réussi');

      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = {
        id: action.payload.userId,
        email: action.payload.email,
        firstname: action.payload.first_name,
        lastname: action.payload.last_name
      }
      console.log('state.user', state.user);
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.applications = [];
    });
    
    // Fetch user profile
    builder.addCase(fetchUserProfile.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchUserProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.user = {
        id: action.payload.id,
        email: action.payload.email,
        firstname: action.payload.first_name,
        lastname: action.payload.last_name
      }
    });
    builder.addCase(fetchUserProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.isAuthenticated = false;
      state.token = null;
      localStorage.removeItem('token');
    });
    
    // Fetch applications
    builder.addCase(fetchApplications.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchApplications.fulfilled, (state, action) => {
      state.loading = false;
      state.applications = action.payload || [];
    });
    builder.addCase(fetchApplications.rejected, (state) => {
      state.loading = false;
      state.applications = [];
    });
  }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer; 