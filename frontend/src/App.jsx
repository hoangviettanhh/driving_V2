import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { VoiceProvider } from './contexts/VoiceContext'
import { TestSessionProvider } from './contexts/TestSessionContext'

// Import pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TestListPage from './pages/TestListPage'
import TestDetailPage from './pages/TestDetailPage'
import ScoreHistoryPage from './pages/ScoreHistoryPage'

// Import layout components
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Auth/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <VoiceProvider>
        <TestSessionProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected routes with layout */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/tests" element={
                <ProtectedRoute>
                  <Layout>
                    <TestListPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/test/:testNumber" element={
                <ProtectedRoute>
                  <Layout>
                    <TestDetailPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/history" element={
                <ProtectedRoute>
                  <Layout>
                    <ScoreHistoryPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* 404 fallback */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Trang không tồn tại</h2>
                    <p className="text-gray-600 mb-4">Trang bạn tìm kiếm không được tìm thấy</p>
                    <a 
                      href="/" 
                      className="btn-primary"
                    >
                      Về trang chủ
                    </a>
                  </div>
                </div>
              } />
            </Routes>
          </div>
        </TestSessionProvider>
      </VoiceProvider>
    </AuthProvider>
  )
}

export default App