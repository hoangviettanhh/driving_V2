import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTestSession } from '../contexts/TestSessionContext'
import { useVoice } from '../contexts/VoiceContext'
import { Play, Plus, User } from 'lucide-react'

const TestListPage = () => {
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const { 
    testDefinitions, 
    currentSession, 
    startSession,
    isLoading 
  } = useTestSession()
  
  const { speak } = useVoice()
  const navigate = useNavigate()

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
      <div className="p-4 flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách bài thi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">11 Bài Thi Sa Hình</h1>
        
        {!currentSession && (
          <button
            onClick={() => setShowNewSessionModal(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Thi mới
          </button>
        )}
      </div>

      {/* Current Session Info */}
      {currentSession && (
        <div className="card bg-primary-50 border-primary-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary-900">
                  Đang thi: {currentSession.student_name}
                </h3>
                <p className="text-sm text-primary-700">
                  {currentSession.student_id && `MSSV: ${currentSession.student_id}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-900">
                  {currentSession.totalScore}/100
                </p>
                <p className="text-sm text-primary-700">điểm</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="space-y-3">
        {testDefinitions.map((test) => {
          const isCurrentTest = currentSession && 
            currentSession.currentTestNumber === test.test_number
          const isCompleted = currentSession && 
            currentSession.testResults.some(r => r.testNumber === test.test_number)
          const isLocked = currentSession && 
            test.test_number > (currentSession.currentTestNumber || 1)

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
                    {isCompleted ? '✓' : test.test_number}
                  </div>
                  <div className="flex-1">
                    <h3 className="test-card-title">{test.test_name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {test.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Voice Button */}
                  <button
                    onClick={() => handleSpeakTest(test.test_number, test.test_name)}
                    className="voice-btn"
                    title="Nghe mô tả bài thi"
                  >
                    🔊
                  </button>

                  {/* Action Button */}
                  <button
                    onClick={() => handleTestClick(test.test_number)}
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
          <div className="card w-full max-w-md animate-slide-up">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">Tạo phiên thi mới</h3>
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