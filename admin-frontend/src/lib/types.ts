
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
  // upiTransactionId?: string; // Backend model doesn't have this, ensure consistency
  receiptData?: { type: 'Buffer'; data: number[] }; // How Buffer is often serialized
  receiptMimeType?: string;
  // receiptImageUrl is NOT sent by the backend with the pending list directly
  requestedAt: string; // ISO date string
  reviewedBy?: string; // Admin ID
  reviewedAt?: string; // ISO date string
  adminNotes?: string;
}

// General API Error structure (can be shared or admin-specific)
export interface ApiErrorResponse {
  message: string;
  errors?: { field: string; message: string }[];
}
