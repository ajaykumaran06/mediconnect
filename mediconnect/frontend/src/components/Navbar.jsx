import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Heart, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react';
import useAuthStore from '../store/authStore';
import NotificationBell from './NotificationBell';
import toast from 'react-hot-toast';

const ROLE_DASHBOARD = {
  patient: '/patient',
  doctor: '/doctor',
  admin: '/admin',
};

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-primary-600">
            <Heart className="w-6 h-6 text-primary-500 fill-primary-100" />
            MediConnect
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <Link to="/patient/symptoms" className="hover:text-primary-600 transition-colors">Symptom Checker</Link>
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="hover:text-primary-600 transition-colors">Login</Link>
                <Link to="/signup" className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors">
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <NotificationBell />
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    {user?.name?.split(' ')[0]}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <Link
                        to={ROLE_DASHBOARD[user?.role]}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 py-3 px-4 space-y-2">
          <Link to="/" className="block py-2 text-sm text-gray-700" onClick={() => setMenuOpen(false)}>Home</Link>
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="block py-2 text-sm text-gray-700" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/signup" className="block py-2 text-sm text-primary-600 font-medium" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          ) : (
            <>
              <Link to={ROLE_DASHBOARD[user?.role]} className="block py-2 text-sm text-gray-700" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <button onClick={handleLogout} className="block py-2 text-sm text-red-600">Logout</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
