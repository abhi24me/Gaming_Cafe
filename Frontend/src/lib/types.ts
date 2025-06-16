
export interface TimeSlot {
  _id?: string; // Backend might send _id for slots if they are separate documents
  id: string; // Frontend generated or backend provided unique ID for the slot on a given day/screen
  time: string; // e.g., "10:00 AM - 11:00 AM"
  isAvailable: boolean;
  price?: number; 
  startTimeUTC?: string; // Full ISO string for start time
  endTimeUTC?: string;   // Full ISO string for end time
}

export interface Screen {
  _id: string; 
  id?: string; // Can be alias for _id if needed by some components, but _id is primary
  name: string;
  icon?: React.ElementType; // Frontend-only potentially, or map from a backend string
  imagePlaceholderUrl: string;
  imageAiHint: string;
  description?: string;
  features?: string[];
  isActive?: boolean; // From backend
}

export interface Booking {
  _id: string; 
  id?: string; // Alias for _id
  user?: string; // User ID string
  screen: Screen | string; // Screen object or Screen ID string
  screenName?: string; // Denormalized for display, or derived from populated screen
  date?: string; // YYYY-MM-DD format, primarily for query/display, use startTime for truth
  timeSlot?: string; // "HH:MM AM/PM - HH:MM AM/PM", for display, use startTime/endTime for truth
  startTime: string; // ISO Date String
  endTime: string;   // ISO Date String
  gamerTagAtBooking?: string; // Gamer tag used at the time of this specific booking
  bookedAt: string; // ISO Date String
  status: 'upcoming' | 'completed' | 'cancelled' | 'active'; 
  pricePaid: number;
}


export interface Transaction {
  _id: string; 
  id?: string; // alias for _id
  user?: string; // User ID string
  type: 'top-up' | 'booking-fee' | 'refund' | 'topup-request'; // 'topup-request' for pending
  amount: number;
  description: string;
  date?: string; // For display, timestamp is the source of truth
  timestamp: string; // ISO Date String
  walletBalanceBefore?: number;
  walletBalanceAfter?: number;
  loyaltyPointsChange?: number;
  loyaltyPointsBalanceBefore?: number;
  loyaltyPointsBalanceAfter?: number;
  relatedBooking?: string; // Booking ID string
  relatedTopUpRequest?: string; // TopUpRequest ID string
  status?: 'pending' | 'approved' | 'rejected'; // For 'topup-request' type
  paymentMethod?: string; // e.g., "UPI", "Card", "AdminCredit"
  transactionId?: string; // External payment system ID or reference
  adminNotes?: string;
  reviewedBy?: string; // Admin User ID string
  reviewedAt?: string; // ISO Date String
  // Fields for top-up requests with receipts (primarily for TopUpRequest model, but can be on txn too)
  receiptImageUrl?: string; 
  receiptFilename?: string; 
}


export interface WalletState {
  balance: number;
  transactions: Transaction[];
  loyaltyPoints: number;
  isLoading: boolean;
  fetchWalletData: () => Promise<void>;
  requestTopUp: (amount: number, receiptFile: File) => Promise<void>; // Updated signature for file upload
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

export interface UserProfile { // Represents the user object from backend
    _id: string;
    gamerTag: string;
    email: string;
    phoneNumber?: string;
    walletBalance: number;
    loyaltyPoints: number;
    createdAt: string; // ISO Date String
    updatedAt: string; // ISO Date String
}

export interface WalletData { // For the /wallet/details endpoint
    balance: number;
    loyaltyPoints: number;
}

// Interface for what the backend returns for screen availability
export interface ScreenAvailabilityResponse {
  screenName: string;
  date: string;
  slots: TimeSlot[];
}

// Interface for what backend returns when creating a booking
export interface BookingCreationResponse {
  message: string;
  booking: Booking; // The created booking, likely populated
  transaction: Transaction; // The booking fee transaction
  newBalance: number;
  newLoyaltyPoints: number;
}
