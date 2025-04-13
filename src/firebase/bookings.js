import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './config';

const BOOKINGS_COLLECTION = 'bookings';

// Helper function to check if collection exists
export const checkBookingsCollection = async () => {
  try {
    console.log('Checking if bookings collection exists...');
    const querySnapshot = await getDocs(query(collection(db, BOOKINGS_COLLECTION), limit(1)));
    const exists = !querySnapshot.empty;
    console.log('Bookings collection exists:', exists);
    return exists;
  } catch (error) {
    console.error('Error checking bookings collection:', error);
    return false;
  }
};

// Create a new booking
export const createBooking = async (bookingData) => {
  try {
    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), {
      ...bookingData,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

// Update booking status (admin only)
export const updateBookingStatus = async (bookingId, status) => {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await updateDoc(bookingRef, {
      status,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    throw error;
  }
};

// Update payment status
export const updatePaymentStatus = async (bookingId, paymentStatus) => {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await updateDoc(bookingRef, {
      paymentStatus,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    throw error;
  }
};

// Get user's bookings
export const getUserBookings = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Fetching bookings for user:', userId); // Debug log

    const bookingsQuery = query(
      collection(db, BOOKINGS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(bookingsQuery);
    console.log('Raw query results:', querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); // Debug log

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

// Get all bookings (admin only)
export const getAllBookings = async () => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, BOOKINGS_COLLECTION),
        orderBy('createdAt', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw error;
  }
};

// Get booking by ID
export const getBookingById = async (bookingId) => {
  try {
    const bookingDoc = await getDoc(doc(db, BOOKINGS_COLLECTION, bookingId));
    if (bookingDoc.exists()) {
      return {
        id: bookingDoc.id,
        ...bookingDoc.data()
      };
    }
    return null;
  } catch (error) {
    throw error;
  }
};

// Check vehicle availability for given dates
export const checkVehicleAvailability = async (vehicleId, startDate, endDate) => {
  try {
    const bookingsQuery = query(
      collection(db, BOOKINGS_COLLECTION),
      where('vehicleId', '==', vehicleId),
      where('status', 'in', ['pending', 'confirmed']),
      where('startDate', '<=', endDate),
      where('endDate', '>=', startDate)
    );
    
    const querySnapshot = await getDocs(bookingsQuery);
    return querySnapshot.empty; // Returns true if no conflicting bookings found
  } catch (error) {
    throw error;
  }
};

// Cancel a booking
export const cancelBooking = async (bookingId) => {
  try {
    console.log('Cancelling booking with ID:', bookingId);
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    
    // First, check if the booking exists
    const bookingDoc = await getDoc(bookingRef);
    if (!bookingDoc.exists()) {
      throw new Error('Booking not found');
    }
    
    // Get the current booking data
    const bookingData = bookingDoc.data();
    
    // Check if booking is already cancelled
    if (bookingData.status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }
    
    // Check if booking start date has passed
    const startDate = new Date(bookingData.startDate);
    const now = new Date();
    if (startDate < now) {
      throw new Error('Cannot cancel a booking that has already started');
    }
    
    // Update booking status to cancelled
    await updateDoc(bookingRef, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
      cancelledAt: new Date().toISOString()
    });
    
    console.log('Booking cancelled successfully');
    return true;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

// Reschedule a booking
export const rescheduleBooking = async (bookingId, newStartDate, newEndDate) => {
  try {
    console.log('Rescheduling booking with ID:', bookingId);
    console.log('New start date:', newStartDate);
    console.log('New end date:', newEndDate);
    
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    
    // First, check if the booking exists
    const bookingDoc = await getDoc(bookingRef);
    if (!bookingDoc.exists()) {
      throw new Error('Booking not found');
    }
    
    // Get the current booking data
    const bookingData = bookingDoc.data();
    
    // Check if booking is cancelled
    if (bookingData.status === 'cancelled') {
      throw new Error('Cannot reschedule a cancelled booking');
    }
    
    // Check if booking start date has passed
    const startDate = new Date(bookingData.startDate);
    const now = new Date();
    if (startDate < now) {
      throw new Error('Cannot reschedule a booking that has already started');
    }
    
    // Validate new dates
    const newStartDateTime = new Date(newStartDate);
    const newEndDateTime = new Date(newEndDate);
    
    if (isNaN(newStartDateTime.getTime()) || isNaN(newEndDateTime.getTime())) {
      throw new Error('Invalid date format');
    }
    
    if (newStartDateTime >= newEndDateTime) {
      throw new Error('End date must be after start date');
    }
    
    if (newStartDateTime < now) {
      throw new Error('New start date cannot be in the past');
    }
    
    // Check vehicle availability for new dates
    const isAvailable = await checkVehicleAvailability(
      bookingData.vehicleId,
      newStartDate,
      newEndDate
    );
    
    if (!isAvailable) {
      throw new Error('Vehicle is not available for the selected dates');
    }
    
    // Calculate new total price (keep the same hourly rate)
    const hoursDiff = Math.ceil((newEndDateTime - newStartDateTime) / (1000 * 60 * 60));
    const hourlyRate = bookingData.totalPrice / 
      Math.ceil((new Date(bookingData.endDate) - new Date(bookingData.startDate)) / (1000 * 60 * 60));
    const newTotalPrice = hourlyRate * hoursDiff;
    
    // Update booking with new dates and price
    await updateDoc(bookingRef, {
      startDate: newStartDate,
      endDate: newEndDate,
      totalPrice: newTotalPrice,
      status: 'pending', // Reset to pending for review
      updatedAt: new Date().toISOString(),
      rescheduledAt: new Date().toISOString()
    });
    
    console.log('Booking rescheduled successfully');
    return {
      newStartDate,
      newEndDate,
      newTotalPrice
    };
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    throw error;
  }
}; 