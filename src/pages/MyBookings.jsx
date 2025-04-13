import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserBookings, checkBookingsCollection, cancelBooking, rescheduleBooking } from '../firebase/bookings';
import { getVehicleById } from '../firebase/vehicles';
import { FaCalendarAlt, FaCarSide, FaClock, FaMoneyBillWave, FaTimes, FaExclamationTriangle, FaCalendarCheck, FaEdit } from 'react-icons/fa';
import PaymentButton from '../components/PaymentButton';

// Format datetime for input fields
const formatDateTimeForInput = (dateTimeString) => {
  if (!dateTimeString) return '';
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return '';
    
    // Format as YYYY-MM-DDTHH:MM
    return date.toISOString().substring(0, 16);
  } catch (err) {
    console.error('Error formatting date:', err);
    return '';
  }
};

// Get current date time with seconds set to zero to avoid validation issues
const getCurrentDateTimeString = () => {
  const now = new Date();
  now.setSeconds(0);
  return now.toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, bookingId, vehicle }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Cancellation</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to cancel your booking for 
          <span className="font-semibold">{vehicle ? ` ${vehicle.name}` : ''}</span>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            No, Keep Booking
          </button>
          <button
            onClick={() => onConfirm(bookingId)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Yes, Cancel Booking
          </button>
        </div>
      </div>
    </div>
  );
};

// Reschedule Modal Component
const RescheduleModal = ({ isOpen, onClose, onConfirm, booking }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking && isOpen) {
      setStartDate(formatDateTimeForInput(booking.startDate));
      setEndDate(formatDateTimeForInput(booking.endDate));
      setError('');
    }
  }, [booking, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validate dates
    const newStartDate = new Date(startDate);
    const newEndDate = new Date(endDate);
    const now = new Date();
    
    if (isNaN(newStartDate.getTime()) || isNaN(newEndDate.getTime())) {
      setError('Please enter valid dates');
      return;
    }
    
    if (newStartDate >= newEndDate) {
      setError('End date must be after start date');
      return;
    }
    
    if (newStartDate < now) {
      setError('Start date cannot be in the past');
      return;
    }
    
    setLoading(true);
    onConfirm(booking.id, startDate, endDate);
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Reschedule Booking</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <p className="text-gray-600 mb-4">
            Reschedule your booking for 
            <span className="font-semibold">{booking?.vehicle?.name || ''}</span>
          </p>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date and Time
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={getCurrentDateTimeString()}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date and Time
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || getCurrentDateTimeString()}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Determine booking status display color
const getBookingStatusColor = (booking) => {
  const now = new Date();
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  
  if (booking.status === 'cancelled') {
    return 'bg-red-100 text-red-800';
  }
  
  if (now < startDate) {
    return 'bg-blue-100 text-blue-800'; // Upcoming
  } else if (now >= startDate && now <= endDate) {
    return 'bg-green-100 text-green-800'; // Ongoing
  } else {
    return 'bg-purple-100 text-purple-800'; // Completed
  }
};

