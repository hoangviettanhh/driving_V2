import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Configure axios defaults - PRODUCTION SAFE
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://backend-production-ffdc.up.railway.app/api'  // Production backend
    : 'http://localhost:5000/api'  // Local development - FIXED PORT
  )

console.log('🔗 API URL:', API_URL)
axios.defaults.baseURL = API_URL
axios.defaults.headers.common['Accept'] = 'application/json; charset=utf-8'
axios.defaults.headers.post['Content-Type'] = 'application/json; charset=utf-8'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('driving_test_token')
      console.log('🔍 Checking auth status, token:', token ? 'exists' : 'missing')
      
      if (token) {
        // Set token in axios headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        try {
          // Verify token with backend
          const response = await axios.get('/auth/profile')
          console.log('✅ Profile response:', response.data)
          
          if (response.data.success) {
            setUser(response.data.data)
            setIsAuthenticated(true)
            console.log('✅ Auth restored successfully')
          } else {
            throw new Error('Profile response not successful')
          }
        } catch (profileError) {
          console.error('❌ Profile check failed:', profileError.response?.status, profileError.response?.data)
          // Token invalid, clear it
          localStorage.removeItem('driving_test_token')
          delete axios.defaults.headers.common['Authorization']
          setUser(null)
          setIsAuthenticated(false)
        }
      } else {
        console.log('❌ No token found')
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error)
      // Clear invalid token
      localStorage.removeItem('driving_test_token')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      setIsLoading(true)
      const response = await axios.post('/auth/login', {
        username,
        password
      })

      if (response.data.success) {
        const { token, user: userData } = response.data.data
        
        // Store token
        localStorage.setItem('driving_test_token', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // Update state
        setUser(userData)
        setIsAuthenticated(true)
        
        return { success: true, message: 'Đăng nhập thành công' }
      } else {
        return { success: false, message: response.data.error?.message || 'Đăng nhập thất bại' }
      }
    } catch (error) {
      console.error('Login error:', error)
      const message = error.response?.data?.error?.message || 'Lỗi kết nối server'
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setIsLoading(true)
      const response = await axios.post('/auth/register', userData)

      if (response.data.success) {
        return { success: true, message: 'Đăng ký thành công. Vui lòng đăng nhập.' }
      } else {
        return { success: false, message: response.data.error?.message || 'Đăng ký thất bại' }
      }
    } catch (error) {
      console.error('Register error:', error)
      const message = error.response?.data?.error?.message || 'Lỗi kết nối server'
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('driving_test_token')
      
      if (token) {
        // Set authorization header for logout request
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        try {
          // Call backend logout to clear active_token for teachers
          await axios.post('/auth/logout')
          console.log('✅ Logout API called successfully')
        } catch (error) {
          console.warn('⚠️ Logout API failed (but continuing):', error.message)
          // Continue with logout even if API fails
        }
      }
    } catch (error) {
      console.warn('⚠️ Logout process error:', error.message)
    } finally {
      // Always clear local data regardless of API result
      localStorage.removeItem('driving_test_token')
      delete axios.defaults.headers.common['Authorization']
      
      // Update state
      setUser(null)
      setIsAuthenticated(false)
      
      console.log('🚪 Logout completed - redirecting to login')
      
      // Redirect to login
      window.location.href = '/login'
    }
  }

  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true)
      const response = await axios.put('/auth/profile', profileData)

      if (response.data.success) {
        setUser(response.data.data)
        return { success: true, message: 'Cập nhật thông tin thành công' }
      } else {
        return { success: false, message: response.data.error?.message || 'Cập nhật thất bại' }
      }
    } catch (error) {
      console.error('Update profile error:', error)
      const message = error.response?.data?.error?.message || 'Lỗi kết nối server'
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    isAdmin: user?.role === 1,
    isTeacher: user?.role === 2,
    login,
    register,
    logout,
    updateProfile,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}