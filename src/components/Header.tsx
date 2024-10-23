import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, LogOut } from 'lucide-react';

const Header: React.FC<{ user: any; onLogout: () => void }> = ({ user, onLogout }) => {
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <Truck size={32} />
          <span className="text-xl font-bold">LogiTech</span>
        </Link>
        {user && (
          <div className="flex items-center space-x-4">
            <span>Welcome, {user.email}</span>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;