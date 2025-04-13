import React from 'react';
import { FaPrint, FaDownload } from 'react-icons/fa';

const Receipt = ({ receipt }) => {
  if (!receipt) return null;
  
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm print:shadow-none">
      {/* Receipt Header */}
      <div className="p-6 border-b bg-gray-50 print:bg-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{receipt.company?.name || 'Ride Rental'}</h2>
            <p className="text-gray-500 text-sm">{receipt.company?.address || ''}</p>
          </div>
          <div className="text-right">
            <button 
              onClick={handlePrint} 
              className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200 mr-2 print:hidden"
              aria-label="Print receipt"
            >
              <FaPrint />
            </button>
          </div>
        </div>
      </div>
      
      {/* Receipt Content */}
      <div className="p-6">
        <div className="mb-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Receipt Number</p>
            <p className="font-medium">{receipt.receiptNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium">
              {new Date(receipt.timestamp).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="bg-green-50 text-green-800 px-4 py-2 rounded-md mb-6 font-medium">
          {receipt.status || 'Paid'}
        </div>
        
        {/* Customer Info */}
        <div className="mb-6">
          <h3 className="text-gray-500 text-sm mb-2">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-xs">Name</p>
              <p className="font-medium">{receipt.customer?.name || 'Customer'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Email</p>
              <p className="font-medium">{receipt.customer?.email || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        {/* Booking Details */}
        <div className="mb-6">
          <h3 className="text-gray-500 text-sm mb-2">Booking Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-xs">Booking ID</p>
              <p className="font-medium">{receipt.booking?.id || receipt.bookingId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Vehicle</p>
              <p className="font-medium">{receipt.booking?.vehicle || 'Vehicle'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Period</p>
              <p className="font-medium">{receipt.booking?.startDate || 'N/A'} - {receipt.booking?.endDate || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Duration</p>
              <p className="font-medium">{receipt.booking?.duration || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        {/* Payment Summary */}
        <div className="mb-6">
          <h3 className="text-gray-500 text-sm mb-2">Payment Summary</h3>
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-2">Vehicle Rental</td>
                <td className="py-2 text-right">₹{receipt.payment?.subtotal?.toFixed(2) || '0.00'}</td>
              </tr>
              <tr>
                <td className="py-2">Tax (18% GST)</td>
                <td className="py-2 text-right">₹{receipt.payment?.tax?.toFixed(2) || '0.00'}</td>
              </tr>
              <tr className="font-bold">
                <td className="py-2">Total</td>
                <td className="py-2 text-right">₹{receipt.payment?.total?.toFixed(2) || '0.00'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Payment Info */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-xs">Payment ID</p>
              <p className="font-medium">{receipt.paymentId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Payment Method</p>
              <p className="font-medium">Razorpay</p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4 text-center text-gray-500 text-sm">
          <p>Thank you for your business!</p>
          <p>For any queries, please contact us at {receipt.company?.email || 'support@riderental.com'}</p>
        </div>
      </div>
    </div>
  );
};

export default Receipt; 