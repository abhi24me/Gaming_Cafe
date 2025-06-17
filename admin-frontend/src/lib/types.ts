
// Admin Specific Types
export interface AdminUserDetails {
  id: string;
  username: string;
}

export interface AdminLoginResponse {
  token: string;
  admin: AdminUserDetails;
  message?: string;
}

export interface AdminAuthState {
  adminUser: AdminUserDetails | null;
  adminToken: string | null;
  isAdminAuthenticated: boolean;
  isLoadingAdminAuth: boolean;
  adminLogin: (username: string, password?: string) => Promise<void>;
  adminLogout: () => void;
}

// TopUpRequest structure as expected from backend for the admin panel
export interface TopUpRequestFromAPI {
  _id: string;
  user: { 
    _id: string;
    gamerTag: string;
    email: string;
  };
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: string;
  receiptData?: { type: 'Buffer'; data: number[] }; 
  receiptMimeType?: string;
  requestedAt: string; // ISO date string
  reviewedBy?: { // Now expecting an object if populated
    _id: string;
    username: string;
  } | null; // Can be null if not reviewed yet or if population fails
  reviewedAt?: string; // ISO date string
  adminNotes?: string;
}

// General API Error structure (can be shared or admin-specific)
export interface ApiErrorResponse {
  message: string;
  errors?: { field: string; message: string }[];
}
    