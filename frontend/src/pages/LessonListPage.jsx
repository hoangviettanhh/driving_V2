import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Volume2, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useVoice } from '../contexts/VoiceContext'
import { useAudio } from '../hooks/useAudio'
import axios from 'axios'

const LessonListPage = () => {
  const { user } = useAuth()
  const { speak } = useVoice()
  const { playLesson, playError, playTestBeep, playAlertSound } = useAudio()
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedLessons, setExpandedLessons] = useState(new Set())

  // Load lessons from API
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await axios.get('/tests')
        if (response.data.success) {
          setLessons(response.data.data)
        }
      } catch (error) {
        console.error('Failed to load lessons:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLessons()
  }, [])

  // Toggle lesson expansion
  const toggleLesson = (lessonId) => {
    const newExpanded = new Set(expandedLessons)
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId)
    } else {
      newExpanded.add(lessonId)
    }
    setExpandedLessons(newExpanded)
  }

  // Play lesson audio
  const handlePlayLesson = async (lessonNumber, lessonName) => {
    try {
      await playLesson(lessonNumber)
    } catch (error) {
      // Fallback to AI voice
      speak(`Bài thi số ${lessonNumber}: ${lessonName}`)
    }
  }

  // Play error audio
  const handlePlayError = async (errorText) => {
    try {
      // Check if audio file exists for this error
      const audioManager = window.__audioManager
      const hasAudioFile = audioManager && audioManager.audioFiles && audioManager.audioFiles[errorText]
      
      if (hasAudioFile) {
        // Try to play audio file
        await playError(errorText)
      } else {
        // No audio file, use AI voice directly
        speak(errorText)
      }
    } catch (error) {
      // Fallback to AI voice if audio fails
      speak(errorText)
    }
  }

  // Parse errors from JSON
  const parseErrors = (commonErrors) => {
    try {
      return typeof commonErrors === 'string' 
        ? JSON.parse(commonErrors) 
        : commonErrors || []
    } catch {
      return []
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách bài thi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 space-y-4 pb-20 max-w-lg mx-auto bg-gray-50 min-h-screen">
      {/* Lessons List */}
      <div className="space-y-3">
        {lessons.map((lesson) => {
          const isExpanded = expandedLessons.has(lesson.id)
          const errors = parseErrors(lesson.common_errors)
          
          return (
            <div key={lesson.id} className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
              {/* Lesson Header */}
              <div className="p-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => toggleLesson(lesson.id)}
                  >
                    {/* Lesson Number */}
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600">
                        {lesson.lesson_number}
                      </span>
                    </div>
                    
                    {/* Lesson Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {lesson.lesson_name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {errors.length} lỗi thường gặp
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                    {/* Play Audio Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlayLesson(lesson.lesson_number, lesson.lesson_name)
                      }}
                      className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors duration-200"
                    >
                      <Volume2 className="w-4 h-4 text-blue-600" />
                    </button>
                    
                    {/* Expand Icon */}
                    <button
                      onClick={() => toggleLesson(lesson.id)}
                      className="p-1"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Errors */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50">
                  <div className="p-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Các lỗi thường gặp:
                    </h4>
                    
                    {errors.length > 0 ? (
                      <div className="space-y-2">
                        {errors.map((error, index) => (
                          <button
                            key={index}
                            onClick={() => handlePlayError(error.error)}
                            className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200 group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <Volume2 className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200 flex-shrink-0" />
                                <span className="text-sm text-gray-900 group-hover:text-blue-700 transition-colors duration-200 flex-1">
                                  {error.error}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                                {error.type === 'disqualification' ? (
                                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                                    TRUẤT QUYỀN
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium text-red-600">
                                    -{error.points}đ
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                        
                        {/* Special Sound Buttons - Available for all lessons except emergency */}
                        {lesson.lesson_number !== 12 && (
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-3">
                              {/* Tút Button - Only for parking tests (lesson 7 and 10) */}
                              {(lesson.lesson_number === 7 || lesson.lesson_number === 10) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    playTestBeep().catch(error => {
                                      console.error('Failed to play test beep:', error)
                                    })
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-[1.02] group"
                                >
                                  <span className="text-lg">🔔</span>
                                  <span className="text-sm font-bold">Tút</span>
                                </button>
                              )}
                              
                              {/* TingTong Button - Available for all lessons */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  playAlertSound().catch(error => {
                                    console.error('Failed to play alert sound:', error)
                                  })
                                }}
                                className={`bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-[1.02] group ${
                                  (lesson.lesson_number === 7 || lesson.lesson_number === 10) ? '' : 'col-span-2'
                                }`}
                              >
                                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all duration-200">
                                  <span className="text-sm">📢</span>
                                </div>
                                <span className="text-sm font-bold tracking-wide">TingTong</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500 italic">Không có lỗi nào được định nghĩa cho bài thi này.</p>
                        
                        {/* Special Sound Buttons - Even when no errors */}
                        {lesson.lesson_number !== 12 && (
                          <div className="pt-2 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-3">
                              {/* Tút Button - Only for parking tests (lesson 7 and 10) */}
                              {(lesson.lesson_number === 7 || lesson.lesson_number === 10) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    playTestBeep().catch(error => {
                                      console.error('Failed to play test beep:', error)
                                    })
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-[1.02] group"
                                >
                                  <span className="text-lg">🔔</span>
                                  <span className="text-sm font-bold">Tút</span>
                                </button>
                              )}
                              
                              {/* TingTong Button - Available for all lessons */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  playAlertSound().catch(error => {
                                    console.error('Failed to play alert sound:', error)
                                  })
                                }}
                                className={`bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-[1.02] group ${
                                  (lesson.lesson_number === 7 || lesson.lesson_number === 10) ? '' : 'col-span-2'
                                }`}
                              >
                                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all duration-200">
                                  <span className="text-sm">📢</span>
                                </div>
                                <span className="text-sm font-bold tracking-wide">TingTong</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default LessonListPage
