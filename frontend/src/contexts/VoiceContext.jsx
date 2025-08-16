import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const VoiceContext = createContext()

export const useVoice = () => {
  const context = useContext(VoiceContext)
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider')
  }
  return context
}

export const VoiceProvider = ({ children }) => {
  const [isSupported, setIsSupported] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [rate, setRate] = useState(1.1) // Slightly faster for better UX
  const [pitch, setPitch] = useState(1)
  const [volume, setVolume] = useState(0.8)

  // Check speech synthesis support
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true)
      loadVoices()
      
      // Listen for voices changed event
      speechSynthesis.addEventListener('voiceschanged', loadVoices)
      
      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      }
    } else {
      setIsSupported(false)
      console.warn('Speech Synthesis API not supported in this browser')
    }
  }, [])

  // Load available voices
  const loadVoices = useCallback(() => {
    const availableVoices = speechSynthesis.getVoices()
    setVoices(availableVoices)
    
    console.log('🎤 Available voices:', availableVoices.map(v => `${v.name} (${v.lang}) - ${v.gender || 'unknown'}`))
    
    // Priority 1: Vietnamese female voice
    let bestVoice = availableVoices.find(voice => 
      (voice.lang.startsWith('vi') || voice.name.toLowerCase().includes('vietnam')) &&
      (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman') || voice.name.toLowerCase().includes('nữ'))
    )
    
    // Priority 2: Any Vietnamese voice
    if (!bestVoice) {
      bestVoice = availableVoices.find(voice => 
        voice.lang.startsWith('vi') || 
        voice.name.toLowerCase().includes('vietnam') ||
        voice.name.toLowerCase().includes('vietnamese')
      )
    }
    
    // Priority 3: Any female voice (English is ok for Vietnamese text)
    if (!bestVoice) {
      bestVoice = availableVoices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('hazel') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('anna') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('tessa')
      )
    }
    
    // Priority 4: Default voice
    if (!bestVoice) {
      bestVoice = availableVoices.find(voice => voice.default) || availableVoices[0]
    }
    
    if (bestVoice) {
      console.log('🎤 Selected voice:', bestVoice.name, '(' + bestVoice.lang + ')')
      setSelectedVoice(bestVoice)
    }
  }, [])

  // Speak text function
  const speak = useCallback((text, options = {}) => {
    if (!isSupported || !isEnabled || !text) {
      return Promise.resolve()
    }

    // Stop any current speech
    speechSynthesis.cancel()

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        
        // Configure utterance
        utterance.voice = selectedVoice
        utterance.rate = options.rate || rate
        utterance.pitch = options.pitch || pitch
        utterance.volume = options.volume || volume
        utterance.lang = 'vi-VN' // Vietnamese language
        
        // Event handlers
        utterance.onstart = () => {
          setIsSpeaking(true)
        }
        
        utterance.onend = () => {
          setIsSpeaking(false)
          resolve()
        }
        
        utterance.onerror = (event) => {
          setIsSpeaking(false)
          // Don't log "not-allowed" errors as they're expected before user interaction
          if (event.error !== 'not-allowed') {
            console.error('Speech synthesis error:', event.error)
          }
          resolve() // Resolve instead of reject to prevent unhandled promise rejection
        }
        
        // Start speaking
        speechSynthesis.speak(utterance)
        
      } catch (error) {
        setIsSpeaking(false)
        console.error('Speech synthesis error:', error)
        resolve() // Resolve instead of reject
      }
    })
  }, [isSupported, isEnabled, selectedVoice, rate, pitch, volume])

  // Stop speaking
  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [isSupported])

  // Pause speaking
  const pause = useCallback(() => {
    if (isSupported && isSpeaking) {
      speechSynthesis.pause()
    }
  }, [isSupported, isSpeaking])

  // Resume speaking
  const resume = useCallback(() => {
    if (isSupported) {
      speechSynthesis.resume()
    }
  }, [isSupported])

  // Toggle voice enabled/disabled
  const toggleEnabled = useCallback(() => {
    setIsEnabled(prev => {
      const newValue = !prev
      // Stop speaking when disabled
      if (!newValue && isSpeaking) {
        stop()
      }
      // Save preference to localStorage
      localStorage.setItem('driving_test_voice_enabled', newValue.toString())
      return newValue
    })
  }, [isSpeaking, stop])

  // Load voice preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('driving_test_voice_enabled')
    if (savedPreference !== null) {
      setIsEnabled(savedPreference === 'true')
    }
  }, [])

  // Predefined speech functions for common use cases
  const speakTestName = useCallback((testNumber, testName) => {
    const text = `Bài ${testNumber}: ${testName}`
    return speak(text)
  }, [speak])

  const speakError = useCallback((errorText, points) => {
    const text = `Lỗi: ${errorText}. Trừ ${points} điểm.`
    return speak(text)
  }, [speak])

  const speakScore = useCallback((currentScore) => {
    const text = `Điểm hiện tại: ${currentScore} điểm`
    return speak(text)
  }, [speak])

  const speakResult = useCallback((finalScore, isPassed) => {
    const resultText = isPassed ? 'đậu' : 'rớt'
    const text = `Kết quả thi: ${finalScore} điểm. Bạn đã ${resultText}.`
    return speak(text)
  }, [speak])

  const speakWelcome = useCallback((instructorName) => {
    const text = `Xin chào ${instructorName}. Chào mừng đến với ứng dụng chấm điểm thi lái xe.`
    return speak(text)
  }, [speak])

  const value = {
    // State
    isSupported,
    isEnabled,
    isSpeaking,
    voices,
    selectedVoice,
    rate,
    pitch,
    volume,
    
    // Actions
    speak,
    stop,
    pause,
    resume,
    toggleEnabled,
    
    // Settings
    setSelectedVoice,
    setRate,
    setPitch,
    setVolume,
    
    // Predefined functions
    speakTestName,
    speakError,
    speakScore,
    speakResult,
    speakWelcome
  }

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  )
}