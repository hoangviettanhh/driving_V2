import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTestSession } from '../contexts/TestSessionContext'
import { useVoice } from '../contexts/VoiceContext'
import { useAudio } from '../hooks/useAudio'
import { Play, Plus, User, Car, Trophy, Clock, Volume2, CheckCircle, Lock } from 'lucide-react'
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
  const { playLesson, playEmergency } = useAudio()
  const navigate = useNavigate()

  // Load test definitions when component mounts
  useEffect(() => {
    const token = localStorage.getItem('driving_test_token')
    if (token && testDefinitions.length === 0) {
      console.log('🔄 TestListPage: Loading test definitions...')
      loadTestDefinitions()
    }
  }, [])

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

  const handleSpeakTest = (testNumber, testName) => {
    console.log(`🔊 Playing audio for lesson ${testNumber}: ${testName}`)
    
    // Use new listLesson keys for TestListPage only
    const listKey = `listLesson${testNumber}`
    console.log(`📚 Playing list lesson audio: ${listKey}`)
    
    playLesson(listKey).then(() => {
      console.log(`✅ Successfully played: ${listKey}`)
    }).catch((error) => {
      console.error(`❌ Error playing ${listKey}:`, error)
      speak(`Bài ${testNumber}: ${testName}`)
    })
  }


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingCar message="Đang tải danh sách bài thi..." />
      </div>
    )
  }
  
  // Show message if no tests loaded
  if (!isLoading && testDefinitions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy bài thi</h3>
          <p className="text-gray-600 mb-6">Vui lòng kiểm tra kết nối và thử lại.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-xl hover:bg-primary-700 transition-colors font-medium"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 sm:p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4">
                <Car className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">11 Bài Thi Sa Hình</h1>
                <p className="text-sm sm:text-base text-gray-600">Hệ thống chấm điểm thi lái xe cho giáo viên</p>
              </div>
            </div>
            
            {/* Driving Animation */}
            <div className="bg-gradient-to-r from-blue-50 to-primary-50 rounded-xl p-4 mb-6">
              <DrivingAnimation size="small" />
            </div>
        
            {/* Start New Session Button */}
            {(!currentSession || currentSession.isCompleted) && (
              <button
                onClick={() => setShowNewSessionModal(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg font-bold px-8 py-5 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center group"
              >
                <Plus className="w-6 h-6 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                Bắt đầu thi mới
              </button>
            )}
          </div>
        </div>

        {/* Current Session Info */}
        {currentSession && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
            <div className={`p-4 text-white ${currentSession.isCompleted 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
              : 'bg-gradient-to-r from-green-500 to-green-600'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    {currentSession.isCompleted ? (
                      <Trophy className="w-6 h-6 text-white" />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">
                      {currentSession.isCompleted ? 'Phiên thi đã hoàn thành' : 'Phiên thi đang diễn ra'}
                    </h3>
                    <p className={currentSession.isCompleted ? 'text-blue-100' : 'text-green-100'}>
                      Học viên: {currentSession.student_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{currentSession.totalScore || 100}</div>
                  <div className={`text-sm ${currentSession.isCompleted ? 'text-blue-100' : 'text-green-100'}`}>điểm</div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Bài {currentSession.currentTestNumber || 1}/11</span>
                <span>Trạng thái: {currentSession.isCompleted ? 'Đã hoàn thành' : 'Đang thi'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Test List */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 px-2">Danh sách bài thi</h2>
          
          {(() => {
            // Create enhanced test list with injected traffic light tests
            const enhancedTests = []
            let currentNumber = 1
            
            for (const test of testDefinitions) {
              // Add current test
              enhancedTests.push({
                ...test,
                lesson_number: currentNumber
              })
              currentNumber++
              
              // Add traffic light test after specific lessons
              if (test.lesson_name === 'Đường vòng quanh co') {
                enhancedTests.push({
                  id: `traffic_light_${currentNumber}`,
                  lesson_number: currentNumber,
                  lesson_name: 'Qua ngã tư có đèn tín hiệu',
                  description: 'Tuân thủ tín hiệu đèn giao thông',
                  time_limit: 180,
                  common_errors: '[{"type": "disqualification", "error": "Vượt đèn đỏ", "points": 100}]',
                  is_duplicate: true
                })
                currentNumber++
              } else if (test.lesson_name === 'Ghép xe dọc') {
                enhancedTests.push({
                  id: `traffic_light_${currentNumber}`,
                  lesson_number: currentNumber,
                  lesson_name: 'Qua ngã tư có đèn tín hiệu',
                  description: 'Tuân thủ tín hiệu đèn giao thông',
                  time_limit: 180,
                  common_errors: '[{"type": "disqualification", "error": "Vượt đèn đỏ", "points": 100}]',
                  is_duplicate: true
                })
                currentNumber++
              } else if (test.lesson_name === 'Ghép xe ngang') {
                enhancedTests.push({
                  id: `traffic_light_${currentNumber}`,
                  lesson_number: currentNumber,
                  lesson_name: 'Qua ngã tư có đèn tín hiệu',
                  description: 'Tuân thủ tín hiệu đèn giao thông',
                  time_limit: 180,
                  common_errors: '[{"type": "disqualification", "error": "Vượt đèn đỏ", "points": 100}]',
                  is_duplicate: true
                })
                currentNumber++
              }
            }
            
            return enhancedTests
          })().map((test, index) => {
              const isCurrentTest = currentSession && currentSession.currentTestNumber === test.lesson_number && !currentSession.isCompleted
              const isCompleted = currentSession && currentSession.currentTestNumber > test.lesson_number
              const isLocked = currentSession && (currentSession.currentTestNumber < test.lesson_number || currentSession.isCompleted)
              
              return (
                <div 
                  key={test.id} 
                  className={`bg-white rounded-2xl shadow-md border-l-4 transition-all duration-200 hover:shadow-lg ${
                    isCurrentTest ? 'border-blue-500 bg-blue-50' :
                    isCompleted ? 'border-green-500 bg-green-50' :
                    isLocked ? 'border-gray-300 bg-gray-50' :
                    'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between space-x-4">
                      {/* Test Info */}
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        {/* Test Number Badge */}
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                          isCurrentTest ? 'bg-blue-500' :
                          isCompleted ? 'bg-green-500' :
                          isLocked ? 'bg-gray-400' :
                          'bg-gray-500'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : isLocked ? (
                            <Lock className="w-6 h-6" />
                          ) : (
                            test.lesson_number
                          )}
                        </div>
                        
                        {/* Test Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">
                            {test.lesson_name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                            {test.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {Math.floor(test.time_limit / 60)}:{(test.time_limit % 60).toString().padStart(2, '0')}
                            </span>
                            {test.common_errors && (
                              <span className="text-xs text-gray-500">
                                {(() => {
                                  try {
                                    const errors = typeof test.common_errors === 'string' 
                                      ? JSON.parse(test.common_errors)
                                      : test.common_errors
                                    return Array.isArray(errors) ? errors.length : 0
                                  } catch (e) {
                                    console.warn('Error parsing common_errors for test', test.id, e)
                                    return 0
                                  }
                                })()} lỗi thường gặp
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Voice Button - Fixed alignment */}
                      <button
                        onClick={() => handleSpeakTest(test.lesson_number, test.lesson_name)}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary-100 hover:bg-primary-200 text-primary-600 hover:text-primary-700 transition-all duration-200 flex items-center justify-center flex-shrink-0 shadow-sm hover:shadow-md"
                        title="Nghe tên bài thi"
                      >
                        <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>

                    {/* Status Badge */}
                    {(isCurrentTest || isCompleted || isLocked) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium ${
                          isCurrentTest ? 'bg-blue-100 text-blue-700' :
                          isCompleted ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {isCurrentTest ? (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Đang thi
                            </>
                          ) : isCompleted ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Đã hoàn thành
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-1" />
                              Chưa mở khóa
                            </>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
        </div>

        {/* Summary Card */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Tổng quan</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">11</div>
              <div className="text-xs text-gray-600">Tổng bài thi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currentSession ? currentSession.currentTestNumber - 1 : 0}
              </div>
              <div className="text-xs text-gray-600">Đã hoàn thành</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {currentSession ? currentSession.totalScore || 100 : 100}
              </div>
              <div className="text-xs text-gray-600">Điểm hiện tại</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">18</div>
              <div className="text-xs text-gray-600">Phút thi</div>
            </div>
          </div>
        </div>
      </div>

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 sm:p-10 transform animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Plus className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Tạo phiên thi mới</h2>
              <p className="text-gray-600 text-lg">Nhập thông tin học viên để bắt đầu</p>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="student-name" className="block text-base font-semibold text-gray-800 mb-3">
                  Tên học viên *
                </label>
                <input
                  id="student-name"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nhập tên học viên"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base bg-gray-50 focus:bg-white hover:border-gray-300"
                  onKeyPress={(e) => e.key === 'Enter' && handleStartNewSession()}
                />
              </div>

              <div>
                <label htmlFor="student-id" className="block text-base font-semibold text-gray-800 mb-3">
                  MSSV (không bắt buộc)
                </label>
                <input
                  id="student-id"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Nhập mã số sinh viên"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base bg-gray-50 focus:bg-white hover:border-gray-300"
                  onKeyPress={(e) => e.key === 'Enter' && handleStartNewSession()}
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-10">
              <button
                onClick={() => {
                  setShowNewSessionModal(false)
                  setStudentName('')
                  setStudentId('')
                }}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-semibold text-base border-2 border-gray-200 hover:border-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleStartNewSession}
                disabled={!studentName.trim() || isCreating}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang tạo...
                  </div>
                ) : (
                  <>
                    <User className="w-5 h-5 mr-2" />
                    Vào thi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestListPage