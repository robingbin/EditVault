import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requireRole }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e0f]">
        <Loader2 className="w-6 h-6 text-[#2dd4bf] animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireRole && profile?.role !== requireRole) {
    // Redirect to their own home if role mismatch
    return <Navigate to={profile?.role === 'admin' ? '/admin' : '/portal'} replace />;
  }

  return children;
}
