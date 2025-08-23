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
  const [isEmergencyTestActive, setIsEmergencyTestActive] = useState(false) // Manual trigger

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
      const response = await axios.get('/tests')
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // Validate and sanitize test definitions
        const validTestDefinitions = response.data.data.map(test => ({
          ...test,
          id: test.id || test.lesson_number,
          lesson_number: Number(test.lesson_number) || 1,
          lesson_name: test.lesson_name || 'Bài thi',
          description: test.description || '',
          time_limit: Number(test.time_limit) || 300,
          common_errors: test.common_errors || '[]'
        }))
        setTestDefinitions(validTestDefinitions)
      } else {
        console.error('❌ API returned invalid data:', response.data)
        setTestDefinitions([])
      }
    } catch (error) {
      console.error('❌ Failed to load test definitions:', error.response?.status, error.response?.data)
      // If unauthorized, clear token and redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem('driving_test_token')
        delete axios.defaults.headers.common['Authorization']
        window.location.href = '/login'
      }
      // Set empty array on error to prevent crashes
      setTestDefinitions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Trigger emergency test manually - PREVENT MULTIPLE TRIGGERS
  const triggerEmergencyTest = () => {
    if (isEmergencyTestActive) {
      return
    }
    setIsEmergencyTestActive(true)
  }

  // Complete emergency test
  const completeEmergencyTest = () => {
    setIsEmergencyTestActive(false)
    
    // Add small delay to prevent immediate re-trigger
    setTimeout(() => {
    }, 1000)
  }

  // Start new test session
  const startSession = async (studentName, studentId = '') => {
    try {
      setIsLoading(true)
      
      // Validate input
      if (!studentName || typeof studentName !== 'string' || studentName.trim().length === 0) {
        return { success: false, message: 'Tên học viên không hợp lệ' }
      }
      
      // Clear any existing completed session first
      if (currentSession && currentSession.isCompleted) {
        setCurrentSession(null)
      }
      
      // Reset emergency test state for new session
      setIsEmergencyTestActive(false)
      const response = await axios.post('/sessions', {
        student_name: studentName.trim(),
        student_id: studentId ? studentId.trim() : ''
      })

      if (response.data && response.data.success && response.data.data) {
        const newSession = {
          id: response.data.data.id,
          student_name: response.data.data.student_name || studentName.trim(),
          student_id: response.data.data.student_id || studentId.trim(),
          instructor_id: response.data.data.instructor_id,
          status: response.data.data.status || 'in_progress',
          started_at: response.data.data.started_at || new Date().toISOString(),
          testResults: [],
          currentTestNumber: 1,
          totalScore: 100,
          isCompleted: false
        }
        setCurrentSession(newSession)
        return { success: true, session: newSession }
      } else {
        const errorMessage = response.data?.error?.message || 'Không thể tạo phiên thi'
        console.error('Start session failed:', response.data)
        return { success: false, message: errorMessage }
      }
    } catch (error) {
      console.error('Failed to start session:', error.response?.data || error.message)
      const errorMessage = error.response?.data?.error?.message || 'Lỗi kết nối server'
      return { success: false, message: errorMessage }
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
        sessionId: currentSession.id,
        testResultsCount: updatedSession.testResults.length,
        totalScore: updatedSession.totalScore
      })
      
      const response = await axios.put(`/sessions/${currentSession.id}`, {
        test_results: updatedSession.testResults,
        total_score: updatedSession.totalScore
      })
      

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
  const completeSession = async (finalScore = null) => {
    if (!currentSession) {
      return { success: false, message: 'Không có phiên thi nào đang hoạt động' }
    }

    try {
      setIsLoading(true)
      
      // Use provided final score or current session score
      const scoreToUse = finalScore !== null ? finalScore : currentSession.totalScore
      
      
      const response = await axios.put(`/sessions/${currentSession.id}`, {
        status: 'completed',
        test_results: currentSession.testResults,
        total_score: scoreToUse
      })

      if (response.data.success) {
        const completedSession = {
          ...currentSession,
          totalScore: scoreToUse, // Ensure final score is set
          isCompleted: true,
          status: 'completed',
          completedAt: new Date().toISOString()
        }
        
        // Add to history
        setSessionHistory(prev => [completedSession, ...prev])
        
        // Keep completed session for display (don't clear)
        setCurrentSession(completedSession)
        
        
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
    if (!Array.isArray(testDefinitions) || testDefinitions.length === 0) {
      return null
    }
    
    const result = testDefinitions.find(test => {
      const lessonNumber = Number(test?.lesson_number)
      return lessonNumber === Number(testNumber)
    })
    
    return result || null
  }

  // Check if emergency test is currently active
  const shouldShowEmergencyTest = () => {
    return isEmergencyTestActive
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
    
    // Session management
    clearSession: () => setCurrentSession(null),
    
    // Utilities
    getTestDefinition,
    getSessionStats,
    
    // Emergency test
    isEmergencyTestActive,
    triggerEmergencyTest,
    completeEmergencyTest,
    shouldShowEmergencyTest,
    getEmergencyTestDefinition
  }

  return (
    <TestSessionContext.Provider value={value}>
      {children}
    </TestSessionContext.Provider>
  )
}