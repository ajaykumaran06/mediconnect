import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, Home } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const ROLE_DASHBOARD = {
  patient: '/patient',
  doctor:  '/doctor',
  admin:   '/admin',
};

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-6 text-center">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-primary-600 mb-12">
        <Heart className="w-6 h-6 fill-primary-100 text-primary-500" />
        MediConnect
      </Link>

      {/* Illustration */}
      <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-gray-100 mb-8">
        <span className="text-6xl select-none" aria-hidden="true">🩺</span>
      </div>

      <h1 className="font-display text-5xl font-bold text-gray-900 mb-3">404</h1>
      <p className="text-xl font-semibold text-gray-700 mb-2">Page Not Found</p>
      <p className="text-gray-500 max-w-sm mb-10">
        The page you're looking for doesn't exist or may have been moved.
      </p>

      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
        <Link
          to={isAuthenticated ? ROLE_DASHBOARD[user?.role] : '/'}
          className="flex items-center gap-2 bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <Home className="w-4 h-4" />
          {isAuthenticated ? 'Back to Dashboard' : 'Home'}
        </Link>
      </div>
    </div>
  );
}
