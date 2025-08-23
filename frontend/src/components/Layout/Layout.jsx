import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useVoice } from '../../contexts/VoiceContext'
import { useTestSession } from '../../contexts/TestSessionContext'
import { LogOut, Volume2, VolumeX, User, Home, List, History, Settings } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const { isEnabled: voiceEnabled, toggleEnabled: toggleVoice, isSpeaking } = useVoice()
  const { currentSession } = useTestSession()
  const location = useLocation()

  const navigation = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Danh sách bài thi', href: '/tests', icon: List },
    { name: 'Lịch sử', href: '/history', icon: History },
    { name: 'Cài đặt', href: '/settings', icon: Settings },
  ]

  const isActivePath = (path) => {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 safe-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Driving Test</h1>
                <p className="text-xs text-gray-500">Chấm điểm thi lái xe</p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2">
              {/* Voice Toggle */}
              <button
                onClick={toggleVoice}
                className={`voice-btn ${isSpeaking ? 'animate-pulse' : ''}`}
                title={voiceEnabled ? 'Tắt giọng đọc' : 'Bật giọng đọc'}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user?.full_name || user?.username}
                  </span>
                </button>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Current Session Indicator */}
          {currentSession && (
            <div className="mt-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-900">
                    Đang thi: {currentSession.student_name}
                  </p>
                  <p className="text-xs text-primary-600">
                    Điểm hiện tại: {currentSession.totalScore}/100
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-primary-600">
                    Bài {currentSession.currentTestNumber || 1}/11
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
        <div className="px-4 py-2">
          <div className="flex items-center justify-around">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = isActivePath(item.href)
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}

export default Layout