import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, DollarSign } from 'lucide-react';
import { getBookings } from '../services/api';

const UserDashboard: React.FC = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      const fetchedBookings = await getBookings();
      setBookings(fetchedBookings);
    };
    fetchBookings();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/book" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <Package className="w-12 h-12 text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Book a Service</h2>
          <p>Schedule a transportation service for your goods</p>
        </Link>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <MapPin className="w-12 h-12 text-green-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Active Bookings</h2>
          <p>{bookings.filter(b => b.status !== 'completed').length} active bookings</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <DollarSign className="w-12 h-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Total Spent</h2>
          <p>${bookings.reduce((total, b) => total + parseFloat(b.estimatedPrice), 0).toFixed(2)}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Your Bookings</h2>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">ID</th>
              <th className="text-left">Status</th>
              <th className="text-left">Vehicle</th>
              <th className="text-left">Price</th>
              <th className="text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking.id}>
                <td>{booking.id}</td>
                <td>{booking.status}</td>
                <td>{booking.vehicleType}</td>
                <td>${booking.estimatedPrice}</td>
                <td>
                  <Link to={`/track/${booking.id}`} className="text-blue-500 hover:underline">
                    Track
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserDashboard;