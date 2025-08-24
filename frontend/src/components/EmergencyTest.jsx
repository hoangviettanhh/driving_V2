import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'

import { useTestSession } from '../contexts/TestSessionContext'
import { useVoice } from '../contexts/VoiceContext'
import { useAudio } from '../hooks/useAudio'

const EmergencyTest = ({ onComplete, onError }) => {
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [soundPlaying, setSoundPlaying] = useState(false)
  const [testPhase, setTestPhase] = useState('waiting') // waiting, active, completed
  const [testCompleted, setTestCompleted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10) // 10 seconds for emergency response
  const [pulseIntensity, setPulseIntensity] = useState(1)
  const [audioSequenceStarted, setAudioSequenceStarted] = useState(false) // Prevent multiple audio starts
  
  const { recordError } = useTestSession()
  const { speak } = useVoice()
  const { playEmergency, play, stop } = useAudio()

  useEffect(() => {
    // ONLY run once when component first mounts
    if (audioSequenceStarted) {
      return
    }
    
    setAudioSequenceStarted(true) // Mark as started to prevent re-runs
    setTestPhase('active')
    
    // Create dramatic pulsing effect
    const pulseInterval = setInterval(() => {
      setPulseIntensity(prev => prev === 1 ? 1.2 : 1)
    }, 500)
    
    // Safety timeout to prevent infinite emergency state (12 seconds max)
    const safetyTimeout = setTimeout(() => {
      setTestCompleted(true)
      setTestPhase('completed')
      if (onComplete) onComplete(0)
    }, 12000) // 12 seconds max to allow full audio playback
    
    // Start emergency audio sequence with delay to show screen first
    const startAudioSequence = setTimeout(() => {
      
      // Play khancap.mp3 and let it run COMPLETELY - DO NOT INTERRUPT
      playEmergency().then(() => {
        handleSoundComplete()
      }).catch(error => {
        console.error('❌ Emergency audio failed:', error)
        // Still complete the test even if audio fails
        handleSoundComplete()
      })
      
      setSoundPlaying(true)
    }, 1000) // 1 second delay to show UI first
    
    // Cleanup function
    return () => {
      clearInterval(pulseInterval)
      clearTimeout(safetyTimeout)
      clearTimeout(startAudioSequence)
      
      // Only stop TTS, let emergency audio complete naturally
      try {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel()
        }
      } catch (error) {
        console.error('Error during emergency cleanup:', error)
      }
    }
  }, []) // EMPTY dependency array to prevent re-runs

  // Countdown timer with increasing urgency
  useEffect(() => {
    if (testPhase === 'active' && !testCompleted && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !emergencyActive) {
      // Timeout - dramatic failure
      setTimeout(() => {
        onComplete && onComplete(0)
      }, 1000)
    }
  }, [testPhase, testCompleted, timeLeft, emergencyActive, speak, onComplete])

  const handleEmergencyButton = async () => {
    
    if (testCompleted) {
      return
    }
    
    // Immediate visual feedback
    setEmergencyActive(true)
    
    // Add screen flash effect
    document.body.style.backgroundColor = '#ff0000'
    setTimeout(() => {
      document.body.style.backgroundColor = ''
    }, 200)
    
    // User responded to emergency - just mark as active, let audio continue naturally
    
    // Award points for user response but let the audio sequence complete first
  }

  const handleSoundComplete = () => {
    setSoundPlaying(false)
    setTestCompleted(true)
    setTestPhase('completed')
    
    setTimeout(() => {
      onComplete && onComplete(0)
    }, 2000)
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-all duration-700 ${
      testCompleted 
        ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600' 
        : emergencyActive 
          ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500' 
          : 'bg-gradient-to-br from-red-500 via-red-600 to-rose-700'
    }`}>
      
      {/* Modern animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div>
        {!testCompleted && (
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-40 h-40 bg-white rounded-full opacity-10 animate-pulse"></div>
            <div className="absolute bottom-32 right-16 w-32 h-32 bg-yellow-300 rounded-full opacity-15 animate-ping"></div>
            <div className="absolute top-1/2 right-20 w-24 h-24 bg-white rounded-full opacity-10 animate-bounce"></div>
            <div className="absolute top-40 right-40 w-16 h-16 bg-red-300 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute bottom-20 left-40 w-20 h-20 bg-orange-300 rounded-full opacity-15 animate-ping"></div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-center">
        
        {!testCompleted ? (
          <>
            {/* Main alert icon with enhanced design */}
            <div className="mb-8 relative">
              <div className="w-36 h-36 bg-white bg-opacity-25 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white shadow-2xl animate-pulse">
                <AlertTriangle className="w-20 h-20 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -inset-6 border-4 border-white rounded-full opacity-40 animate-ping"></div>
              <div className="absolute -inset-8 border-2 border-yellow-300 rounded-full opacity-30 animate-ping" style={{animationDelay: '0.5s'}}></div>
            </div>

            {/* Enhanced title section */}
            <div className="mb-8 space-y-4">
              <h1 className="text-6xl font-black text-white animate-pulse drop-shadow-2xl">
                🚨 NGUY HIỂM! 🚨
              </h1>
              <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-2xl px-6 py-4 border-2 border-yellow-400">
                <h2 className="text-3xl font-bold text-yellow-300 mb-2">
                  TÌNH HUỐNG KHẨN CẤP!
                </h2>
                <p className="text-xl text-white font-semibold">
                  ⚡ XỬ LÝ NGAY LẬP TỨC! ⚡
                </p>
              </div>
            </div>

            {/* Enhanced countdown */}
            <div className="mb-8 relative">
              <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-4xl font-black text-white border-4 border-white animate-pulse shadow-2xl">
                {timeLeft}
              </div>
              <div className="absolute -inset-2 border-2 border-red-400 rounded-full opacity-50 animate-spin"></div>
              <p className="text-white font-bold mt-3 text-lg">Thời gian còn lại</p>
            </div>

            {/* Instructions */}
            <div className="mb-8 bg-black bg-opacity-30 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-400 max-w-sm">
              <h3 className="text-yellow-400 font-bold text-xl mb-4">⚡ HÀNH ĐỘNG NGAY!</h3>
              <div className="space-y-2 text-left text-white">
                <p>1. BẤM NÚT ĐỎ NGAY LẬP TỨC!</p>
                <p>2. Tiếng hú cảnh báo sẽ rất LOUD!</p>
                <p>3. Chờ tiếng "TÍT" kết thúc</p>
              </div>
            </div>

            {/* Enhanced emergency button */}
            {!emergencyActive ? (
              <button
                onClick={handleEmergencyButton}
                className="w-72 h-20 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-4 border-white rounded-2xl text-white font-black text-xl shadow-2xl transform hover:scale-110 transition-all duration-300 animate-pulse relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center justify-center">
                  🚨 BẤM ĐỂ XỬ LÝ KHẨN CẤP 🚨
                </span>
              </button>
            ) : (
              <div className="w-72 h-20 bg-gradient-to-r from-green-500 to-emerald-600 border-4 border-white rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl animate-bounce">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>✅ ĐANG XỬ LÝ...</span>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Enhanced success state */
          <div className="text-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 bg-white bg-opacity-25 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white shadow-2xl animate-bounce">
                <CheckCircle className="w-16 h-16 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -inset-4 border-4 border-emerald-400 rounded-full opacity-60 animate-ping"></div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-white drop-shadow-2xl">🎉 HOÀN THÀNH! 🎉</h1>
              <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-2xl px-6 py-4 border-2 border-emerald-400 max-w-md mx-auto">
                <p className="text-2xl text-white font-bold mb-2">Tình huống khẩn cấp đã được xử lý thành công!</p>
                <p className="text-lg text-emerald-100">Quay lại bài thi trong giây lát...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmergencyTest