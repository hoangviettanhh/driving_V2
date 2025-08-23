import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingCar from '../LoadingCar'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingCar message="Đang kiểm tra xác thực..." />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    console.log('🔒 ProtectedRoute: Redirecting to login - authenticated:', isAuthenticated, 'user:', !!user)
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // User is authenticated, render children
  return <>{children}</>
}

export default ProtectedRoute