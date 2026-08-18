import { apiClient } from './client.js';
import { User, AvailabilitySlot, Booking, AuthResponse, CreateSlotInput } from '../types/index.js';

export const authApi = {
  async register(data: { name: string; email: string; password: string; role: 'LECTURER' | 'STUDENT'; department?: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    const res = await apiClient.get<{ user: User }>('/auth/me');
    return res.data.user;
  },
};

export const lecturerApi = {
  async getLecturers(search?: string): Promise<User[]> {
    const params = search ? { search } : {};
    const res = await apiClient.get<{ lecturers: User[] }>('/lecturers', { params });
    return res.data.lecturers;
  },

  async getLecturerSlots(lecturerId: string): Promise<{ lecturer: User; slots: AvailabilitySlot[] }> {
    const res = await apiClient.get<{ lecturer: User; slots: AvailabilitySlot[] }>(`/lecturers/${lecturerId}/slots`);
    return res.data;
  },
};

export const slotApi = {
  async createSlot(data: CreateSlotInput): Promise<{ message: string; slot?: AvailabilitySlot; slots?: AvailabilitySlot[] }> {
    const res = await apiClient.post<{ message: string; slot?: AvailabilitySlot; slots?: AvailabilitySlot[] }>('/slots', data);
    return res.data;
  },

  async getMySlots(): Promise<AvailabilitySlot[]> {
    const res = await apiClient.get<{ slots: AvailabilitySlot[] }>('/slots/mine');
    return res.data.slots;
  },

  async cancelSlot(slotId: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/slots/${slotId}`);
    return res.data;
  },
};

export const bookingApi = {
  async bookSlot(slotId: string): Promise<{ message: string; booking: Booking }> {
    const res = await apiClient.post<{ message: string; booking: Booking }>('/bookings', { slotId });
    return res.data;
  },

  async getMyBookings(): Promise<Booking[]> {
    const res = await apiClient.get<{ bookings: Booking[] }>('/bookings/mine');
    return res.data.bookings;
  },

  async cancelBooking(bookingId: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/bookings/${bookingId}`);
    return res.data;
  },
};
