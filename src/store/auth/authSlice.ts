import { createSlice } from "@reduxjs/toolkit";
import { initialState } from "./initialAuthState";
import { loginUser, registerUser, logoutUser, fetchUserProfile, fetchApplications } from "./authThunks";

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