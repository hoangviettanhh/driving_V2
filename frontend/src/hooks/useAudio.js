import { useState, useEffect, useCallback } from 'react'
import audioManager from '../utils/AudioManager'

/**
 * Custom hook để sử dụng AudioManager trong React components
 */
export const useAudio = () => {
  const [isEnabled, setIsEnabled] = useState(audioManager.isEnabled)
  const [volume, setVolumeState] = useState(audioManager.volume)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAudio, setCurrentAudio] = useState(null)
  
  // Update trạng thái khi audio thay đổi
  useEffect(() => {
    const checkAudioStatus = () => {
      setIsPlaying(audioManager.isPlaying())
    }
    
    const interval = setInterval(checkAudioStatus, 100)
    return () => clearInterval(interval)
  }, [])
  
  /**
   * Phát âm thanh
   */
  const play = useCallback(async (key, options = {}) => {
    setCurrentAudio(key)
    try {
      await audioManager.play(key, options)
    } finally {
      setCurrentAudio(null)
    }
  }, [])
  
  /**
   * Dừng âm thanh
   */
  const stop = useCallback(() => {
    audioManager.stop()
    setCurrentAudio(null)
  }, [])
  
  /**
   * Tạm dừng âm thanh
   */
  const pause = useCallback(() => {
    audioManager.pause()
  }, [])
  
  /**
   * Tiếp tục phát âm thanh
   */
  const resume = useCallback(() => {
    audioManager.resume()
  }, [])
  
  /**
   * Bật/tắt âm thanh
   */
  const toggleEnabled = useCallback(() => {
    const newState = audioManager.toggleEnabled()
    setIsEnabled(newState)
    return newState
  }, [])
  
  /**
   * Đặt âm lượng
   */
  const setVolume = useCallback((newVolume) => {
    audioManager.setVolume(newVolume)
    setVolumeState(newVolume)
  }, [])
  
  /**
   * Phát âm thanh bài thi
   */
  const playLesson = useCallback(async (lessonNumber) => {
    return play(`lesson${lessonNumber}`)
  }, [play])
  
  /**
   * Phát âm thanh lỗi
   */
  const playError = useCallback(async (errorType) => {
    return audioManager.playError(errorType)
  }, [])
  
  /**
   * Phát âm thanh khẩn cấp
   */
  const playEmergency = useCallback(async () => {
    return audioManager.playEmergency()
  }, [])
  
  /**
   * Test âm thanh
   */
  const testAudio = useCallback(async (key) => {
    return audioManager.testAudio(key)
  }, [])
  
  /**
   * Phát âm thanh bắt đầu thi
   */
  const playTestStart = useCallback(async () => {
    return audioManager.playTestStart()
  }, [])
  
  /**
   * Phát tiếng tút nhận bài thi
   */
  const playTestBeep = useCallback(async () => {
    return audioManager.playTestBeep()
  }, [])
  
  /**
   * Phát âm thanh thông báo thi đạt
   */
  const playTestPassed = useCallback(async () => {
    return audioManager.playTestPassed()
  }, [])
  
  /**
   * Phát âm thanh bài thi kết thúc
   */
  const playTestCompleted = useCallback(async () => {
    return audioManager.playTestCompleted()
  }, [])
  
  /**
   * Phát âm thanh theo tên bài thi
   */
  const speakTestName = useCallback(async (testNumber, testName) => {
    // Ưu tiên file âm thanh, fallback về TTS nếu không có
    try {
      await playLesson(testNumber)
    } catch (error) {
      console.warn(`No audio file for lesson ${testNumber}, using TTS fallback`)
      // Có thể fallback về Web Speech API nếu cần
    }
  }, [playLesson])
  
  /**
   * Phát âm thanh lỗi với điểm trừ
   */
  const speakError = useCallback(async (errorText, points, errorType = null) => {
    try {
      if (errorType) {
        await playError(errorType)
      } else {
        // Map error text to audio files
        const errorMappings = {
          'chưa đúng vị trí': 'wrong_position',
          'dừng xe chưa đến': 'not_reached',
          'vào bài không đúng số': 'wrong_gear',
          'vi phạm': 'violation'
        }
        
        const mappedType = Object.keys(errorMappings).find(key => 
          errorText.toLowerCase().includes(key)
        )
        
        if (mappedType) {
          await playError(errorMappings[mappedType])
        }
      }
    } catch (error) {
      console.warn('Audio playback failed:', error)
    }
  }, [playError])
  
  /**
   * Phát âm thanh điểm số
   */
  const speakScore = useCallback(async (currentScore) => {
    // Có thể thêm file âm thanh cho điểm số sau
    console.log(`Current score: ${currentScore}`)
  }, [])
  
  /**
   * Phát âm thanh kết quả
   */
  const speakResult = useCallback(async (finalScore, isPassed) => {
    // Có thể thêm file âm thanh cho kết quả sau
    console.log(`Final result: ${finalScore} - ${isPassed ? 'Passed' : 'Failed'}`)
  }, [])
  
  return {
    // State
    isEnabled,
    volume,
    isPlaying,
    currentAudio,
    
    // Basic controls
    play,
    stop,
    pause,
    resume,
    toggleEnabled,
    setVolume,
    
    // Lesson specific
    playLesson,
    playError,
    playEmergency,
    testAudio,
    
    // Compatibility with existing VoiceContext
    speakTestName,
    speakError,
    speakScore,
    speakResult,
    
    // Direct access to manager
    audioManager,
    
    // New functions
    playTestStart,
    playTestBeep,
    playTestPassed,
    playTestCompleted,
    playAlertSound: () => audioManager.playAlertSound()
  }
}
