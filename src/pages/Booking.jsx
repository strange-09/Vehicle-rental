import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { FaCheck, FaArrowLeft, FaCreditCard, FaLock, FaRupeeSign, FaMapMarkerAlt, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getVehicleById } from '../firebase/vehicles';
import { createBooking, checkVehicleAvailability } from '../firebase/bookings';
import LocationValidator from '../components/LocationValidator';

// --- Define Fixed Pickup Locations ---
const pickupLocations = {
  // Andhra Pradesh
  'visakhapatnam': { address: 'RTC Complex, Main Gate, Visakhapatnam, AP', mapsUrl: 'https://maps.google.com/?q=Visakhapatnam+RTC+Complex' },
  'vijayawada': { address: 'Benz Circle, Near Trendset Mall, Vijayawada, AP', mapsUrl: 'https://maps.google.com/?q=Vijayawada+Benz+Circle' },
  'guntur': { address: 'NTR Bus Station, Platform 1 Area, Guntur, AP', mapsUrl: 'https://maps.google.com/?q=Guntur+NTR+Bus+Station' },
  'nellore': { address: 'Nellore Railway Station Entrance, Nellore, AP', mapsUrl: 'https://maps.google.com/?q=Nellore+Railway+Station' },
  'kurnool': { address: 'Kurnool Bus Stand, Near Clock Tower, Kurnool, AP', mapsUrl: 'https://maps.google.com/?q=Kurnool+Bus+Stand' },
  'kakinada': { address: 'Kakinada Town Railway Station, Kakinada, AP', mapsUrl: 'https://maps.google.com/?q=Kakinada+Town+Railway+Station' },
  'tirupati': { address: 'Tirupati Bus Station Complex (Srinivasa), Tirupati, AP', mapsUrl: 'https://maps.google.com/?q=Tirupati+Bus+Station+Complex' },
  'rajahmundry': { address: 'Rajahmundry Railway Station, Main Entrance, Rajahmundry, AP', mapsUrl: 'https://maps.google.com/?q=Rajahmundry+Railway+Station' },
  'kadapa': { address: 'Kadapa RTC Bus Stand, Kadapa, AP', mapsUrl: 'https://maps.google.com/?q=Kadapa+RTC+Bus+Stand' },
  'anantapur': { address: 'Anantapur RTC Bus Stand, Anantapur, AP', mapsUrl: 'https://maps.google.com/?q=Anantapur+RTC+Bus+Stand' },
  // Telangana
  'hyderabad': { address: 'MG Bus Station (Imlibun), Platform Area, Hyderabad, TS', mapsUrl: 'https://maps.google.com/?q=MG+Bus+Station+Hyderabad' },
  'warangal': { address: 'Warangal Railway Station, Main Entrance, Warangal, TS', mapsUrl: 'https://maps.google.com/?q=Warangal+Railway+Station' },
  'nizamabad': { address: 'Nizamabad Bus Station, Near Railway Station, Nizamabad, TS', mapsUrl: 'https://maps.google.com/?q=Nizamabad+Bus+Station' },
  'karimnagar': { address: 'Karimnagar RTC Bus Stand, Karimnagar, TS', mapsUrl: 'https://maps.google.com/?q=Karimnagar+RTC+Bus+Stand' },
  'khammam': { address: 'Khammam Bus Station, Khammam, TS', mapsUrl: 'https://maps.google.com/?q=Khammam+Bus+Station' },
  'secunderabad': { address: 'Secunderabad Railway Station, Main Entrance Gate 1, Secunderabad, TS', mapsUrl: 'https://maps.google.com/?q=Secunderabad+Railway+Station' },
  'suryapet': { address: 'Suryapet New Bus Stand, Suryapet, TS', mapsUrl: 'https://maps.google.com/?q=Suryapet+New+Bus+Stand' },
  'nalgonda': { address: 'Nalgonda Bus Station, Nalgonda, TS', mapsUrl: 'https://maps.google.com/?q=Nalgonda+Bus+Station' },
  'adilabad': { address: 'Adilabad Bus Station, Adilabad, TS', mapsUrl: 'https://maps.google.com/?q=Adilabad+Bus+Station' },
};

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const locationHook = useLocation(); // Renamed to avoid conflict
  const { user } = useAuth();
  const queryParams = new URLSearchParams(locationHook.search);

  // Helper functions defined before state initialization
  const calculateTotalHours = (start, end) => {
    if (!start || !end) return 0;
    const startDateTime = new Date(start);
    const endDateTime = new Date(end);
    return Math.max(1, Math.ceil((endDateTime - startDateTime) / (1000 * 60 * 60)));
  };

  const calculateTotalPrice = (start, end, rate) => {
    if (!start || !end || !rate) return 0;
    const hours = calculateTotalHours(start, end);
    return hours * rate;
  };

  // Format datetime for input fields
  const formatDateTimeForInput = (dateTimeString) => {
    if (!dateTimeString) return '';
    if (dateTimeString.includes('T')) {
      return dateTimeString.substring(0, 16); // Ensure seconds are not included
    }
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
    now.setMilliseconds(0); // Also clear milliseconds
    // Adjust for timezone offset to get local time in ISO format
    const timezoneOffset = now.getTimezoneOffset() * 60000; // Offset in milliseconds
    const localISOTime = new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  // State initialization
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState({
    startDate: formatDateTimeForInput(queryParams.get('start') || ''),
    endDate: formatDateTimeForInput(queryParams.get('end') || ''),
    selectedCity: queryParams.get('location') || '',
    pickupAddress: '', // Added
    pickupMapsUrl: '', // Added
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    totalPrice: 0
  });

  // Fetch Vehicle Data
  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      try {
        const vehicleData = await getVehicleById(id);
        if (!vehicleData) {
          setError('Vehicle not found');
          return;
        }
        setVehicle(vehicleData);
        // Calculate initial price if dates and rate are available
        if (bookingData.startDate && bookingData.endDate && vehicleData.hourlyRate) {
           const price = calculateTotalPrice(
             bookingData.startDate,
             bookingData.endDate,
             vehicleData.hourlyRate
           );
           setBookingData(prev => ({ ...prev, totalPrice: price }));
         }
      } catch (err) {
        console.error('Error fetching vehicle:', err);
        setError('Error loading vehicle details: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVehicle();
    } else {
      setError('No vehicle ID provided');
      setLoading(false);
    }
  }, [id]); // Only depends on id

  // Update Pickup Location based on City
  useEffect(() => {
    if (bookingData.selectedCity) {
      const cityKey = bookingData.selectedCity.toLowerCase().trim();
      const locationInfo = pickupLocations[cityKey];
      if (locationInfo) {
        setBookingData(prev => ({
          ...prev,
          pickupAddress: locationInfo.address,
          pickupMapsUrl: locationInfo.mapsUrl
        }));
      } else {
        // Handle case where city might be valid but not in our specific list (though LocationValidator should prevent this)
        setBookingData(prev => ({
          ...prev,
          pickupAddress: 'Location to be confirmed',
          pickupMapsUrl: ''
        }));
        console.warn(`No specific pickup location defined for city: ${bookingData.selectedCity}`);
      }
    } else {
       setBookingData(prev => ({
          ...prev,
          pickupAddress: '',
          pickupMapsUrl: ''
        }));
    }
  }, [bookingData.selectedCity]);

  // Update Total Price when Dates or Vehicle changes
  useEffect(() => {
    if (vehicle && bookingData.startDate && bookingData.endDate) {
      const price = calculateTotalPrice(
        bookingData.startDate,
        bookingData.endDate,
        vehicle.hourlyRate
      );
      setBookingData(prev => ({ ...prev, totalPrice: price }));
    } else {
      // Reset price if dates are incomplete or vehicle not loaded
      setBookingData(prev => ({ ...prev, totalPrice: 0 }));
    }
  }, [bookingData.startDate, bookingData.endDate, vehicle]);


  if (loading && !vehicle) { // Show loader only during initial vehicle load
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (error && !vehicle) { // Show error if vehicle fetch failed
    return <div className="min-h-screen flex items-center justify-center text-red-600 p-4 text-center">Error: {error}</div>;
  }

  if (!vehicle) { // Handles the case where loading finished but vehicle is still null (e.g., not found)
     return (
       <div className="container py-16 text-center">
         <h2 className="text-2xl font-bold mb-4">Vehicle Not Found</h2>
         <p className="mb-8">The vehicle you're looking for doesn't exist or has been removed.</p>
         <Link to="/" className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
           Back to Home
         </Link>
       </div>
     );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationValidation = (isValid) => {
    if (!isValid && bookingData.selectedCity) { // Only navigate if an invalid city was actually entered
        setError(`Service not available in ${bookingData.selectedCity}. Please choose a valid city.`);
        // Optionally clear the city or navigate away
        // navigate('/location-not-served', { state: { location: bookingData.selectedCity } });
    } else {
        // If location becomes valid, clear any previous location errors
        if (error.startsWith('Service not available')) {
            setError('');
        }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Indicate processing

    if (!user) {
      setError("You must be logged in to book.");
      setLoading(false);
      return; // Redirect to login?
    }

    // Basic date validation
    const now = new Date();
    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
     // Allow a small buffer (e.g., 5 minutes) for current time comparison
    const minStartDate = new Date(now.getTime() - 5 * 60000);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        setError("Invalid date format entered.");
        setLoading(false);
        return;
    }
    if (start < minStartDate) {
        setError("Pickup time cannot be in the past.");
        setLoading(false);
        return;
    }
    if (end <= start) {
        setError("Return time must be after pickup time.");
        setLoading(false);
        return;
    }
     if (!bookingData.pickupAddress || bookingData.pickupAddress === 'Location to be confirmed') {
        setError("Pickup location could not be determined. Please ensure a valid city is selected.");
        setLoading(false);
        return;
    }


    try {
      console.log('Checking availability...');
      const isAvailable = await checkVehicleAvailability(
        id,
        bookingData.startDate,
        bookingData.endDate
      );

      if (!isAvailable) {
        setError('Sorry, this vehicle is not available for the selected time slot. Please choose different times.');
        setLoading(false);
        return;
      }

      console.log('Creating booking...');
      const bookingDetailsToSave = {
        userId: user.uid,
        userEmail: user.email, // Include user email for notifications
        userName: user.displayName || `${bookingData.firstName} ${bookingData.lastName}`, // Get display name or use form names
        vehicleId: id,
        vehicle: { // Store basic vehicle info for easy access
            name: vehicle.name,
            type: vehicle.type,
            hourlyRate: vehicle.hourlyRate,
            image: vehicle.image || ''
        },
        bookingDetails: { // Nested object for specific booking times/locations etc.
            pickupDateTime: bookingData.startDate,
            returnDateTime: bookingData.endDate,
            totalHours: calculateTotalHours(bookingData.startDate, bookingData.endDate),
            location: bookingData.selectedCity, // The city selected
            pickupAddress: bookingData.pickupAddress, // The specific address
            pickupMapsUrl: bookingData.pickupMapsUrl, // The map link
            phone: bookingData.phone // Customer phone number
        },
        customerDetails: { // Keeping this separate might be redundant if userName/userEmail is stored above
          firstName: bookingData.firstName,
          lastName: bookingData.lastName,
          email: bookingData.email, // Can be different from user.email if needed? Usually same.
          phone: bookingData.phone
        },
        totalAmount: bookingData.totalPrice,
        status: 'confirmed', // Booking is confirmed upon creation here
        paymentStatus: 'pending', // Payment is typically handled next
        createdAt: new Date().toISOString()
      };
      console.log('Saving booking:', bookingDetailsToSave);

      const bookingId = await createBooking(bookingDetailsToSave);
      console.log('Booking created successfully with ID:', bookingId);

      // Navigate to success page with necessary info
      navigate('/booking-success', {
        state: {
          bookingId: bookingId,
          vehicleName: vehicle.name,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          totalPrice: bookingData.totalPrice.toFixed(2),
          customerName: `${bookingData.firstName} ${bookingData.lastName}`,
          pickupAddress: bookingData.pickupAddress, // Pass address
          pickupMapsUrl: bookingData.pickupMapsUrl   // Pass map link
        }
      });

    } catch (err) {
      console.error('Detailed booking error:', err);
      setError('Failed to create booking: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6 text-sm"
      >
        <FaArrowLeft className="mr-2" /> Back
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="md:flex">
          {/* Left side: Image and Vehicle details */}
          <div className="md:w-1/3 p-4 bg-gray-50 flex flex-col items-center justify-center">
             <img
               src={vehicle.image || 'https://via.placeholder.com/300x200?text=Vehicle+Image'}
               alt={vehicle.name}
               className="w-full h-auto object-cover rounded-md mb-4 max-w-xs"
              />
             <h2 className="text-xl font-semibold text-gray-800">{vehicle.name}</h2>
             <p className="text-gray-600">{vehicle.type}</p>
             <p className="text-lg font-bold text-blue-600 mt-2">₹{vehicle.hourlyRate}/hour</p>
          </div>

          {/* Right side: Form */}
          <div className="md:w-2/3 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h1>
             <form onSubmit={handleSubmit} className="space-y-5">
               {/* Location Info */}
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                  </label>
                  <input
                      type="text"
                      name="selectedCity"
                      value={bookingData.selectedCity}
                      onChange={handleInputChange}
                      placeholder="Enter city (e.g., Hyderabad)"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      list="cities" // Use datalist from SearchForm for suggestions
                    />
                    {/* Re-use the datalist from SearchForm - requires validCities array */}
                     <datalist id="cities">
                        {Object.keys(pickupLocations).map(cityKey => (
                            <option key={cityKey} value={cityKey.charAt(0).toUpperCase() + cityKey.slice(1)} />
                        ))}
                     </datalist>
                     {/* Component to validate the entered city */}
                     <LocationValidator
                        city={bookingData.selectedCity}
                        onValidLocation={() => handleLocationValidation(true)}
                        onInvalidLocation={() => handleLocationValidation(false)}
                      />
                </div>

               {/* Display Pickup Location */}
                {bookingData.pickupAddress && (
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <p className="text-sm font-medium text-gray-700 mb-1">Pickup & Drop-off Location:</p>
                        <p className="text-gray-800 font-semibold">{bookingData.pickupAddress}</p>
                        {bookingData.pickupMapsUrl && (
                            <a
                                href={bookingData.pickupMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-indigo-600 hover:text-indigo-800 mt-1 inline-flex items-center"
                            >
                                <FaMapMarkerAlt className="mr-1" /> View on Map
                            </a>
                        )}
                    </div>
                )}


              {/* Time Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={bookingData.startDate}
                    onChange={handleInputChange}
                    min={getCurrentDateTimeString()}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={bookingData.endDate}
                    onChange={handleInputChange}
                    min={bookingData.startDate || getCurrentDateTimeString()}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

               {/* Price Calculation Display */}
              {bookingData.totalPrice > 0 && (
                 <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                   <div className="flex justify-between items-center flex-wrap gap-2">
                     <div className='text-center'>
                       <p className="text-xs text-gray-500">Duration</p>
                       <p className="text-md font-medium">
                         {calculateTotalHours(bookingData.startDate, bookingData.endDate)} hours
                       </p>
                     </div>
                     <div className='text-center'>
                       <p className="text-xs text-gray-500">Rate</p>
                       <p className="text-md font-medium">₹{vehicle.hourlyRate}/hr</p>
                     </div>
                     <div className='text-center'>
                       <p className="text-xs text-gray-500">Estimated Total</p>
                       <p className="text-lg font-bold text-blue-600">₹{bookingData.totalPrice.toFixed(2)}</p>
                     </div>
                   </div>
                 </div>
              )}

              {/* Personal Information */}
              <div>
                 <h3 className="text-lg font-medium text-gray-900 mb-3">Your Information</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input type="text" name="firstName" value={bookingData.firstName} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input type="text" name="lastName" value={bookingData.lastName} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email" value={bookingData.email} onChange={handleInputChange} placeholder={user?.email || 'your@email.com'} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input type="tel" name="phone" value={bookingData.phone} onChange={handleInputChange} placeholder="e.g., 9876543210" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required pattern="[0-9]{10}" title="Please enter a 10-digit phone number"/>
                    </div>
                 </div>
               </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading || !bookingData.startDate || !bookingData.endDate || !bookingData.pickupAddress || bookingData.totalPrice <= 0}
              >
                 {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-2"/> Confirm Booking
                    </>
                  )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;

