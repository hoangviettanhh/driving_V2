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
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-700 ${
      testCompleted 
        ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600' 
        : emergencyActive 
          ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500' 
          : 'bg-gradient-to-br from-red-500 via-red-600 to-rose-700'
    }`}>
      
      {/* Compact centered content */}
      <div className="relative z-10 text-center p-6 max-w-sm mx-auto">
        
        {!testCompleted ? (
          <>
            {/* Compact alert icon */}
            <div className="mb-6 relative">
              <div className="w-20 h-20 bg-white bg-opacity-25 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white shadow-2xl animate-pulse">
                <AlertTriangle className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -inset-3 border-2 border-white rounded-full opacity-40 animate-ping"></div>
            </div>

            {/* Compact title */}
            <div className="mb-6">
              <h1 className="text-3xl font-black text-white animate-pulse drop-shadow-2xl mb-2">
                🚨 KHẨN CẤP! 🚨
              </h1>
              <p className="text-lg text-yellow-300 font-bold">
                XỬ LÝ NGAY LẬP TỨC!
              </p>
            </div>

            {/* Main countdown - LARGER AND PROMINENT */}
            <div className="mb-6 relative">
              <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-6xl font-black text-white border-6 border-white animate-pulse shadow-2xl">
                {timeLeft}
              </div>
              <div className="absolute -inset-4 border-4 border-red-400 rounded-full opacity-50 animate-spin"></div>
              <p className="text-white font-bold mt-3 text-lg">Giây</p>
            </div>

            {/* Compact emergency button */}
            {!emergencyActive ? (
              <button
                onClick={handleEmergencyButton}
                className="w-64 h-16 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-4 border-white rounded-xl text-white font-black text-lg shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse"
              >
                🚨 BẤM ĐỂ XỬ LÝ 🚨
              </button>
            ) : (
              <div className="w-64 h-16 bg-gradient-to-r from-green-500 to-emerald-600 border-4 border-white rounded-xl flex items-center justify-center text-white font-black text-lg shadow-2xl animate-bounce">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>✅ ĐANG XỬ LÝ...</span>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Compact success state */
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 bg-white bg-opacity-25 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white shadow-2xl animate-bounce">
                <CheckCircle className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -inset-3 border-3 border-emerald-400 rounded-full opacity-60 animate-ping"></div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-black text-white drop-shadow-2xl">🎉 HOÀN THÀNH!</h1>
              <p className="text-lg text-white font-bold">Xử lý thành công!</p>
              <p className="text-sm text-emerald-100">Quay lại bài thi...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmergencyTest