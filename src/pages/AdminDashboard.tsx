import React, { useEffect, useState } from 'react';
import { Truck, Users, BarChart2 } from 'lucide-react';
import { getDrivers, getBookings, trackDriver } from '../services/api';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const AdminDashboard: React.FC = () => {
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [driverLocations, setDriverLocations] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const driversData = await getDrivers();
        setDrivers(driversData);

        const bookingsData = await getBookings();
        setBookings(bookingsData);

        driversData.forEach((driver: any) => {
          trackDriver(driver.id, (location) => {
            setDriverLocations((prev) => ({ ...prev, [driver.id]: location }));
          });
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const calculateAverageDistance = () => {
    if (bookings.length === 0) return 0;
    const totalDistance = bookings.reduce((acc: number, booking: any) => acc + booking.distance, 0);
    return (totalDistance / bookings.length / 1000).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Truck className="w-12 h-12 text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Fleet Management</h2>
          <p>Total Drivers: {drivers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Users className="w-12 h-12 text-green-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Booking Management</h2>
          <p>Total Bookings: {bookings.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <BarChart2 className="w-12 h-12 text-purple-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Analytics</h2>
          <p>Average Booking Distance: {calculateAverageDistance()} km</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Driver Locations</h2>
        <div style={{ height: '400px' }}>
          <MapContainer
            center={[40.7128, -74.0060]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {Object.entries(driverLocations).map(([driverId, location]: [string, any]) => (
              <Marker
                key={driverId}
                position={[location.lat, location.lng]}
              />
            ))}
          </MapContainer>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">All Drivers</h2>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">ID</th>
              <th className="text-left">Name</th>
              <th className="text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver: any) => (
              <tr key={driver.id}>
                <td>{driver.id}</td>
                <td>{driver.name}</td>
                <td>{driver.available ? 'Available' : 'Busy'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">All Bookings</h2>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">ID</th>
              <th className="text-left">Status</th>
              <th className="text-left">Vehicle</th>
              <th className="text-left">Distance</th>
              <th className="text-left">Price</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking: any) => (
              <tr key={booking.id}>
                <td>{booking.id}</td>
                <td>{booking.status}</td>
                <td>{booking.vehicleType}</td>
                <td>{(booking.distance / 1000).toFixed(2)} km</td>
                <td>${booking.estimatedPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;