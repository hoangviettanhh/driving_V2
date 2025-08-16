import React, { useEffect, useState } from 'react'
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
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)

  // Welcome message on load
  useEffect(() => {
    if (user) {
      speakWelcome(user.full_name || user.username)
    }
  }, [user, speakWelcome])

  // Load session history on mount
  useEffect(() => {
    loadSessionHistory()
  }, []) // Remove loadSessionHistory from dependencies to prevent loop

  // Quick stats
  const stats = {
    totalSessions: sessionHistory.length,
    completedToday: sessionHistory.filter(session => {
      const today = new Date().toDateString()
      const sessionDate = new Date(session.started_at).toDateString()
      return sessionDate === today && session.status === 'completed'
    }).length,
    averageScore: sessionHistory.length > 0 
      ? Math.round(sessionHistory
          .filter(s => s.status === 'completed')
          .reduce((sum, s) => sum + (s.total_score || 0), 0) / 
          sessionHistory.filter(s => s.status === 'completed').length)
      : 0
  }

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-blue-600 rounded-card p-6 text-white">
        <h2 className="text-xl font-bold mb-2">
          Chào mừng, {user?.full_name || user?.username}!
        </h2>
        <p className="text-primary-100">
          Sẵn sàng cho buổi thi hôm nay. Chúc bạn có một ngày làm việc hiệu quả!
        </p>
      </div>

      {/* Current Session */}
      {currentSession && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Phiên thi đang diễn ra</h3>
          </div>
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-gray-900">{currentSession.student_name}</p>
                <p className="text-sm text-gray-600">
                  Bài {currentSession.currentTestNumber || 1}/11
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-600">
                  {currentSession.totalScore}
                </p>
                <p className="text-sm text-gray-600">điểm</p>
              </div>
            </div>
            <Link
              to="/tests"
              className="btn-primary w-full"
            >
              <Play className="w-5 h-5 mr-2" />
              Tiếp tục thi
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Thao tác nhanh</h3>
        
        <Link
          to="/tests"
          className="card hover:shadow-floating transition-shadow"
        >
          <div className="card-body">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-success-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Bắt đầu thi mới</h4>
                <p className="text-sm text-gray-600">Tạo phiên thi cho học viên</p>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/history"
          className="card hover:shadow-floating transition-shadow"
        >
          <div className="card-body">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <History className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Xem lịch sử</h4>
                <p className="text-sm text-gray-600">Kết quả các phiên thi trước</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Statistics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Thống kê</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              <p className="text-xs text-gray-600">Tổng phiên thi</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-success-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
              <p className="text-xs text-gray-600">Hoàn thành hôm nay</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-5 h-5 text-warning-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}</p>
              <p className="text-xs text-gray-600">Điểm TB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      {sessionHistory.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Phiên thi gần đây</h3>
          
          <div className="space-y-3">
            {sessionHistory.slice(0, 3).map((session) => (
              <div key={session.id} className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{session.student_name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(session.started_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        session.total_score >= 80 ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {session.total_score}/100
                      </p>
                      <p className={`text-xs ${
                        session.total_score >= 80 ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {session.total_score >= 80 ? 'Đậu' : 'Rớt'}
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
              className="block text-center text-primary-600 hover:text-primary-700 font-medium"
            >
              Xem tất cả →
            </Link>
          )}
        </div>
      )}

      {/* Voice Settings Button */}
      <div className="mt-6">
        <button
          onClick={() => setShowVoiceSettings(!showVoiceSettings)}
          className="w-full flex items-center justify-center space-x-2 p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>{showVoiceSettings ? 'Ẩn cài đặt giọng đọc' : 'Cài đặt giọng đọc'}</span>
        </button>
      </div>

      {/* Voice Test Component */}
      {showVoiceSettings && (
        <div className="mt-4">
          <VoiceTestComponent />
        </div>
      )}
    </div>
  )
}

export default DashboardPage