import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTestSession } from '../contexts/TestSessionContext'
import { useVoice } from '../contexts/VoiceContext'
import { ChevronLeft, ChevronRight, Volume2, AlertCircle, CheckCircle, XCircle, Car } from 'lucide-react'
import LoadingCar from '../components/LoadingCar'
import DrivingAnimation from '../components/DrivingAnimation'
import EmergencyTest from '../components/EmergencyTest'

const TestDetailPage = () => {
  const { testNumber } = useParams()
  const navigate = useNavigate()
  const currentTestNumber = parseInt(testNumber) || 1
  
  const { 
    currentSession, 
    testDefinitions, 
    recordError, 
    completeTest,
    completeSession,
    getTestDefinition,
    getSessionStats,
    loadTestDefinitions,
    shouldShowEmergencyTest,
    getEmergencyTestDefinition
  } = useTestSession()
  
  const { speak, speakError, speakScore } = useVoice()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentTestErrors, setCurrentTestErrors] = useState([])
  const [testPhase, setTestPhase] = useState('loading') // loading -> animation -> speaking -> ready
  const [animationComplete, setAnimationComplete] = useState(false)
  const [showEmergencyTest, setShowEmergencyTest] = useState(false)
  const [isRecordingError, setIsRecordingError] = useState(false)
  const [localScore, setLocalScore] = useState(100) // Local score tracking
  const [detectedErrors, setDetectedErrors] = useState([]) // Local error tracking
  
  // Timer states
  const [examStartTime, setExamStartTime] = useState(null) // When exam started
  const [currentTime, setCurrentTime] = useState(Date.now()) // Current time for timer
  const [isOvertime, setIsOvertime] = useState(false) // Whether in overtime
  const [overtimePenalties, setOvertimePenalties] = useState(0) // Number of overtime penalties
  
  // Get current test definition
  const currentTest = getTestDefinition(currentTestNumber)
  const sessionStats = getSessionStats()
  
  // Component initialization - Start exam timer
  useEffect(() => {
    // Start exam timer when first entering any test
    if (currentSession && !examStartTime) {
      const startTime = Date.now()
      setExamStartTime(startTime)
      console.log('⏰ Exam timer started at:', new Date(startTime).toLocaleTimeString())
    }
  }, [currentSession, examStartTime])

  // Timer logic - Update every second and handle overtime
  useEffect(() => {
    if (!examStartTime) return

    const timer = setInterval(() => {
      const now = Date.now()
      setCurrentTime(now)
      
      const elapsedMs = now - examStartTime
      const elapsedMinutes = elapsedMs / (1000 * 60)
      const EXAM_DURATION_MINUTES = 18
      
      if (elapsedMinutes > EXAM_DURATION_MINUTES && !isOvertime) {
        setIsOvertime(true)
        speak('Đã hết thời gian thi. Bắt đầu tính phạt quá giờ.')
      }
      
      // Overtime penalty every 3 seconds
      if (isOvertime) {
        const overtimeMs = elapsedMs - (EXAM_DURATION_MINUTES * 60 * 1000)
        const overtimeSeconds = Math.floor(overtimeMs / 1000)
        const expectedPenalties = Math.floor(overtimeSeconds / 3)
        
        if (expectedPenalties > overtimePenalties) {
          const newPenalties = expectedPenalties - overtimePenalties
          setOvertimePenalties(expectedPenalties)
          
          // Deduct points and speak
          const newScore = Math.max(0, localScore - newPenalties)
          setLocalScore(newScore)
          
          speak('Quá thời gian')
          console.log('⏰ Overtime penalty:', newPenalties, 'points. New score:', newScore)
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [examStartTime, isOvertime, overtimePenalties, localScore, speak])

  // Load test definitions if not available
  useEffect(() => {
    if (testDefinitions.length === 0) {
      loadTestDefinitions()
    }
  }, [])

  // Parse common errors for current test
  useEffect(() => {
    if (currentTest && currentTest.common_errors) {
      try {
        const errors = typeof currentTest.common_errors === 'string' 
          ? JSON.parse(currentTest.common_errors)
          : currentTest.common_errors
        setCurrentTestErrors(Array.isArray(errors) ? errors : [])
      } catch (e) {
        console.error('Error parsing common_errors:', e)
        setCurrentTestErrors([])
      }
    }
  }, [currentTest])
  
  // Reset test phase when test number changes
  useEffect(() => {
    setTestPhase('loading')
    setAnimationComplete(false)
    setShowEmergencyTest(false)
    
    // Check if emergency test should appear before this lesson
    if (shouldShowEmergencyTest(currentTestNumber)) {
      setShowEmergencyTest(true)
    }
  }, [currentTestNumber, shouldShowEmergencyTest])

  // Handle test flow: loading -> animation -> speaking -> ready
  useEffect(() => {
    if (currentTest && currentSession && !showEmergencyTest) {
      if (testPhase === 'loading') {
        setTestPhase('animation')
        // Start animation for 3 seconds
        setTimeout(() => {
          setAnimationComplete(true)
          setTestPhase('speaking')
          // AI speaks only the test name
          speak(`Bài ${currentTestNumber}: ${currentTest.lesson_name}`).then(() => {
            setTestPhase('ready')
          })
        }, 3000)
      }
    }
  }, [currentTest, testPhase, currentTestNumber, speak, showEmergencyTest])
  
  // Handle emergency test completion
  const handleEmergencyTestComplete = (pointsAwarded) => {
    // Hide emergency test and continue with normal lesson
    setShowEmergencyTest(false)
    setTestPhase('loading')
  }

  // Redirect if no active session
  useEffect(() => {
    if (!currentSession && !isRecordingError) {
      const timer = setTimeout(() => {
        if (!currentSession && !isRecordingError) {
          navigate('/tests')
        }
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [currentSession, navigate, isRecordingError])
  
  // Show emergency test if needed
  if (showEmergencyTest) {
    return (
      <EmergencyTest 
        onComplete={handleEmergencyTestComplete}
        onError={(error) => console.error('Emergency test error:', error)}
      />
    )
  }

  // Show loading while waiting for session or test data
  if (!currentSession || testDefinitions.length === 0 || testPhase === 'loading') {
    return (
      <div className="min-h-96 flex flex-col items-center justify-center space-y-6">
        <LoadingCar message={
          !currentSession ? "Đang tải phiên thi..." :
          testDefinitions.length === 0 ? "Đang tải danh sách bài thi..." :
          "Đang chuẩn bị bài thi..."
        } />
        
        {/* Debug info and retry button */}
        <div className="text-center space-y-2">
          <div className="text-xs text-gray-500">
            Session: {currentSession ? '✓' : '✗'} | 
            Tests: {testDefinitions.length}/11 | 
            Phase: {testPhase}
          </div>
          <div className="space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="btn btn-outline text-sm px-4 py-2"
            >
              Refresh trang
            </button>
            <button
              onClick={() => navigate('/tests')}
              className="btn btn-outline text-sm px-4 py-2"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Show error if no current test found
  if (!currentTest) {
    return (
      <div className="min-h-96 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy bài thi
            </h3>
            <p className="text-gray-600 mb-4">
              Bài thi số {currentTestNumber} không tồn tại
            </p>
            <button
              onClick={() => navigate('/tests')}
              className="btn-primary"
            >
              Quay lại danh sách bài thi
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Animation phase - show driving animation
  if (testPhase === 'animation') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Bài {currentTestNumber}: {currentTest.lesson_name}
          </h1>
          <p className="text-gray-600 max-w-md">
            {currentTest.description}
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-primary-50 rounded-xl p-6 w-full max-w-lg">
          <DrivingAnimation size="large" />
        </div>
        
        <div className="text-center">
          <p className="text-gray-500">Đang chuẩn bị bài thi...</p>
          <div className="flex justify-center space-x-1 mt-2">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    )
  }
  
  // Speaking phase - show AI speaking
  if (testPhase === 'speaking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-6">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Volume2 className="w-12 h-12 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bài {currentTestNumber}: {currentTest.lesson_name}
          </h1>
          <p className="text-gray-600 max-w-md">
            {currentTest.description}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-primary-600 font-medium">AI đang đọc mô tả bài thi...</p>
          <div className="flex justify-center space-x-2 mt-4">
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-ping"></div>
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    )
  }
  
  // Handle error click
  const handleErrorClick = (event, error) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    
    if (isProcessing) return
    
    // Check if already detected
    const alreadyDetected = detectedErrors.some(e => e.error === error.error)
    if (alreadyDetected) {
      speak('Lỗi này đã được ghi nhận')
      return
    }
    
    // Add to detected errors locally
    setDetectedErrors(prev => [...prev, error])
    
    // Deduct points locally
    const newScore = Math.max(0, localScore - error.points)
    setLocalScore(newScore)
    
    // Speak error and new score
    speak(`${error.error}. Trừ ${error.points} điểm. Điểm hiện tại: ${newScore}`)
      .catch(() => {}) // Ignore voice errors
  }
  
  // Handle next test
  const handleNextTest = async () => {
    if (isProcessing) return
    
    setIsProcessing(true)
    try {
      if (currentTestNumber < 11) {
        // Move to next test
        const result = await completeTest(currentTestNumber)
        if (result.success) {
          navigate(`/test/${currentTestNumber + 1}`)
          // No voice during transition - will speak when entering new test
        }
      } else {
        // Complete entire session with local score
        const sessionWithLocalData = {
          ...currentSession,
          totalScore: localScore,
          testResults: [{
            testNumber: currentTestNumber,
            testName: currentTest?.lesson_name || `Bài ${currentTestNumber}`,
            errorsDetected: detectedErrors,
            pointsDeducted: 100 - localScore,
            isDisqualified: localScore === 0
          }]
        }
        
        // Navigate to result page with local session data
        navigate('/result', { 
          state: { 
            session: sessionWithLocalData
          } 
        })
      }
    } catch (error) {
      console.error('Error completing test:', error)
      alert('Đã xảy ra lỗi')
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Handle previous test
  const handlePreviousTest = () => {
    if (currentTestNumber > 1) {
      navigate(`/test/${currentTestNumber - 1}`)
    }
  }
  
  // Handle speak test description
  const handleSpeakTest = () => {
    speak(`${currentTest.lesson_name}. ${currentTest.description}`)
  }
  
  // Get current test result
  const currentTestResult = currentSession.testResults.find(r => r.testNumber === currentTestNumber)
  const testPointsDeducted = currentTestResult ? currentTestResult.pointsDeducted : 0
  const testErrorsDetected = currentTestResult ? currentTestResult.errorsDetected : []
  
  // Calculate timer display - COUNT UP from 00:00
  const getTimerDisplay = () => {
    if (!examStartTime) return { display: '00:00', isOvertime: false, overtimeDisplay: '' }
    
    const elapsedMs = currentTime - examStartTime
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60))
    const elapsedSeconds = Math.floor((elapsedMs % (1000 * 60)) / 1000)
    const EXAM_DURATION_MINUTES = 18
    
    const timeDisplay = `${elapsedMinutes.toString().padStart(2, '0')}:${elapsedSeconds.toString().padStart(2, '0')}`
    
    if (elapsedMinutes < EXAM_DURATION_MINUTES) {
      // Normal time - show elapsed time (counting up)
      return {
        display: timeDisplay,
        isOvertime: false,
        overtimeDisplay: ''
      }
    } else {
      // Overtime - show elapsed time in red
      return {
        display: timeDisplay,
        isOvertime: true,
        overtimeDisplay: `(Quá ${elapsedMinutes - EXAM_DURATION_MINUTES} phút)`
      }
    }
  }
  
  const timerInfo = getTimerDisplay()
  
  // Ready phase - show test interface with errors
  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        {/* Timer Display - COUNT UP */}
        <div className={`text-center p-3 rounded-lg font-mono text-lg font-bold ${
          timerInfo.isOvertime 
            ? 'bg-red-100 text-red-700 border-2 border-red-300 animate-pulse' 
            : 'bg-green-100 text-green-700 border-2 border-green-300'
        }`}>
          <div className="flex items-center justify-center space-x-2">
            <span>⏰</span>
            <span>{timerInfo.display}</span>
            <span className="text-sm font-normal">/ 18:00</span>
            {timerInfo.isOvertime && (
              <span className="text-red-600 text-sm">
                {timerInfo.overtimeDisplay}
              </span>
            )}
          </div>
          {timerInfo.isOvertime && (
            <div className="text-sm mt-1 text-red-600 font-medium">
              ⚠️ Quá giờ! Trừ 1 điểm mỗi 3 giây (Đã trừ: {overtimePenalties} điểm)
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="test-card-number bg-primary-600">
              {currentTestNumber}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{currentTest.lesson_name}</h1>
              <p className="text-sm text-gray-600">{currentTest.description}</p>
            </div>
          </div>
          
          <button
            onClick={handleSpeakTest}
            className="voice-btn"
            title="Nghe lại mô tả bài thi"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
        
        {/* Compact Driving Animation */}
        <div className="bg-gradient-to-r from-blue-50 to-primary-50 rounded-lg p-3">
          <DrivingAnimation size="small" />
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Tiến độ: {currentTestNumber}/11 bài
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((currentTestNumber / 11) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentTestNumber / 11) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Score Display - LOCAL VERSION */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card bg-primary-50 border-primary-200">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-primary-900 mb-1">
              {localScore}
            </div>
            <div className="text-sm text-primary-700">Điểm hiện tại</div>
          </div>
        </div>
        
        <div className="card bg-orange-50 border-orange-200">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-orange-900 mb-1">
              {detectedErrors.length}
            </div>
            <div className="text-sm text-orange-600">Lỗi đã phát hiện</div>
          </div>
        </div>
      </div>
      
      {/* Student Info */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                Học viên: {currentSession.student_name}
              </h3>
              {currentSession.student_id && (
                <p className="text-sm text-gray-600">MSSV: {currentSession.student_id}</p>
              )}
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                currentSession.totalScore >= 80 ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
              }`}>
                {currentSession.totalScore >= 80 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Đậu
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Rớt
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Errors Detected This Test */}
      {testErrorsDetected.length > 0 && (
        <div className="card border-danger-200">
          <div className="card-header bg-danger-50">
            <h3 className="font-semibold text-danger-900 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Lỗi đã phát hiện ({testErrorsDetected.length})
            </h3>
          </div>
          <div className="card-body space-y-2">
            {testErrorsDetected.map((error, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-danger-50 rounded-lg">
                <span className="text-danger-800">{error.error}</span>
                <span className="text-danger-600 font-medium">-{error.points}đ</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Error Buttons */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">
            Danh sách lỗi có thể mắc phải ({currentTestErrors.length} lỗi)
          </h3>
        </div>
        <div className="card-body">
          <div className="grid gap-3">
            {currentTestErrors.map((error, index) => {
              const isDisqualification = error.type === 'disqualification'
              const alreadyDetected = detectedErrors.some(detected => detected.error === error.error)
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={(event) => handleErrorClick(event, error)}
                  disabled={isProcessing || alreadyDetected}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    alreadyDetected
                      ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                      : isDisqualification
                      ? 'bg-danger-50 border-danger-200 hover:bg-danger-100 text-danger-800'
                      : 'bg-white border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium mb-1">{error.error}</div>
                      {isDisqualification && (
                        <div className="text-xs text-danger-600 font-medium">
                          ⚠️ TRUẤT QUYỀN
                        </div>
                      )}
                    </div>
                    <div className={`text-lg font-bold ${
                      isDisqualification ? 'text-danger-600' : 'text-orange-600'
                    }`}>
                      {isDisqualification ? 'TRUẤT' : `-${error.points}đ`}
                    </div>
                  </div>
                  {alreadyDetected && (
                    <div className="text-xs text-gray-500 mt-2">
                      ✓ Đã ghi nhận lỗi này
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Navigation - Prominent Next Button */}
      <div className="space-y-4">
        {/* Progress indicator */}
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">
            Bài {currentTestNumber} / 11
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentTestNumber / 11) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Main action button */}
        <div className="flex justify-center">
          <button
            onClick={handleNextTest}
            disabled={isProcessing}
            className="btn btn-primary text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            {isProcessing ? (
              <div className="flex items-center">
                <div className="loading-spinner mr-3"></div>
                Đang xử lý...
              </div>
            ) : currentTestNumber === 11 ? (
              <>
                <CheckCircle className="w-6 h-6 mr-3" />
                Hoàn thành thi
              </>
            ) : (
              <>
                Bài tiếp theo ({currentTestNumber + 1}/11)
                <ChevronRight className="w-6 h-6 ml-3" />
              </>
            )}
          </button>
        </div>
        
        {/* Secondary navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePreviousTest}
            disabled={currentTestNumber === 1}
            className={`btn btn-outline ${currentTestNumber === 1 ? 'opacity-50' : ''}`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Bài trước
          </button>
          
          <button
            onClick={handleSpeakTest}
            className="btn btn-outline"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            Nghe lại
          </button>
        </div>
      </div>
    </div>
  )
}

export default TestDetailPage