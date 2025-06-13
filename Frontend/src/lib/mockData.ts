
import type { Screen, TimeSlot, Booking, Transaction } from '@/lib/types';
import { Monitor, Tv2, Gamepad2, History, Wallet as WalletIconLucide } from 'lucide-react';

export const SCREENS: Screen[] = [
  {
    id: 'screen1',
    name: 'Screen 1',
    icon: Monitor,
    imagePlaceholderUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'gaming monitor',
  },
  {
    id: 'screen2',
    name: 'Screen 2',
    icon: Tv2,
    imagePlaceholderUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'console gaming',
  },
];

export const generateTimeSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const now = new Date(); // Current time to check against

  for (let hour = 0; hour < 24; hour++) {
    const startTime = new Date(date); // Use a new Date object for each slot
    startTime.setHours(hour, 0, 0, 0);

    const endTime = new Date(date); // Use a new Date object for each slot
    endTime.setHours(hour + 1, 0, 0, 0);

    // Check if the slot is in the past for the current day
    let isAvailable = true;
    const isPastSlot = now > startTime && startTime.toDateString() === now.toDateString();
    if (isPastSlot) {
      isAvailable = false;
    } else {
      // Add a random chance for future slots to be unavailable (e.g., 15% chance)
      // This simulates other bookings or maintenance
      if (Math.random() < 0.15) {
        isAvailable = false;
      }
    }
    
    const startTimeString = startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    const endTimeString = endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    
    slots.push({
      id: `slot-${date.toISOString().slice(0,10)}-${hour}`,
      time: `${startTimeString} - ${endTimeString}`,
      isAvailable: isAvailable,
      price: 100,
    });
  }
  return slots;
};

// --- Fixed Dates for Mock Data ---
const REF_DATE_FOR_MOCK = new Date('2024-07-15T12:00:00.000Z'); 

const createFixedDate = (daysOffset: number, baseDate: Date = REF_DATE_FOR_MOCK): Date => {
  const newDate = new Date(baseDate);
  newDate.setUTCDate(newDate.getUTCDate() + daysOffset); 
  newDate.setUTCHours(12, 0, 0, 0); 
  return newDate;
};

const formatDateToYYYYMMDD = (date: Date): string => {
  return date.toISOString().split('T')[0]; 
};

// Helper to format mock time slots consistently with generateTimeSlots AM/PM format
const formatMockTimeSlot = (dateForSlot: Date, hour: number): string => {
  const slotDate = new Date(dateForSlot); 
  const startTime = new Date(slotDate);
  startTime.setHours(hour, 0, 0, 0);
  const endTime = new Date(slotDate);
  endTime.setHours(hour + 1, 0, 0, 0);

  const startTimeString = startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  const endTimeString = endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${startTimeString} - ${endTimeString}`;
};
// --- End Fixed Dates for Mock Data ---

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'booking1',
    screenName: 'Screen 1',
    date: formatDateToYYYYMMDD(createFixedDate(-14)), 
    timeSlot: formatMockTimeSlot(createFixedDate(-14), 14), // e.g. 2:00 PM - 3:00 PM
    gamerTag: 'RetroGamerX',
    bookedAt: createFixedDate(-14), 
    status: 'completed',
    pricePaid: 100,
  },
  {
    id: 'booking2',
    screenName: 'Screen 2',
    date: formatDateToYYYYMMDD(createFixedDate(-7)), 
    timeSlot: formatMockTimeSlot(createFixedDate(-7), 18), // e.g. 6:00 PM - 7:00 PM
    gamerTag: 'ProPlayer123',
    bookedAt: createFixedDate(-7), 
    status: 'completed',
    pricePaid: 100,
  },
  {
    id: 'booking3',
    screenName: 'Screen 1',
    date: formatDateToYYYYMMDD(createFixedDate(3)), 
    timeSlot: formatMockTimeSlot(createFixedDate(3), 10), // e.g. 10:00 AM - 11:00 AM
    gamerTag: 'FutureChamp',
    bookedAt: createFixedDate(-1), 
    status: 'upcoming',
    pricePaid: 100,
  },
  { 
    id: 'booking4',
    screenName: 'Screen 2',
    date: formatDateToYYYYMMDD(createFixedDate(10)), 
    timeSlot: formatMockTimeSlot(createFixedDate(10), 16), // e.g. 4:00 PM - 5:00 PM
    gamerTag: 'NewbieNick',
    bookedAt: createFixedDate(0), 
    status: 'upcoming',
    pricePaid: 100,
  },
   { 
    id: 'booking5',
    screenName: 'Screen 1',
    date: formatDateToYYYYMMDD(createFixedDate(1)), 
    timeSlot: formatMockTimeSlot(createFixedDate(1), 23), // e.g. 11:00 PM - 12:00 AM
    gamerTag: 'NightOwl',
    bookedAt: createFixedDate(0), 
    status: 'upcoming',
    pricePaid: 100,
  },
];

export const getAvailableSlotsForDate = (date: Date, screenId: string): TimeSlot[] => {
  // For now, all screens have the same slots. This can be customized later.
  return generateTimeSlots(date);
};

export const NAV_ITEMS = [
  { name: "Home", href: "/", icon: Gamepad2 },
  { name: "Bookings", href: "/bookings", icon: History },
  // Wallet is accessed via dropdown in header
];


const earliestBookingDate = INITIAL_BOOKINGS.length > 0 
  ? INITIAL_BOOKINGS.reduce((earliest, current) => {
      const currentBookedAt = new Date(current.bookedAt);
      const earliestBookedAt = new Date(earliest.bookedAt);
      return currentBookedAt.getTime() < earliestBookedAt.getTime() ? current : earliest;
    }).bookedAt
  : new Date(REF_DATE_FOR_MOCK); // Fallback if INITIAL_BOOKINGS is empty


const totalSpentOnMockBookings = INITIAL_BOOKINGS.reduce((sum, booking) => sum + (booking.pricePaid || 0), 0);
export const INITIAL_BALANCE_TARGET = 1500; 
const initialTopUpAmount = INITIAL_BALANCE_TARGET + totalSpentOnMockBookings;


export const INITIAL_TRANSACTIONS: Transaction[] = INITIAL_BOOKINGS.length > 0 ? [
  {
    id: 'txn-initial-topup',
    type: 'top-up',
    amount: initialTopUpAmount,
    description: 'Initial Wallet Load',
    date: createFixedDate(-1, new Date(earliestBookingDate)), 
  },
  ...INITIAL_BOOKINGS.map((booking) => ({
    id: `txn-mock-booking-${booking.id}`, 
    type: 'booking-fee' as 'booking-fee',
    amount: -(booking.pricePaid!),
    description: `Booking: ${booking.screenName} (${booking.gamerTag})`,
    date: new Date(booking.bookedAt),
  }))
].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [
  // If there are no initial bookings, ensure at least the initial top-up transaction exists
  {
    id: 'txn-initial-topup-no-bookings',
    type: 'top-up',
    amount: INITIAL_BALANCE_TARGET, // Just the target balance if no deductions
    description: 'Initial Wallet Load',
    date: createFixedDate(-1, new Date(REF_DATE_FOR_MOCK)),
  }
];

// Ensure INITIAL_BALANCE_TARGET is the starting point for the context
export const INITIAL_BALANCE_CONTEXT = INITIAL_BALANCE_TARGET;
