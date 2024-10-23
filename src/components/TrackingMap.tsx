import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { trackBooking, getBooking } from '../services/api';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TrackingMap: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [driverLocation, setDriverLocation] = useState({ lat: 0, lng: 0 });
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const bookingData = await getBooking(parseInt(bookingId!));
        setBooking(bookingData);
      } catch (error) {
        console.error('Error fetching booking:', error);
      }
    };

    fetchBooking();

    const trackingInterval = setInterval(() => {
      trackBooking(parseInt(bookingId!), (data) => {
        setDriverLocation(data.location);
      });
    }, 5000);

    return () => clearInterval(trackingInterval);
  }, [bookingId]);

  if (!booking) return <div>Loading...</div>;

  const routeCoordinates = booking.route ? booking.route.coordinates.map(coord => [coord[1], coord[0]]) : [];

  return (
    <div className="h-[calc(100vh-64px)]">
      <h2 className="text-2xl font-bold mb-4">Tracking Booking #{bookingId}</h2>
      <div className="h-full">
        <MapContainer
          center={[booking.pickup.lat, booking.pickup.lng]}
          zoom={13}
          style={{ height: 'calc(100% - 100px)', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[booking.pickup.lat, booking.pickup.lng]} />
          <Marker position={[booking.dropoff.lat, booking.dropoff.lng]} />
          {driverLocation.lat !== 0 && driverLocation.lng !== 0 && (
            <Marker position={[driverLocation.lat, driverLocation.lng]} />
          )}
          {routeCoordinates.length > 0 && (
            <Polyline positions={routeCoordinates} color="blue" />
          )}
        </MapContainer>
      </div>
      <div className="mt-4 p-4 bg-white rounded-lg shadow">
        <p><strong>Status:</strong> {booking?.status}</p>
        <p><strong>Vehicle Type:</strong> {booking?.vehicleType}</p>
        <p><strong>Estimated Price:</strong> ${booking?.estimatedPrice}</p>
      </div>
    </div>
  );
};

export default TrackingMap;