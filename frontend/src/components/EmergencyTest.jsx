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
    <div className={`min-h-screen relative overflow-hidden transition-all duration-1000 ${
      testCompleted 
        ? 'bg-gradient-to-br from-green-400 via-green-500 to-green-600' 
        : emergencyActive 
          ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500' 
          : 'bg-gradient-to-br from-red-500 via-red-600 to-red-700'
    }`}>
      
      {/* Clean animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        {!testCompleted && (
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full opacity-5 animate-pulse"></div>
            <div className="absolute bottom-32 right-16 w-24 h-24 bg-yellow-300 rounded-full opacity-10 animate-ping"></div>
            <div className="absolute top-1/2 right-20 w-20 h-20 bg-white rounded-full opacity-5 animate-bounce"></div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-center">
        
        {!testCompleted ? (
          <>
            {/* Main alert icon */}
            <div className="mb-8 relative">
              <div className="w-32 h-32 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white shadow-2xl animate-pulse">
                <AlertTriangle className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -inset-4 border-4 border-white rounded-full opacity-30 animate-ping"></div>
            </div>

            {/* Title */}
            <div className="mb-8 space-y-4">
              <h1 className="text-5xl font-black text-white animate-pulse">
                ⚠️ NGUY HIỂM! ⚠️
              </h1>
              <h2 className="text-2xl font-bold text-yellow-300">
                TÌNH HUỐNG NGUY HIỂM!
              </h2>
              <p className="text-xl text-white font-semibold">
                ⚡ XỬ LÝ NGAY LẬP TỨC!
              </p>
            </div>

            {/* Countdown */}
            <div className="mb-8">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-3xl font-black text-white border-4 border-white animate-pulse shadow-2xl">
                {timeLeft}s
              </div>
              <p className="text-white font-bold mt-2">Thời gian còn lại</p>
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

            {/* Emergency button */}
            {!emergencyActive ? (
              <button
                onClick={handleEmergencyButton}
                className="w-64 h-16 bg-red-600 hover:bg-red-700 border-4 border-white rounded-2xl text-white font-black text-xl shadow-2xl transform hover:scale-105 transition-all duration-200 animate-pulse"
              >
                🚨 BẤM ĐỂ XỬ LÝ KHẨN CẤP
              </button>
            ) : (
              <div className="w-64 h-16 bg-green-500 border-4 border-white rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-2xl animate-bounce">
                ✅ ĐANG XỬ LÝ...
              </div>
            )}
          </>
        ) : (
          /* Success state */
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white shadow-2xl animate-bounce">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-white">✅ HOÀN THÀNH!</h1>
              <p className="text-xl text-white font-bold">Tình huống khẩn cấp đã được xử lý</p>
              <p className="text-lg text-green-100">Quay lại bài thi trong giây lát...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmergencyTest