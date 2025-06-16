
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
// This should match what your /api/admin/topup-requests/pending endpoint returns for each request
export interface TopUpRequestFromAPI {
  _id: string;
  user: { // Assuming backend populates user details
    _id: string;
    gamerTag: string;
    email: string;
    // any other user fields you need
  };
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: string;
  // upiTransactionId?: string; // If collected and sent by backend
  receiptData?: any; // This will be true if backend sends raw buffer in JSON, which is not ideal.
                     // Better to have a URL to fetch the image, e.g., receiptImageUrl
  receiptMimeType?: string;
  // receiptImageUrl?: string; // IDEAL: Backend provides a URL to view the image
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
