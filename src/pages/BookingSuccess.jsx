import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaHome, FaList, FaTicketAlt, FaCreditCard, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const BookingSuccess = () => {
  const location = useLocation();
  const bookingInfo = location.state || {}; // Contains { bookingId, vehicleName, startDate, endDate, totalPrice, customerName, pickupAddress, pickupMapsUrl }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-6">
          <FaCheckCircle className="text-green-500 text-6xl inline-block" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
          Booking Confirmed!
        </h1>

        <p className="text-gray-600 mb-6 text-center">
          Thank you for choosing RideRental. Your booking is successful.
        </p>

        {/* Email Confirmation Message */}
        <div className="flex items-center justify-center text-sm text-blue-600 mb-8 p-3 bg-blue-50 rounded-md">
          <FaEnvelope className="mr-2 flex-shrink-0" />
          <span>A confirmation email with your booking details has been sent to your registered email address.</span>
        </div>

        {/* Booking Details Section */}
        {bookingInfo.bookingId && (
          <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Booking Summary</h2>
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-500">Booking Reference ID</p>
              <p className="text-lg font-mono font-bold text-indigo-600">{bookingInfo.bookingId}</p>
            </div>

            <div className="space-y-4 text-sm">
              {/* Pickup Location */}
              {bookingInfo.pickupAddress && (
                <div className="p-3 bg-indigo-100 rounded-md">
                  <p className="font-semibold text-gray-700 mb-1">Pickup & Drop-off Location:</p>
                  <p className="text-gray-800">{bookingInfo.pickupAddress}</p>
                  {bookingInfo.pickupMapsUrl && (
                    <a
                      href={bookingInfo.pickupMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 mt-1 inline-flex items-center text-xs font-medium"
                    >
                      <FaMapMarkerAlt className="mr-1" /> View on Map
                    </a>
                  )}
                </div>
              )}

              {/* Vehicle */}
              {bookingInfo.vehicleName && (
                <div className="flex justify-between items-center">
                  <p className="text-gray-500">Vehicle:</p>
                  <p className="font-medium text-gray-800">{bookingInfo.vehicleName}</p>
                </div>
              )}

              {/* Booking Period */}
              {bookingInfo.startDate && bookingInfo.endDate && (
                <div className="flex justify-between items-center">
                  <p className="text-gray-500">Period:</p>
                  <p className="font-medium text-gray-800">
                    {new Date(bookingInfo.startDate).toLocaleString()} -
                    <br/> {new Date(bookingInfo.endDate).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Customer */}
              {bookingInfo.customerName && (
                <div className="flex justify-between items-center">
                  <p className="text-gray-500">Booked By:</p>
                  <p className="font-medium text-gray-800">{bookingInfo.customerName}</p>
                </div>
              )}

              {/* Total Amount */}
              {bookingInfo.totalPrice && (
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                  <p className="text-gray-500 font-semibold">Total Amount:</p>
                  <p className="font-bold text-lg text-green-600">₹{bookingInfo.totalPrice}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Link to Payment - Conditional if payment needed */}
          {/* {bookingInfo.bookingId && bookingInfo.paymentStatus !== 'paid' && ( */} 
          {bookingInfo.bookingId && (
            <Link
              to={`/payment/${bookingInfo.bookingId}`}
              className="block w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition-colors duration-300 flex items-center justify-center text-center font-medium"
            >
              <FaCreditCard className="mr-2" />
              Proceed to Payment
            </Link>
          )}
          {/* ) } */} 

          <Link
            to="/my-bookings"
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center text-center font-medium"
          >
            <FaTicketAlt className="mr-2" />
            View My Bookings
          </Link>

          <Link
            to="/"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-200 transition-colors duration-300 flex items-center justify-center text-center"
          >
            <FaHome className="mr-2" />
            Return to Home
          </Link>

          <Link
            to="/cars" // Or dynamically based on last search?
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-200 transition-colors duration-300 flex items-center justify-center text-center"
          >
            <FaList className="mr-2" />
            Browse More Vehicles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
