import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useVoice } from '../contexts/VoiceContext'
import { Trophy, XCircle, RotateCcw, Home, Volume2, CheckCircle, AlertTriangle } from 'lucide-react'

const TestResultPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { speak } = useVoice()
  
  const [showAnimation, setShowAnimation] = useState(true)
  const [hasSpoken, setHasSpoken] = useState(false)
  
  // Get session data from navigation state
  const sessionData = location.state?.session || {}
  const finalScore = sessionData.totalScore || 0
  const isPassed = finalScore >= 80
  const studentName = sessionData.student_name || 'Học viên'
  const testResults = sessionData.testResults || []
  
  // Calculate statistics
  const totalErrors = testResults.reduce((sum, result) => sum + (result.errorsDetected?.length || 0), 0)
  const totalPointsDeducted = testResults.reduce((sum, result) => sum + (result.pointsDeducted || 0), 0)
  const completedTests = testResults.length
  
  // Animation and voice effect
  useEffect(() => {
    // Show animation for 2 seconds
    const animationTimer = setTimeout(() => {
      setShowAnimation(false)
    }, 2000)
    
    // Speak result after animation
    const voiceTimer = setTimeout(() => {
      if (!hasSpoken) {
        const message = isPassed 
          ? `Chúc mừng ${studentName}! Bạn đã thi đạt phần thi lái xe sa hình với ${finalScore} điểm. Bạn đã đậu!`
          : `${studentName}, bạn đã hoàn thành phần thi lái xe sa hình với ${finalScore} điểm. Rất tiếc, bạn đã thi trượt. Hãy luyện tập thêm và thử lại!`
        
        speak(message)
        setHasSpoken(true)
      }
    }, 2500)
    
    return () => {
      clearTimeout(animationTimer)
      clearTimeout(voiceTimer)
    }
  }, [speak, isPassed, finalScore, studentName, hasSpoken])
  
  // Handle repeat voice
  const handleRepeatVoice = () => {
    const message = isPassed 
      ? `Chúc mừng ${studentName}! Bạn đã thi đạt phần thi lái xe sa hình với ${finalScore} điểm. Bạn đã đậu!`
      : `${studentName}, bạn đã hoàn thành phần thi lái xe sa hình với ${finalScore} điểm. Rất tiếc, bạn đã thi trượt. Hãy luyện tập thêm và thử lại!`
    
    speak(message)
  }
  
  // Navigation handlers
  const handleNewTest = () => {
    navigate('/tests')
  }
  
  const handleViewHistory = () => {
    navigate('/history')
  }
  
  const handleGoHome = () => {
    navigate('/')
  }
  
  // Redirect if no session data
  useEffect(() => {
    if (!sessionData.id) {
      navigate('/tests')
    }
  }, [sessionData.id, navigate])
  
  if (showAnimation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          {/* Animated car */}
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-ping"></div>
          </div>
          
          {/* Loading text */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Đang tính điểm...</h2>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`min-h-screen p-4 ${isPassed ? 'bg-gradient-to-br from-green-50 to-emerald-100' : 'bg-gradient-to-br from-red-50 to-rose-100'}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Result Header */}
        <div className="text-center space-y-4">
          {/* Result Icon */}
          <div className="flex justify-center">
            {isPassed ? (
              <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <Trophy className="w-16 h-16 text-white" />
              </div>
            ) : (
              <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <XCircle className="w-16 h-16 text-white" />
              </div>
            )}
          </div>
          
          {/* Result Text */}
          <div className="space-y-2">
            <h1 className={`text-4xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
              {isPassed ? 'ĐẬU!' : 'TRƯỢT!'}
            </h1>
            <h2 className="text-2xl font-semibold text-gray-800">
              {studentName}
            </h2>
            <p className="text-lg text-gray-600">
              {isPassed 
                ? 'Chúc mừng! Bạn đã thi đạt phần thi lái xe sa hình'
                : 'Rất tiếc! Bạn cần luyện tập thêm và thử lại'
              }
            </p>
          </div>
        </div>
        
        {/* Score Display */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Kết quả chi tiết</h3>
            
            {/* Score Circle */}
            <div className="relative w-40 h-40 mx-auto">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 144 144">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  fill="none"
                  stroke={isPassed ? "#10b981" : "#ef4444"}
                  strokeWidth="12"
                  strokeDasharray={`${(finalScore / 100) * 377} 377`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {finalScore}
                  </div>
                  <div className="text-sm text-gray-500">điểm</div>
                </div>
              </div>
            </div>
            
            {/* Pass/Fail Status */}
            <div className={`inline-flex items-center px-6 py-3 rounded-full text-white font-semibold ${isPassed ? 'bg-green-500' : 'bg-red-500'}`}>
              {isPassed ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Đạt yêu cầu (≥80 điểm)
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Chưa đạt yêu cầu (&lt;80 điểm)
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Statistics */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Thống kê bài thi</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{completedTests}</div>
              <div className="text-sm text-gray-600">Bài hoàn thành</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <div className="text-2xl font-bold text-orange-600">{totalErrors}</div>
              <div className="text-sm text-gray-600">Lỗi phát hiện</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="text-2xl font-bold text-red-600">-{totalPointsDeducted}</div>
              <div className="text-sm text-gray-600">Điểm bị trừ</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">{Math.round((completedTests / 11) * 100)}%</div>
              <div className="text-sm text-gray-600">Hoàn thành</div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Voice Repeat */}
          <button
            onClick={handleRepeatVoice}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-colors"
          >
            <Volume2 className="w-5 h-5" />
            <span>Nghe lại kết quả</span>
          </button>
          
          {/* Main Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleNewTest}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Thi lại</span>
            </button>
            
            <button
              onClick={handleViewHistory}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-colors"
            >
              <Trophy className="w-5 h-5" />
              <span>Xem lịch sử</span>
            </button>
            
            <button
              onClick={handleGoHome}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Trang chủ</span>
            </button>
          </div>
        </div>
        
        {/* Motivational Message */}
        <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
          {isPassed ? (
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-green-600">🎉 Xuất sắc!</h4>FF
              <p className="text-gray-600">
                Bạn đã hoàn thành xuất sắc phần thi lái xe sa hình! 
                Tiếp tục chuẩn bị cho phần thi thực hành trên đường. Chúc bạn may mắn!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-red-600">💪 Đừng bỏ cuộc!</h4>
              <p className="text-gray-600">
                Phần thi lái xe sa hình cần nhiều luyện tập. Hãy ôn lại các bài thi và 
                bạn sẽ thành công trong lần thi tiếp theo!
              </p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}

export default TestResultPage