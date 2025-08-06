
  export interface Application {
    id: string;
    name: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
  }
  
  // Define interface for auth state
  export interface AuthState {
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