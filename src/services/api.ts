import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
});

const socket = io(SOCKET_URL);

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/login', { email, password });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'An error occurred during login');
  }
};

export const getBookings = async () => {
  try {
    const response = await api.get('/bookings');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch bookings');
  }
};

export const getDrivers = async () => {
  try {
    const response = await api.get('/drivers');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch drivers');
  }
};

export const createBooking = async (bookingData: any) => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to create booking');
  }
};

export const getVehicleTypes = async () => {
  try {
    const response = await api.get('/vehicle-types');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch vehicle types');
  }
};

export const acceptBooking = async (driverId: number, bookingId: number) => {
  try {
    const response = await api.post(`/bookings/${bookingId}/accept`, { driverId });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to accept booking');
  }
};

export const updateBookingStatus = async (driverId: number, bookingId: number, status: string) => {
  try {
    const response = await api.put(`/bookings/${bookingId}/status`, { driverId, status });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to update booking status');
  }
};

export const updateDriverLocation = async (driverId: number, location: { lat: number; lng: number }) => {
  try {
    const response = await api.post(`/drivers/${driverId}/location`, { location });
    return response.data;
  } catch (error: any) {
    console.error('Failed to update driver location:', error);
  }
};

export const trackBooking = (bookingId: number, callback: (data: any) => void) => {
  socket.emit('track_booking', bookingId);
  socket.on('booking_update', callback);
};

export const getBooking = async (bookingId: number) => {
  try {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch booking');
  }
};

export const onNewBooking = (callback: (booking: any) => void) => {
  socket.on('new_booking', callback);
};

export const onBookingUpdated = (callback: (booking: any) => void) => {
  socket.on('booking_updated', callback);
};

export const trackDriver = (driverId: number, callback: (data: any) => void) => {
  socket.emit('track_driver', driverId);
  socket.on('driver_location_update', callback);
};