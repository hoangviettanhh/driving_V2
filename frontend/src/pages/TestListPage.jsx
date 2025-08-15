import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTestSession } from '../contexts/TestSessionContext'
import { useVoice } from '../contexts/VoiceContext'
import { Play, Plus, User, Car, Trophy, Clock } from 'lucide-react'
import LoadingCar from '../components/LoadingCar'
import DrivingAnimation from '../components/DrivingAnimation'

const TestListPage = () => {
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const { 
    testDefinitions, 
    currentSession, 
    startSession,
    loadTestDefinitions,
    isLoading 
  } = useTestSession()
  
  const { speak } = useVoice()
  const navigate = useNavigate()

  // Load test definitions when component mounts or when user comes back
  useEffect(() => {
    const token = localStorage.getItem('driving_test_token')
    if (token && testDefinitions.length === 0) {
      console.log('🔄 TestListPage: Loading test definitions...')
      loadTestDefinitions()
    }
  }, [])
  
  // Also load when user focuses on page (comes back from other tab)
  useEffect(() => {
    const handleFocus = () => {
      const token = localStorage.getItem('driving_test_token')
      if (token && testDefinitions.length === 0) {
        console.log('🔄 Page focused: Reloading test definitions...')
        loadTestDefinitions()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [testDefinitions.length])

  // Auto-focus on student name input when modal opens
  useEffect(() => {
    if (showNewSessionModal) {
      setTimeout(() => {
        const input = document.getElementById('student-name')
        if (input) input.focus()
      }, 100)
    }
  }, [showNewSessionModal])

  const handleStartNewSession = async () => {
    if (!studentName.trim()) return

    setIsCreating(true)
    try {
      const result = await startSession(studentName.trim(), studentId.trim())
      
      if (result.success) {
        setShowNewSessionModal(false)
        setStudentName('')
        setStudentId('')
        // Navigate to first test
        navigate('/test/1')
      } else {
        alert(result.message || 'Không thể tạo phiên thi')
      }
    } catch (error) {
      alert('Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleTestClick = (testNumber) => {
    if (currentSession) {
      navigate(`/test/${testNumber}`)
    } else {
      setShowNewSessionModal(true)
    }
  }

  const handleSpeakTest = (testNumber, testName) => {
    speak(`Bài ${testNumber}: ${testName}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingCar message="Đang tải danh sách bài thi..." />
      </div>
    )
  }
  
  // Show message if no tests loaded
  if (!isLoading && testDefinitions.length === 0) {
    return (
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-3">
            <Car className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">11 Bài Thi Sa Hình</h1>
            <Car className="w-8 h-8 text-primary-600 transform scale-x-[-1]" />
          </div>
          <p className="text-gray-600 text-sm">
            Hệ thống chấm điểm thi lái xe cho giáo viên
          </p>
          
          {/* Driving Animation */}
          <div className="bg-gradient-to-r from-blue-50 to-primary-50 rounded-lg p-3 mt-4">
            <DrivingAnimation size="small" />
          </div>
        </div>
        
        {/* Error message */}
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="card-body text-center">
            <div className="text-yellow-600 mb-4">
              <Car className="w-12 h-12 mx-auto mb-2" />
            </div>
            <h3 className="font-semibold text-yellow-800 mb-2">
              Không thể tải danh sách bài thi
            </h3>
            <p className="text-yellow-700 text-sm mb-4">
              Vui lòng kiểm tra kết nối mạng và thử lại
            </p>
            <button
              onClick={loadTestDefinitions}
              className="btn-primary"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header with better visual hierarchy */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center space-x-3">
          <Car className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">11 Bài Thi Sa Hình</h1>
          <Car className="w-8 h-8 text-primary-600 transform scale-x-[-1]" />
        </div>
        <p className="text-gray-600 text-sm">
          Hệ thống chấm điểm thi lái xe cho giáo viên
        </p>
        
        {/* Driving Animation */}
        <div className="bg-gradient-to-r from-blue-50 to-primary-50 rounded-lg p-3 mt-4">
          <DrivingAnimation size="small" />
        </div>
        
        {!currentSession && (
          <button
            onClick={() => setShowNewSessionModal(true)}
            className="btn-primary text-lg px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Plus className="w-6 h-6 mr-3" />
            Bắt đầu thi mới
          </button>
        )}
      </div>

      {/* Current Session Info */}
      {currentSession && (
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200 shadow-lg">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-900 text-lg">
                    {currentSession.student_name}
                  </h3>
                  <p className="text-sm text-primary-700">
                    {currentSession.student_id ? `MSSV: ${currentSession.student_id}` : 'Đang thi sa hình'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-3xl font-bold text-primary-900">
                      {currentSession.totalScore}
                    </p>
                    <p className="text-sm text-primary-700">điểm</p>
                  </div>
                </div>
                <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  currentSession.totalScore >= 80 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {currentSession.totalScore >= 80 ? '✓ Đậu' : '✗ Rớt'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="space-y-3">
        {testDefinitions.map((test) => {
          const isCurrentTest = currentSession && 
            currentSession.currentTestNumber === test.lesson_number
          const isCompleted = currentSession && 
            currentSession.testResults.some(r => r.testNumber === test.lesson_number)
          const isLocked = currentSession && 
            test.lesson_number > (currentSession.currentTestNumber || 1)

          return (
            <div
              key={test.id}
              className={`test-card ${
                isCurrentTest ? 'ring-2 ring-primary-500' : ''
              } ${isLocked ? 'opacity-50' : ''}`}
            >
              <div className="test-card-header">
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`test-card-number ${
                    isCompleted ? 'bg-success-600' : 
                    isCurrentTest ? 'bg-primary-600' : 'bg-gray-400'
                  }`}>
                    {isCompleted ? '✓' : test.lesson_number}
                  </div>
                  <div className="flex-1">
                    <h3 className="test-card-title">{test.lesson_name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {test.description}
                    </p>
                    {test.max_time_seconds && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          Thời gian: {Math.floor(test.max_time_seconds / 60)}:{(test.max_time_seconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Voice Button */}
                  <button
                    onClick={() => handleSpeakTest(test.lesson_number, test.lesson_name)}
                    className="voice-btn"
                    title="Nghe mô tả bài thi"
                  >
                    🔊
                  </button>

                  {/* Action Button */}
                  <button
                    onClick={() => handleTestClick(test.lesson_number)}
                    disabled={isLocked}
                    className={`btn ${
                      isCurrentTest ? 'btn-primary' :
                      isCompleted ? 'btn-success' : 
                      isLocked ? 'btn-secondary opacity-50' : 'btn-outline'
                    }`}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    {isCurrentTest ? 'Tiếp tục' : 
                     isCompleted ? 'Xem lại' : 
                     isLocked ? 'Chưa mở' : 'Bắt đầu'}
                  </button>
                </div>
              </div>

              {/* Error Preview */}
              {test.common_errors && (() => {
                // Handle both JSON string and object
                let errors
                try {
                  errors = typeof test.common_errors === 'string' 
                    ? JSON.parse(test.common_errors) 
                    : test.common_errors
                } catch (e) {
                  console.error('Error parsing common_errors:', e)
                  return null
                }

                if (!Array.isArray(errors)) return null

                return (
                  <div className="p-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Lỗi phổ biến ({errors.length} lỗi):
                    </p>
                    <div className="space-y-1">
                      {errors.slice(0, 2).map((error, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{error.error}</span>
                          <span className="text-danger-600 font-medium">
                            -{error.points}đ
                          </span>
                        </div>
                      ))}
                      {errors.length > 2 && (
                        <p className="text-xs text-gray-500">
                          +{errors.length - 2} lỗi khác...
                        </p>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md animate-slide-up shadow-2xl">
            <div className="card-header bg-gradient-to-r from-primary-600 to-blue-600 text-white">
              <div className="flex items-center space-x-3">
                <Car className="w-6 h-6" />
                <h3 className="font-bold text-lg">Tạo phiên thi mới</h3>
              </div>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="student-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Tên học viên *
                </label>
                <input
                  type="text"
                  id="student-name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="form-input"
                  placeholder="Nhập tên học viên"
                  required
                />
              </div>

              <div>
                <label htmlFor="student-id" className="block text-sm font-medium text-gray-700 mb-2">
                  Mã số học viên
                </label>
                <input
                  type="text"
                  id="student-id"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="form-input"
                  placeholder="Nhập mã số (tùy chọn)"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowNewSessionModal(false)}
                  className="btn-secondary flex-1"
                  disabled={isCreating}
                >
                  Hủy
                </button>
                <button
                  onClick={handleStartNewSession}
                  disabled={!studentName.trim() || isCreating}
                  className="btn-primary flex-1"
                >
                  {isCreating ? (
                    <div className="flex items-center justify-center">
                      <div className="loading-spinner mr-2"></div>
                      Đang tạo...
                    </div>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      Bắt đầu thi
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestListPage