import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const TestSessionContext = createContext()

export const useTestSession = () => {
  const context = useContext(TestSessionContext)
  if (!context) {
    throw new Error('useTestSession must be used within a TestSessionProvider')
  }
  return context
}

export const TestSessionProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null)
  const [testDefinitions, setTestDefinitions] = useState([])
  const [sessionHistory, setSessionHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [emergencyTestPosition, setEmergencyTestPosition] = useState(null) // 8, 9, or 10

  // Load test definitions when user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('driving_test_token')
    if (token) {
      // Set token in axios headers before loading
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      loadTestDefinitions()
    }
  }, [])

  // Load test definitions from backend
  const loadTestDefinitions = async () => {
    try {
      setIsLoading(true)
      console.log('🔍 Loading test definitions...')
      const response = await axios.get('/tests')
      console.log('✅ Test definitions response:', response.data)
      if (response.data.success) {
        setTestDefinitions(response.data.data)
        console.log(`✅ Loaded ${response.data.data.length} test definitions`)
      } else {
        console.error('❌ API returned success=false:', response.data)
      }
    } catch (error) {
      console.error('❌ Failed to load test definitions:', error.response?.status, error.response?.data)
      // If unauthorized, clear token and redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem('driving_test_token')
        delete axios.defaults.headers.common['Authorization']
        window.location.href = '/login'
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Generate random emergency test position (before lesson 8, 9, or 10)
  const generateEmergencyPosition = () => {
    const positions = [8, 9, 10] // Before Đường sắt, Tăng tốc, Ghép ngang
    return positions[Math.floor(Math.random() * positions.length)]
  }

  // Start new test session
  const startSession = async (studentName, studentId = '') => {
    try {
      setIsLoading(true)
      
      // Generate random emergency position for this session
      const emergencyPos = generateEmergencyPosition()
      setEmergencyTestPosition(emergencyPos)
      console.log('🚨 Emergency test will appear before lesson:', emergencyPos)
      const response = await axios.post('/sessions', {
        student_name: studentName,
        student_id: studentId
      })

      if (response.data.success) {
        const newSession = {
          ...response.data.data,
          testResults: [],
          currentTestNumber: 1,
          totalScore: 100,
          isCompleted: false
        }
        setCurrentSession(newSession)
        return { success: true, session: newSession }
      } else {
        return { success: false, message: response.data.error?.message || 'Không thể tạo phiên thi' }
      }
    } catch (error) {
      console.error('Failed to start session:', error)
      return { success: false, message: 'Lỗi kết nối server' }
    } finally {
      setIsLoading(false)
    }
  }

  // Record error for current test
  const recordError = async (testNumber, errorData) => {
    if (!currentSession) {
      return { success: false, message: 'Không có phiên thi nào đang hoạt động' }
    }

    try {
      console.log('🔍 Recording error:', { testNumber, errorData, currentSession: currentSession?.id })
      
      // Update local session state immediately for better UX
      const updatedSession = { ...currentSession }
      
      // Find existing test result or create new one
      let testResult = updatedSession.testResults.find(r => r.testNumber === testNumber)
      if (!testResult) {
        testResult = {
          testNumber,
          testName: testDefinitions.find(t => t.lesson_number === testNumber)?.lesson_name || `Bài ${testNumber}`,
          errorsDetected: [],
          pointsDeducted: 0,
          isDisqualified: false
        }
        updatedSession.testResults.push(testResult)
      }

      // Add error to test result
      testResult.errorsDetected.push({
        ...errorData,
        timestamp: new Date().toISOString()
      })

      // Update points
      if (errorData.type === 'disqualification') {
        testResult.isDisqualified = true
        updatedSession.totalScore = 0
      } else {
        testResult.pointsDeducted += errorData.points
        updatedSession.totalScore = Math.max(0, 100 - updatedSession.testResults.reduce((sum, result) => sum + result.pointsDeducted, 0))
      }

      setCurrentSession(updatedSession)

      // Save to backend
      console.log('🔍 Saving to backend:', {
        sessionId: currentSession.id,
        testResultsCount: updatedSession.testResults.length,
        totalScore: updatedSession.totalScore
      })
      
      const response = await axios.put(`/sessions/${currentSession.id}`, {
        test_results: updatedSession.testResults,
        total_score: updatedSession.totalScore
      })
      
      console.log('✅ Backend response:', response.data)

      if (response.data.success) {
        return { success: true, session: updatedSession }
      } else {
        // Revert local changes if backend fails
        setCurrentSession(currentSession)
        return { success: false, message: response.data.error?.message || 'Không thể lưu lỗi' }
      }
    } catch (error) {
      console.error('❌ Failed to record error:', error.response?.status, error.response?.data, error.message)
      // Revert local changes if request fails
      setCurrentSession(currentSession)
      return { success: false, message: error.response?.data?.error?.message || 'Lỗi kết nối server' }
    }
  }

  // Complete current test and move to next
  const completeTest = async (testNumber) => {
    if (!currentSession) {
      return { success: false, message: 'Không có phiên thi nào đang hoạt động' }
    }

    const updatedSession = { ...currentSession }
    
    // Move to next test or complete session
    if (testNumber < 11) {
      updatedSession.currentTestNumber = testNumber + 1
    } else {
      updatedSession.isCompleted = true
      updatedSession.completedAt = new Date().toISOString()
    }

    setCurrentSession(updatedSession)
    return { success: true, session: updatedSession }
  }

  // Complete entire session
  const completeSession = async () => {
    if (!currentSession) {
      return { success: false, message: 'Không có phiên thi nào đang hoạt động' }
    }

    try {
      setIsLoading(true)
      const response = await axios.put(`/sessions/${currentSession.id}`, {
        status: 'completed',
        test_results: currentSession.testResults,
        total_score: currentSession.totalScore
      })

      if (response.data.success) {
        const completedSession = {
          ...currentSession,
          isCompleted: true,
          status: 'completed',
          completedAt: new Date().toISOString()
        }
        
        // Add to history
        setSessionHistory(prev => [completedSession, ...prev])
        
        // Clear current session
        setCurrentSession(null)
        
        return { success: true, session: completedSession }
      } else {
        return { success: false, message: response.data.error?.message || 'Không thể hoàn thành phiên thi' }
      }
    } catch (error) {
      console.error('Failed to complete session:', error)
      return { success: false, message: 'Lỗi kết nối server' }
    } finally {
      setIsLoading(false)
    }
  }

  // Cancel current session
  const cancelSession = async () => {
    if (!currentSession) {
      return { success: false, message: 'Không có phiên thi nào đang hoạt động' }
    }

    try {
      setIsLoading(true)
      const response = await axios.put(`/sessions/${currentSession.id}`, {
        status: 'cancelled'
      })

      if (response.data.success) {
        setCurrentSession(null)
        return { success: true }
      } else {
        return { success: false, message: response.data.error?.message || 'Không thể hủy phiên thi' }
      }
    } catch (error) {
      console.error('Failed to cancel session:', error)
      return { success: false, message: 'Lỗi kết nối server' }
    } finally {
      setIsLoading(false)
    }
  }

  // Load session history
  const loadSessionHistory = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('/sessions')
      if (response.data.success) {
        setSessionHistory(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load session history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get test definition by number
  const getTestDefinition = (testNumber) => {
    const result = testDefinitions.find(test => test.lesson_number === testNumber)
    console.log(`🔍 getTestDefinition(${testNumber}):`, result ? 'found' : 'not found', { testDefinitionsCount: testDefinitions.length })
    return result
  }

  // Check if emergency test should appear before this lesson
  const shouldShowEmergencyTest = (lessonNumber) => {
    return emergencyTestPosition === lessonNumber
  }

  // Get emergency test definition
  const getEmergencyTestDefinition = () => {
    return getTestDefinition(12) // Emergency test is lesson 12
  }

  // Calculate session statistics
  const getSessionStats = (session = currentSession) => {
    if (!session) return null

    const totalErrors = session.testResults.reduce((sum, result) => sum + result.errorsDetected.length, 0)
    const totalPointsDeducted = session.testResults.reduce((sum, result) => sum + result.pointsDeducted, 0)
    const isDisqualified = session.testResults.some(result => result.isDisqualified)
    const isPassed = session.totalScore >= 80 && !isDisqualified
    const completedTests = session.testResults.length

    return {
      totalErrors,
      totalPointsDeducted,
      isDisqualified,
      isPassed,
      completedTests,
      finalScore: session.totalScore
    }
  }

  const value = {
    // State
    currentSession,
    testDefinitions,
    sessionHistory,
    isLoading,
    
    // Actions
    startSession,
    recordError,
    completeTest,
    completeSession,
    cancelSession,
    loadSessionHistory,
    loadTestDefinitions, // Expose this for manual reload
    
    // Utilities
    getTestDefinition,
    getSessionStats,
    
    // Emergency test
    emergencyTestPosition,
    shouldShowEmergencyTest,
    getEmergencyTestDefinition
  }

  return (
    <TestSessionContext.Provider value={value}>
      {children}
    </TestSessionContext.Provider>
  )
}