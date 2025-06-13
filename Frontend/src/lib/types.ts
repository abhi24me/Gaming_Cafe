
export interface TimeSlot {
  id: string; // For frontend key purposes, may differ from backend slot ID
  time: string; // e.g., "10:00 AM - 11:00 AM" (display string)
  isAvailable: boolean;
  price?: number; // Optional price per slot
  startTimeUTC?: string; // ISO string from backend (useful for precise comparisons)
  endTimeUTC?: string; // ISO string from backend (useful for precise comparisons)
}

export interface Screen {
  _id: string; // MongoDB ID from backend
  id?: string; // Original frontend ID, if needed for compatibility (mainly for keys if _id isn't used)
  name: string;
  icon?: React.ElementType; // Lucide icon component - keep for frontend, backend might not have this
  imagePlaceholderUrl: string;
  imageAiHint: string;
  description?: string;
  features?: string[];
  isActive?: boolean; // From backend
  // Add any other fields that come from the backend Screen model
}

export interface Booking {
  _id: string; // MongoDB ID
  id?: string; // Original frontend ID for legacy/key usage if needed
  user?: string; // User ID string from backend
  screen: Screen | string; // Can be populated Screen object or just Screen ID string
  screenName?: string; // For display if screen is just an ID (less common if populated). From .populate('screen', 'name')
  
  // For frontend selection and display consistency with what backend's parseDateTimeSlot expects
  date?: string; // YYYY-MM-DD - used for selection, sent to backend (DEPRECATED in favor of startTime for display)
  timeSlot?: string; // "HH:MM AM/PM - HH:MM AM/PM" - used for selection, sent to backend (DEPRECATED in favor of startTime for display)
  
  // Definitive start/end times from backend
  startTime: string; // ISO Date string from backend (PRIMARY SOURCE FOR DATE/TIME)
  endTime: string; // ISO Date string from backend
  
  gamerTagAtBooking?: string; // GamerTag used at the time of this specific booking (from backend)
  // gamerTag?: string; // DEPRECATED in favor of gamerTagAtBooking on Booking model
  
  bookedAt: string; // ISO Date string from backend (when the booking was made)
  status: 'upcoming' | 'completed' | 'cancelled' | 'active'; // 'active' is a backend status
  pricePaid: number;
}


export interface Transaction {
  _id: string; // MongoDB ID
  id?: string; // Original frontend ID
  user?: string; // User ID string
  type: 'top-up' | 'booking-fee' | 'refund' | 'topup-request';
  amount: number;
  description: string;
  date?: string; // Legacy, backend now primarily uses timestamp
  timestamp: string; // ISO Date string from backend (canonical date for transaction)
  walletBalanceBefore?: number;
  walletBalanceAfter?: number;
  loyaltyPointsChange?: number;
  loyaltyPointsBalanceBefore?: number;
  loyaltyPointsBalanceAfter?: number;
  relatedBooking?: string; // Booking ID
  relatedTopUpRequest?: string; // TopUpRequest ID
  status?: 'pending' | 'approved' | 'rejected'; // For topup requests
  paymentMethod?: string;
  transactionId?: string; // For external payment system
  adminNotes?: string;
  reviewedBy?: string; // Admin ID
  reviewedAt?: string; // ISO Date string
}


export interface WalletState {
  balance: number;
  transactions: Transaction[];
  loyaltyPoints: number;
  isLoading: boolean;
  fetchWalletData: () => Promise<void>;
  requestTopUp: (amount: number, paymentMethod: string, transactionId?: string) => Promise<void>;
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
}

export interface UserProfile {
    _id: string;
    gamerTag: string;
    email: string;
    phoneNumber?: string;
    walletBalance: number;
    loyaltyPoints: number;
    createdAt: string; // ISO Date String
    updatedAt: string; // ISO Date String
}

export interface WalletData { // For /wallet/details endpoint
    balance: number;
    loyaltyPoints: number;
}
