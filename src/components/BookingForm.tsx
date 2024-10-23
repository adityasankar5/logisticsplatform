import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { createBooking, getVehicleTypes } from '../services/api';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DraggableMarker = ({ position, onDragEnd, color }) => {
  const markerIcon = new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <Marker
      position={[position.lat, position.lng]}
      draggable={true}
      icon={markerIcon}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          onDragEnd({ lat: position.lat, lng: position.lng });
        },
      }}
    />
  );
};

const BookingForm: React.FC = () => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState({
    pickup: { lat: 40.7128, lng: -74.0060 },
    dropoff: { lat: 40.7228, lng: -73.9960 },
    vehicleType: '',
  });
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'initial' | 'estimated' | 'searching' | 'confirmed'>('initial');
  const [bookingId, setBookingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const types = await getVehicleTypes();
        setVehicleTypes(types);
      } catch (error) {
        setError('Failed to load vehicle types');
      }
    };
    fetchVehicleTypes();
  }, []);

  const handleGetEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!booking.vehicleType) {
      setError('Please select a vehicle type');
      setLoading(false);
      return;
    }

    try {
      const result = await createBooking({ ...booking, estimateOnly: true });
      setEstimatedPrice(parseFloat(result.estimatedPrice));
      setBookingStatus('estimated');
    } catch (error: any) {
      setError(error.message || 'Failed to get price estimate');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async () => {
    setError(null);
    setLoading(true);
    setBookingStatus('searching');

    try {
      const result = await createBooking(booking);
      setBookingId(result.id);
      navigate(`/track/${result.id}`);
    } catch (error: any) {
      setError(error.message || 'Failed to create booking');
      setBookingStatus('estimated');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Book a Transport</h2>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleGetEstimate} className="space-y-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Locations</label>
          <div style={{ height: '400px' }}>
            <MapContainer
              center={[booking.pickup.lat, booking.pickup.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <DraggableMarker
                position={booking.pickup}
                onDragEnd={(pos) => setBooking(prev => ({ ...prev, pickup: pos }))}
                color="red"
              />
              <DraggableMarker
                position={booking.dropoff}
                onDragEnd={(pos) => setBooking(prev => ({ ...prev, dropoff: pos }))}
                color="blue"
              />
            </MapContainer>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicleTypes.map((vehicle: any) => (
              <div
                key={vehicle.id}
                className={`p-4 border rounded-md cursor-pointer ${
                  booking.vehicleType === vehicle.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onClick={() => setBooking(prev => ({ ...prev, vehicleType: vehicle.id }))}
              >
                <div className="text-3xl mb-2">{vehicle.icon}</div>
                <div className="font-semibold">{vehicle.name}</div>
                <div className="text-sm text-gray-500">
                  Base: ${vehicle.basePrice}, Per km: ${vehicle.pricePerKm}
                </div>
              </div>
            ))}
          </div>
        </div>
        {bookingStatus === 'initial' && (
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Get Price Estimate'}
          </button>
        )}
      </form>

      {bookingStatus === 'estimated' && estimatedPrice !== null && (
        <div className="mt-4 p-4 bg-green-100 rounded-md">
          <p className="text-green-800 font-semibold">Estimated Price: ${estimatedPrice.toFixed(2)}</p>
          <button
            onClick={handleCreateBooking}
            disabled={loading}
            className="mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Creating Booking...' : 'Confirm Booking'}
          </button>
        </div>
      )}

      {bookingStatus === 'searching' && (
        <div className="mt-4 p-4 bg-blue-100 rounded-md">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <p className="text-blue-800">Searching for nearby drivers...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingForm;