import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import UserDashboard from './pages/UserDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BookingForm from './components/BookingForm';
import TrackingMap from './components/TrackingMap';
import Login from './components/Login';
import { setAuthToken } from './services/api';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setAuthToken(token);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData.user);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData.user));
    setAuthToken(userData.token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header user={user} onLogout={handleLogout} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route
              path="/"
              element={
                user ? (
                  user.role === 'customer' ? (
                    <UserDashboard />
                  ) : user.role === 'driver' ? (
                    <DriverDashboard />
                  ) : (
                    <AdminDashboard />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/book"
              element={user && user.role === 'customer' ? <BookingForm /> : <Navigate to="/login" />}
            />
            <Route
              path="/track/:bookingId"
              element={user ? <TrackingMap /> : <Navigate to="/login" />}
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;