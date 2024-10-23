import React, { useState, useEffect } from 'react';
import { Clipboard, Navigation2, CheckCircle, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { acceptBooking, updateBookingStatus, onNewBooking, onBookingUpdated, updateDriverLocation } from '../services/api';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DraggableMarker = ({ position, onDragEnd }) => {
  const markerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
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

const DriverDashboard: React.FC = () => {
  const [driver, setDriver] = useState<any>(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState({ lat: 40.7128, lng: -74.0060 });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setDriver(user);

    // Set up socket listeners for new bookings and updates
    onNewBooking((booking) => {
      setAvailableJobs(prev => [...prev, booking]);
    });

    onBookingUpdated((updatedBooking) => {
      if (currentJob && currentJob.id === updatedBooking.id) {
        setCurrentJob(updatedBooking);
      }
    });

    // Start sending driver location updates
    const locationInterval = setInterval(() => {
      if (driver?.id) {
        updateDriverLocation(driver.id, driverLocation);
      }
    }, 10000);

    return () => clearInterval(locationInterval);
  }, [driver?.id, driverLocation]);

  const handleLocationUpdate = async (newLocation) => {
    setDriverLocation(newLocation);
    if (driver?.id) {
      await updateDriverLocation(driver.id, newLocation);
    }
  };

  const acceptJob = async (job) => {
    try {
      const updatedJob = await acceptBooking(driver.id, job.id);
      setCurrentJob(updatedJob);
      setAvailableJobs(prev => prev.filter(j => j.id !== job.id));
    } catch (error) {
      console.error('Error accepting job:', error);
    }
  };

  const updateJobStatus = async (status) => {
    try {
      const updatedJob = await updateBookingStatus(driver.id, currentJob.id, status);
      setCurrentJob(updatedJob);
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Driver Dashboard</h1>
      
      {/* Driver Location Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Your Location</h2>
        <div style={{ height: '300px' }}>
          <MapContainer
            center={[driverLocation.lat, driverLocation.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <DraggableMarker
              position={driverLocation}
              onDragEnd={handleLocationUpdate}
            />
          </MapContainer>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Drag the marker to update your location
        </p>
      </div>

      {/* Available Jobs Section */}
      {!currentJob && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Available Jobs</h2>
          {availableJobs.length === 0 ? (
            <p className="text-gray-500">No available jobs at the moment</p>
          ) : (
            <div className="space-y-4">
              {availableJobs.map(job => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Booking #{job.id}</h3>
                      <p className="text-sm text-gray-600">Distance: {(job.distance / 1000).toFixed(2)} km</p>
                      <p className="text-sm text-gray-600">Vehicle: {job.vehicleType}</p>
                      <p className="text-sm text-gray-600">Price: ${job.estimatedPrice}</p>
                    </div>
                    <button
                      onClick={() => acceptJob(job)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Current Job Section */}
      {currentJob && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Current Job: #{currentJob.id}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Distance: {(currentJob.distance / 1000).toFixed(2)} km</p>
                <p className="text-sm text-gray-600">Vehicle: {currentJob.vehicleType}</p>
                <p className="text-sm text-gray-600">Price: ${currentJob.estimatedPrice}</p>
                <p className="text-sm text-gray-600">Status: {currentJob.status}</p>
              </div>
              <div className="flex space-x-2 justify-end">
                <button
                  onClick={() => updateJobStatus('en route')}
                  disabled={currentJob.status !== 'accepted'}
                  className="flex items-center space-x-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
                >
                  <Navigation2 size={20} />
                  <span>En Route</span>
                </button>
                <button
                  onClick={() => updateJobStatus('picked up')}
                  disabled={currentJob.status !== 'en route'}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  <Clipboard size={20} />
                  <span>Picked Up</span>
                </button>
                <button
                  onClick={() => updateJobStatus('completed')}
                  disabled={currentJob.status !== 'picked up'}
                  className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  <CheckCircle size={20} />
                  <span>Complete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;