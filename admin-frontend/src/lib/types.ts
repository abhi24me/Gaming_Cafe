
// Admin Specific Types
export interface AdminUserDetails {
  id: string;
  username: string;
  email?: string; 
  phoneNumber?: string;
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
  requestedAt: string; 
  reviewedBy?: {
    _id: string;
    username: string;
  } | null;
  reviewedAt?: string; 
  adminNotes?: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: { field: string; message: string }[];
}

export interface PriceOverride {
  _id?: string; 
  daysOfWeek: number[]; 
  startTimeUTC: string; 
  endTimeUTC: string;   
  price: number;
}

export interface ScreenWithPricing {
  _id: string;
  name: string;
  description?: string;
  imagePlaceholderUrl: string;
  imageAiHint: string;
  basePrice: number;
  priceOverrides: PriceOverride[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
