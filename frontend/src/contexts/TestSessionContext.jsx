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

  // Load test definitions on mount
  useEffect(() => {
    loadTestDefinitions()
  }, [])

  // Load test definitions from backend
  const loadTestDefinitions = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('/tests')
      if (response.data.success) {
        setTestDefinitions(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load test definitions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Start new test session
  const startSession = async (studentName, studentId = '') => {
    try {
      setIsLoading(true)
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
      // Update local session state immediately for better UX
      const updatedSession = { ...currentSession }
      
      // Find existing test result or create new one
      let testResult = updatedSession.testResults.find(r => r.testNumber === testNumber)
      if (!testResult) {
        testResult = {
          testNumber,
          testName: testDefinitions.find(t => t.test_number === testNumber)?.test_name || `Bài ${testNumber}`,
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
      console.error('Failed to record error:', error)
      // Revert local changes if request fails
      setCurrentSession(currentSession)
      return { success: false, message: 'Lỗi kết nối server' }
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
    return testDefinitions.find(test => test.test_number === testNumber)
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
    
    // Utilities
    getTestDefinition,
    getSessionStats
  }

  return (
    <TestSessionContext.Provider value={value}>
      {children}
    </TestSessionContext.Provider>
  )
}