// Get user-friendly booking status label
const getBookingStatusLabel = (booking) => {
  const now = new Date();
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  
  if (booking.status === 'cancelled') {
    return 'Cancelled';
  }
  
  if (now < startDate) {
    return 'Upcoming';
  } else if (now >= startDate && now <= endDate) {
    return 'Ongoing';
  } else {
    return 'Completed';
  }
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collectionExists, setCollectionExists] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [reschedulingId, setReschedulingId] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [rescheduleSuccess, setRescheduleSuccess] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const { user } = useAuth();

  // Open confirmation modal
  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setShowConfirmModal(true);
  };

  // Close confirmation modal
  const closeCancelModal = () => {
    setShowConfirmModal(false);
    setSelectedBooking(null);
  };

  // Open reschedule modal
  const openRescheduleModal = (booking) => {
    setSelectedBooking(booking);
    setShowRescheduleModal(true);
  };

  // Close reschedule modal
  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
    setSelectedBooking(null);
  };

  // Function to cancel a booking
  const handleCancelBooking = async (bookingId) => {
    // Close the modal
    setShowConfirmModal(false);
    
    try {
      setCancelError('');
      setCancelSuccess('');
      setCancellingId(bookingId);
      
      await cancelBooking(bookingId);
      
      // Update the booking in the state
      setBookings(prevBookings => prevBookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' } 
          : booking
      ));
      
      setCancelSuccess(`Booking ${bookingId} has been cancelled successfully.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setCancelSuccess('');
      }, 5000);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setCancelError(error.message || 'Failed to cancel booking');
      
      // Clear error message after it's shown for 5 seconds
      setTimeout(() => {
        setCancelError('');
      }, 5000);
    } finally {
      setCancellingId(null);
      setSelectedBooking(null);
    }
  };

  // Function to reschedule a booking
  const handleRescheduleBooking = async (bookingId, newStartDate, newEndDate) => {
    // Close the modal
    setShowRescheduleModal(false);
    
    try {
      setRescheduleError('');
      setRescheduleSuccess('');
      setReschedulingId(bookingId);
      
      const result = await rescheduleBooking(bookingId, newStartDate, newEndDate);
      
      // Update the booking in the state
      setBookings(prevBookings => prevBookings.map(booking => 
        booking.id === bookingId 
          ? { 
              ...booking, 
              startDate: newStartDate,
              endDate: newEndDate,
              totalPrice: result.newTotalPrice,
              status: 'pending' // Reset to pending after reschedule
            } 
          : booking
      ));
      
      setRescheduleSuccess(`Booking has been rescheduled successfully.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setRescheduleSuccess('');
      }, 5000);
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      setRescheduleError(error.message || 'Failed to reschedule booking');
      
      // Clear error message after it's shown for 5 seconds
      setTimeout(() => {
        setRescheduleError('');
      }, 5000);
    } finally {
      setReschedulingId(null);
      setSelectedBooking(null);
    }
  };

  // Can this booking be modified?
  const canModifyBooking = (booking) => {
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return false;
    }
    
    // Check if the booking start date is in the future
    const startDate = new Date(booking.startDate);
    const now = new Date();
    return startDate > now;
  };

  useEffect(() => {
    const checkCollection = async () => {
      const exists = await checkBookingsCollection();
      setCollectionExists(exists);
    };
    checkCollection();
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        console.log('Current user ID:', user.uid); // Debug log
        
        // Check if the user ID is correct
        console.log('User object details:', user);
        
        const userBookings = await getUserBookings(user.uid);
        console.log('Fetched bookings:', userBookings); // Debug log
        
        if (userBookings.length === 0) {
          console.log('No bookings found for this user');
        }
        
        // Fetch vehicle details for each booking
        const bookingsWithVehicles = await Promise.all(
          userBookings.map(async (booking) => {
            console.log('Processing booking:', booking.id);
            
            try {
              const vehicle = await getVehicleById(booking.vehicleId);
              console.log('Vehicle details for booking:', vehicle); // Debug log
              return {
                ...booking,
                vehicle
              };
            } catch (err) {
              console.error('Error fetching vehicle for booking:', booking.id, err);
              return {
                ...booking,
                vehicle: null
              };
            }
          })
        );

        console.log('Final bookings with vehicles:', bookingsWithVehicles); // Debug log
        setBookings(bookingsWithVehicles);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBookings();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>
      
      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={showConfirmModal}
        onClose={closeCancelModal}
        onConfirm={handleCancelBooking}
        bookingId={selectedBooking?.id}
        vehicle={selectedBooking?.vehicle}
      />
      
      {/* Reschedule Modal */}
      <RescheduleModal 
        isOpen={showRescheduleModal}
        onClose={closeRescheduleModal}
        onConfirm={handleRescheduleBooking}
        booking={selectedBooking}
      />
      
      {cancelError && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 flex items-center">
          <FaExclamationTriangle className="mr-2" />
          <p>{cancelError}</p>
        </div>
      )}
      
      {rescheduleError && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 flex items-center">
          <FaExclamationTriangle className="mr-2" />
          <p>{rescheduleError}</p>
        </div>
      )}
      
      {cancelSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6">
          <p>{cancelSuccess}</p>
        </div>
      )}
      
      {rescheduleSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6">
          <p>{rescheduleSuccess}</p>
        </div>
      )}
      
      {collectionExists === false && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p>The bookings collection does not exist in Firestore. This may indicate a database setup issue.</p>
        </div>
      )}
      
      {bookings.length === 0 && (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Bookings Found</h2>
          <p className="text-gray-600 mb-8">You haven't made any bookings yet.</p>
          <a
            href="/cars"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse Vehicles
          </a>
        </div>
      )}
      
      <div className="space-y-6">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-white shadow rounded-lg overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {booking.vehicle?.name || 'Vehicle Unavailable'}
                </h3>
                <div className="flex items-center space-x-2">
                  {/* Payment Status */}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    booking.paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                  
                  {/* Booking Status */}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === 'confirmed' || booking.status === 'pending'
                      ? getBookingStatusColor(booking)
                      : booking.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {getBookingStatusLabel(booking)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start">
                  <FaCalendarAlt className="text-gray-400 mt-1 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Booking Period</p>
                    <p className="font-medium">
                      {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaClock className="text-gray-400 mt-1 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium">
                      {new Date(booking.startDate).toLocaleTimeString()} - {new Date(booking.endDate).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaCarSide className="text-gray-400 mt-1 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Vehicle</p>
                    <p className="font-medium">{booking.vehicle?.name || 'Vehicle details unavailable'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaMoneyBillWave className="text-gray-400 mt-1 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-medium">₹{booking.totalPrice}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Booking ID: {booking.id}
                </div>
                
                <div className="flex space-x-2">
                  {booking.paymentStatus !== 'paid' && booking.status !== 'cancelled' && (
                    <PaymentButton
                      booking={{
                        ...booking,
                        vehicle: booking.vehicle,
                        totalPrice: booking.totalPrice
                      }}
                      onPaymentSuccess={() => {
                        // Refresh bookings or update the UI
                        setRescheduleSuccess('Payment successful! Your booking is confirmed.');
                        // Update the booking in state to reflect the paid status and change booking status to confirmed
                        setBookings(prevBookings => prevBookings.map(b => 
                          b.id === booking.id 
                            ? { 
                                ...b, 
                                paymentStatus: 'paid',
                                status: 'confirmed' // Change status to confirmed after payment
                              } 
                            : b
                        ));
                      }}
                      onPaymentError={(error) => {
                        console.error('Payment error:', error);
                        setRescheduleError('Payment failed: ' + error.message);
                        
                        // Clear error message after 5 seconds
                        setTimeout(() => {
                          setRescheduleError('');
                        }, 5000);
                      }}
                    />
                  )}
                  
                  {canModifyBooking(booking) && (
                    <>
                      <button
                        onClick={() => openRescheduleModal(booking)}
                        disabled={reschedulingId === booking.id}
                        className={`flex items-center text-sm font-medium px-3 py-1.5 rounded 
                          ${reschedulingId === booking.id 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                      >
                        {reschedulingId === booking.id ? (
                          <span className="animate-pulse">Rescheduling...</span>
                        ) : (
                          <>
                            <FaCalendarCheck className="mr-1" /> Reschedule
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => openCancelModal(booking)}
                        disabled={cancellingId === booking.id}
                        className={`flex items-center text-sm font-medium px-3 py-1.5 rounded 
                          ${cancellingId === booking.id 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                      >
                        {cancellingId === booking.id ? (
                          <span className="animate-pulse">Cancelling...</span>
                        ) : (
                          <>
                            <FaTimes className="mr-1" /> Cancel
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyBookings; 