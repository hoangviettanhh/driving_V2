import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useVoice } from '../contexts/VoiceContext'
import { useTestSession } from '../contexts/TestSessionContext'
import { Plus, Play, History, Users, Trophy, Clock, Settings } from 'lucide-react'
import VoiceTestComponent from '../components/VoiceTestComponent'

const DashboardPage = () => {
  const { user } = useAuth()
  const { speakWelcome } = useVoice()
  const { currentSession, sessionHistory, loadSessionHistory } = useTestSession()
  const hasSpokenWelcomeRef = useRef(false)

  // Welcome message on load - only once when user is available
  useEffect(() => {
    if (user && user.full_name && !hasSpokenWelcomeRef.current) {
      console.log('🎵 Speaking welcome for:', user.full_name)
      hasSpokenWelcomeRef.current = true
      speakWelcome(user.full_name || user.username)
    }
  }, [user?.id]) // Only depend on user ID

  // Load session history on mount
  useEffect(() => {
    loadSessionHistory()
  }, []) // Remove loadSessionHistory from dependencies to prevent loop

  // Quick stats
  const stats = {
    totalSessions: sessionHistory.length || 0,
    completedToday: sessionHistory.filter(session => {
      const today = new Date().toDateString()
      const sessionDate = new Date(session.started_at).toDateString()
      return sessionDate === today && session.status === 'completed'
    }).length || 0,
    averageScore: (() => {
      const completedSessions = sessionHistory.filter(s => s.status === 'completed')
      if (completedSessions.length === 0) return 0
      
      const totalScore = completedSessions.reduce((sum, s) => sum + (s.total_score || 0), 0)
      const average = totalScore / completedSessions.length
      return Math.round(average) || 0
    })()
  }

  return (
    <div className="p-3 sm:p-4 space-y-4 sm:space-y-6 pb-20 max-w-lg mx-auto">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-blue-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white shadow-lg">
        <h2 className="text-lg sm:text-xl font-bold mb-2 leading-tight">
          Chào mừng, {user?.full_name || user?.username}!
        </h2>
        <p className="text-sm sm:text-base text-primary-100 leading-relaxed">
          Sẵn sàng cho buổi thi hôm nay. Chúc bạn có một ngày làm việc hiệu quả!
        </p>
      </div>

      {/* Current Session */}
      {currentSession && (
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg sm:rounded-t-xl">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Phiên thi đang diễn ra</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{currentSession.student_name}</p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Bài {currentSession.currentTestNumber || 1}/11
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xl sm:text-2xl font-bold text-primary-600">
                  {currentSession.totalScore || 0}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">điểm</p>
              </div>
            </div>
            <Link
              to="/tests"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Tiếp tục thi</span>
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 px-1">Thao tác nhanh</h3>
        
        <div className="space-y-3">
          <Link
            to="/tests"
            className="bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200 block"
          >
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-success-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">Bắt đầu thi mới</h4>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Tạo phiên thi cho học viên</p>
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/history"
            className="bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200 block"
          >
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <History className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">Xem lịch sử</h4>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Kết quả các phiên thi trước</p>
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/settings"
            className="bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200 block"
          >
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">Cài đặt</h4>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Giọng nói và tùy chọn khác</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="space-y-3">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 px-1">Thống kê</h3>
        
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-100">
            <div className="p-3 sm:p-4 text-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalSessions || 0}</p>
              <p className="text-xs text-gray-600 leading-tight">Tổng phiên thi</p>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-100">
            <div className="p-3 sm:p-4 text-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-success-600" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.completedToday || 0}</p>
              <p className="text-xs text-gray-600 leading-tight">Hoàn thành hôm nay</p>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-100">
            <div className="p-3 sm:p-4 text-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-warning-600" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.averageScore || 0}</p>
              <p className="text-xs text-gray-600 leading-tight">Điểm TB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      {sessionHistory.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 px-1">Phiên thi gần đây</h3>
          
          <div className="space-y-2 sm:space-y-3">
            {sessionHistory.slice(0, 3).map((session) => (
              <div key={session.id} className="bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-100">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{session.student_name}</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {new Date(session.started_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-base sm:text-lg font-bold ${
                        (session.total_score || 0) >= 80 ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {session.total_score || 0}/100
                      </p>
                      <p className={`text-xs ${
                        (session.total_score || 0) >= 80 ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {(session.total_score || 0) >= 80 ? 'Đậu' : 'Rớt'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sessionHistory.length > 3 && (
            <Link
              to="/history"
              className="block text-center text-sm sm:text-base text-primary-600 hover:text-primary-700 font-medium py-3"
            >
              Xem tất cả →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default DashboardPage