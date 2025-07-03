
export interface TimeSlot {
  _id?: string; 
  id: string; 
  time: string; 
  isAvailable: boolean;
  price?: number; 
  startTimeUTC?: string; 
  endTimeUTC?: string;   
}

export interface Screen {
  _id: string; 
  id?: string; 
  name: string;
  icon?: React.ElementType; 
  imagePlaceholderUrl: string;
  imageAiHint: string;
  description?: string;
  features?: string[];
  isActive?: boolean; 
}

export interface Booking {
  _id: string; 
  id?: string; 
  user?: string; 
  screen: Screen | string | null; 
  screenName?: string; 
  date?: string; 
  timeSlot?: string; 
  startTime: string; 
  endTime: string;   
  gamerTagAtBooking?: string; 
  bookedAt: string; 
  status: 'upcoming' | 'completed' | 'cancelled' | 'active'; 
  pricePaid: number;
}


export interface Transaction {
  _id: string; 
  id?: string; 
  user?: string; 
  type: 'top-up' | 'booking-fee' | 'refund' | 'topup-request' | 'loyalty-redemption'; 
  amount: number;
  description: string;
  date?: string; 
  timestamp: string; 
  walletBalanceBefore?: number;
  walletBalanceAfter?: number;
  loyaltyPointsChange?: number;
  loyaltyPointsBalanceBefore?: number;
  loyaltyPointsBalanceAfter?: number;
  relatedBooking?: string; 
  relatedTopUpRequest?: string; 
  status?: 'pending' | 'approved' | 'rejected'; // Added to accommodate top-up request statuses
  paymentMethod?: string; 
  transactionId?: string; 
  adminNotes?: string; // For rejected top-up requests
  reviewedBy?: string; 
  reviewedAt?: string; 
  receiptData?: Buffer; 
  receiptMimeType?: string; 
}


export interface WalletState {
  balance: number;
  transactions: Transaction[];
  loyaltyPoints: number;
  isLoading: boolean;
  fetchWalletData: () => Promise<void>;
  requestTopUp: (amount: number, receiptFile: File) => Promise<void>;
  redeemLoyaltyPoints: () => Promise<void>;
}


export interface AuthState {
  gamerTag: string | null;
  isAuthenticated: boolean;
  userToken: string | null; 
  isLoadingAuth: boolean;
  login: (emailOrGamerTag: string, password?: string) => Promise<void>; 
  logout: () => void;
  updateGamerTag: (newTag: string) => void; 
  signup: (gamerTagInput: string, emailInput: string, passwordInput: string, phoneInput?: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
}

export interface UserProfile { 
    _id: string;
    gamerTag: string;
    email: string;
    phoneNumber?: string;
    walletBalance: number;
    loyaltyPoints: number;
    createdAt: string; 
    updatedAt: string; 
}

export interface WalletData { 
    balance: number;
    loyaltyPoints: number;
}

export interface ScreenAvailabilityResponse {
  screenName: string;
  date: string;
  slots: TimeSlot[];
}

export interface BookingCreationResponse {
  message: string;
  booking: Booking; 
  transaction: Transaction; 
  newBalance: number;
  newLoyaltyPoints: number;
}

// Admin Specific Types - These are used by the admin frontend
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

export interface TopUpRequestFromAPI { // For Admin frontend
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
