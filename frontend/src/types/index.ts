export type Role = 'LECTURER' | 'STUDENT';
export type SlotStatus = 'OPEN' | 'PENDING' | 'BOOKED' | 'CANCELLED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string | null;
  createdAt?: string;
  _count?: {
    slots?: number;
  };
}

export interface AvailabilitySlot {
  id: string;
  lecturerId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: SlotStatus;
  isRecurring: boolean;
  createdAt: string;
  lecturer?: User;
  booking?: Booking | null;
}

export interface Booking {
  id: string;
  slotId: string;
  studentId: string;
  subject?: string | null;
  status: BookingStatus;
  createdAt: string;
  slot?: AvailabilitySlot;
  student?: User;
}

export interface AuthResponse {
  user: User;
  token?: string;
  message?: string;
}

export interface CreateSlotInput {
  date: string;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  recurringWeeks?: number;
}
