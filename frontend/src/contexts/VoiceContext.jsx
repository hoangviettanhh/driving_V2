import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

// Simple fallback for audioManager to avoid circular dependency
const getAudioManager = () => {
  try {
    // Try to get audioManager from window if available
    if (typeof window !== 'undefined' && window.__audioManager) {
      return window.__audioManager
    }
    return null
  } catch (e) {
    // Silently fail - this is expected during initial load
    return null
  }
}

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
  const [processedVoices, setProcessedVoices] = useState([]) // Includes virtual Vietnamese voices
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [rate, setRate] = useState(1.5) // User requested rate
  const [pitch, setPitch] = useState(0.8) // User requested pitch  
  const [volume, setVolume] = useState(0.9) // User requested volume
  const lastWelcomeTimeRef = useRef(0)
  


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

  // Create virtual Vietnamese female voices if no real ones exist
  const createVirtualVietnameseVoices = (availableVoices) => {
    const cuteVietnameseNames = [
      'Linh', 'Mai', 'Ngọc', 'Hương', 'Lan', 'Hoa', 'Thu', 'Nga', 
      'Vy', 'My', 'Anh', 'Phương', 'Thảo', 'Trang', 'Nhung', 'Dung'
    ]
    
    // Find the best female voices to use as base
    const baseFemaleVoices = availableVoices.filter(voice => {
      const name = voice.name.toLowerCase()
      return name.includes('female') || 
             name.includes('woman') || 
             ['anna', 'aria', 'jenny', 'zira', 'hazel', 'samantha'].some(n => name.includes(n))
    })
    
    // Create virtual Vietnamese voices
    const virtualVoices = []
    cuteVietnameseNames.forEach((vietnameseName, index) => {
      const baseVoice = baseFemaleVoices[index % baseFemaleVoices.length] || availableVoices[0]
      if (baseVoice) {
        // Create a virtual voice object that looks Vietnamese
        const virtualVoice = {
          ...baseVoice,
          name: `${vietnameseName} (Tiếng Việt)`,
          lang: 'vi-VN',
          localService: true,
          default: false,
          voiceURI: `${vietnameseName.toLowerCase()}-vi-VN`,
          // Keep the original voice for actual speech synthesis
          _originalVoice: baseVoice
        }
        virtualVoices.push(virtualVoice)
      }
    })
    
    return virtualVoices.slice(0, 8) // Limit to 8 voices
  }

  // Get Vietnamese female voices with priority ranking
  const getCuteVoices = (availableVoices) => {
    const vietnameseVoiceKeywords = [
      // Vietnamese specific keywords
      'vietnam', 'vietnamese', 'vi-vn', 'vi_vn', 'vn',
      // Vietnamese female names
      'linh', 'mai', 'hương', 'lan', 'hoa', 'thu', 'nga', 'vy', 'my', 'anh',
      'nữ', 'female', 'woman', 'girl',
      // Voice technology keywords
      'neural', 'wavenet', 'standard', 'google', 'microsoft', 'azure'
    ]
    
    return availableVoices
      .filter(voice => {
        const name = voice.name.toLowerCase()
        const lang = voice.lang.toLowerCase()
        
        // ONLY Vietnamese language voices - strict filter
        const isStrictlyVietnamese = 
          lang.startsWith('vi-') || 
          lang === 'vi' ||
          lang.includes('vietnam') ||
          name.includes('vietnam') ||
          name.includes('vietnamese')
        
        // Skip if not Vietnamese at all
        if (!isStrictlyVietnamese) {
          return false
        }
        
        // Must be likely female (for Vietnamese voices only)
        const isLikelyFemale = 
          name.includes('female') || 
          name.includes('woman') || 
          name.includes('nữ') ||
          name.includes('girl') ||
          // Vietnamese female names
          ['linh', 'mai', 'hương', 'lan', 'hoa', 'thu', 'nga', 'vy', 'my', 'anh'].some(n => name.includes(n))
        
        // Final check: absolutely NO foreign language codes
        const hasForeignLangCode = 
          lang.includes('en-') || lang.includes('ja-') || lang.includes('zh-') || 
          lang.includes('ko-') || lang.includes('fr-') || lang.includes('de-') ||
          lang.includes('es-') || lang.includes('it-') || lang.includes('pt-') ||
          lang.includes('ru-') || lang.includes('ar-') || lang.includes('hi-') ||
          lang.startsWith('en') || lang.startsWith('ja') || lang.startsWith('zh') ||
          lang.startsWith('ko') || lang.startsWith('fr') || lang.startsWith('de') ||
          lang.startsWith('es') || lang.startsWith('it') || lang.startsWith('pt') ||
          lang.startsWith('ru') || lang.startsWith('ar') || lang.startsWith('hi') ||
          // Also block specific country codes that are NOT Vietnam
          lang.includes('-US') || lang.includes('-UK') || lang.includes('-AU') ||
          lang.includes('-CA') || lang.includes('-DE') || lang.includes('-FR') ||
          lang.includes('-JP') || lang.includes('-CN') || lang.includes('-KR')
        
        if (hasForeignLangCode) {
          return false
        }
        
        return isLikelyFemale
      })
      .sort((a, b) => {
        // Priority scoring for Vietnamese voices
        const getScore = (voice) => {
          const name = voice.name.toLowerCase()
          const lang = voice.lang.toLowerCase()
          let score = 0
          
          // Exact Vietnamese language gets highest priority
          if (lang === 'vi-vn' || lang === 'vi_vn') score += 100
          if (lang.startsWith('vi')) score += 80
          if (name.includes('vietnam')) score += 70
          
          // High-quality voice technologies
          if (name.includes('neural')) score += 60
          if (name.includes('wavenet')) score += 50
          if (name.includes('google')) score += 40
          if (name.includes('microsoft') || name.includes('azure')) score += 35
          
          // Female indicators
          if (name.includes('female')) score += 30
          if (name.includes('nữ')) score += 25
          if (name.includes('woman')) score += 20
          
          // Vietnamese female names (likely to be cute)
          const femaleNames = ['linh', 'mai', 'hương', 'lan', 'hoa', 'thu', 'nga', 'vy', 'my', 'anh']
          if (femaleNames.some(n => name.includes(n))) score += 45
          
          return score
        }
        
        return getScore(b) - getScore(a)
      })
  }

  // Load available voices
  const loadVoices = useCallback(() => {
    const availableVoices = speechSynthesis.getVoices()
    setVoices(availableVoices)
    

    
    // Find Vietnamese female voices
    const cuteVoices = getCuteVoices(availableVoices)
    
    // ALWAYS create virtual Vietnamese voices for better UX
    const virtualVietnameseVoices = createVirtualVietnameseVoices(availableVoices)
    
    // Combine real + virtual, prioritizing real ones
    const allVietnameseVoices = [...cuteVoices, ...virtualVietnameseVoices]
    
    // Remove duplicates and limit to 10 voices
    const uniqueVoices = allVietnameseVoices.filter((voice, index, arr) => 
      arr.findIndex(v => v.name === voice.name) === index
    ).slice(0, 10)
    
    console.log('🎤 Final Vietnamese voices:', uniqueVoices.map(v => `${v.name} (${v.lang})`))
    
    // Use the combined list
    const finalCuteVoices = uniqueVoices
    
    // Store processed voices (including virtual ones)
    console.log('💾 Setting processedVoices to:', finalCuteVoices.map(v => `${v.name} (${v.lang})`))
    setProcessedVoices(finalCuteVoices)
    
    // Find the BEST voice for Vietnamese - same logic as VoiceSettingsPage
    const bestVietnameseVoice = 
      // Priority 1: Real Vietnamese voice
      availableVoices.find(v => v.lang.toLowerCase().startsWith('vi-')) ||
      availableVoices.find(v => v.lang.toLowerCase() === 'vi') ||
      
      // Priority 2: High-quality neural voices
      availableVoices.find(v => v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('female')) ||
      availableVoices.find(v => v.name.toLowerCase().includes('microsoft') && v.name.toLowerCase().includes('female')) ||
      
      // Priority 3: Known multilingual voices
      availableVoices.find(v => v.name.toLowerCase().includes('samantha')) ||
      availableVoices.find(v => v.name.toLowerCase().includes('karen')) ||
      
      // Fallback: any female voice
      availableVoices.find(v => !v.name.toLowerCase().includes('male')) ||
      availableVoices[0]
    
    console.log('🇻🇳 Best Vietnamese base voice found:', bestVietnameseVoice?.name, `(${bestVietnameseVoice?.lang})`)
    
    // FORCE CLEAR old settings to apply user requested settings
    console.log('🔄 FORCE CLEARING localStorage to apply new voice settings')
    localStorage.removeItem('driving_test_voice_settings')
    
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('driving_test_voice_settings')
    if (savedSettings && !selectedVoice) {
      try {
        const settings = JSON.parse(savedSettings)
        if (settings && typeof settings === 'object' && settings.selectedVoice) {
          const voiceWithBase = {
            ...settings.selectedVoice,
            lang: 'vi-VN',
            _originalVoice: bestVietnameseVoice,
            _customPitch: Number(settings.selectedVoice?.pitch) || 1.2,
            _customRate: Number(settings.selectedVoice?.rate) || 0.8
          }
          
          setSelectedVoice(voiceWithBase)
          setIsEnabled(Boolean(settings.isEnabled ?? true))
          setRate(Number(settings.rate) || 1.5) // User requested default rate
          setPitch(Number(settings.pitch) || 0.8) // User requested default pitch
          setVolume(Number(settings.volume) || 0.9)
          
  
        } else {
          console.warn('Invalid voice settings format:', settings)
        }
      } catch (error) {
        console.error('❌ Error loading voice settings:', error)
        // Clear invalid settings
        localStorage.removeItem('driving_test_voice_settings')
      }
    } else if (!selectedVoice && availableVoices.length > 0) {
      // Default voice if no saved settings
      const defaultVietnameseVoice = { 
        name: 'Linh', 
        lang: 'vi-VN', 
        pitch: 0.8, // User requested pitch
        rate: 1.5, // User requested rate
        _originalVoice: bestVietnameseVoice,
        _customPitch: 0.8,
        _customRate: 1.5 // User requested rate
      }
      setSelectedVoice(defaultVietnameseVoice)

    }
  }, [selectedVoice])

  // Speak text function - Enhanced with AudioManager fallback
  const speak = useCallback(async (text, options = {}) => {
    if (!isEnabled || !text) {
      return Promise.resolve()
    }

    // Try to use pre-recorded audio first for common phrases
    const audioKey = getAudioKeyForText(text)
    const audioManager = getAudioManager()
    
    if (audioKey && audioManager && audioManager.isEnabled) {
      try {
        await audioManager.play(audioKey, options)
        return
      } catch (error) {
        console.warn('❌ Audio playback failed, falling back to TTS:', error)
      }
    }

    // ResponsiveVoice disabled due to CORS issues
    // Using optimized Web Speech API instead

    // Fallback to Web Speech API
    if (!isSupported) {
      return Promise.resolve()
    }

    // Stop any current speech and wait a bit for cleanup
    speechSynthesis.cancel()
    
    // Small delay to ensure previous speech is properly cancelled
    await new Promise(resolve => setTimeout(resolve, 50))

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        
        // Configure utterance - use original voice if it's a virtual voice
        const voiceToUse = selectedVoice?._originalVoice || selectedVoice
        utterance.voice = voiceToUse
        
        // Use custom voice settings if available, otherwise use global settings
        utterance.rate = options.rate || selectedVoice?._customRate || rate
        utterance.pitch = options.pitch || selectedVoice?._customPitch || pitch
        utterance.volume = options.volume || volume
        utterance.lang = 'vi-VN' // Force Vietnamese language
        
        // Debug logs for voice verification (removed for production)
        
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
          // Don't log common/expected errors
          if (event.error !== 'not-allowed' && event.error !== 'interrupted' && event.error !== 'canceled') {
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
    // Stop Web Speech API
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
    const now = Date.now()
    
    // Debounce: only allow welcome message every 3 seconds
    if (now - lastWelcomeTimeRef.current < 3000) {
      return Promise.resolve()
    }
    
    lastWelcomeTimeRef.current = now
    const text = `Xin chào ${instructorName}. Chào mừng đến với ứng dụng chấm điểm thi lái xe.`
    return speak(text)
  }, [speak])

  // Get cute voices for voice selector - ALWAYS return custom Vietnamese voices
  // Helper function to map text to audio keys
  const getAudioKeyForText = useCallback((text) => {
    const lowerText = text.toLowerCase()
    
    // Map lesson numbers - FIXED regex to be more specific and avoid conflicts
    const lessonMatch = lowerText.match(/^bài\s+(?:thi\s+)?(?:số\s+)?(\d+)/i) || 
                       lowerText.match(/^(\d+)\.\s/) ||
                       lowerText.match(/^bài\s+tiếp\s+theo/i)
    
    if (lessonMatch) {
      const lessonNum = parseInt(lessonMatch[1])
      if (lessonNum >= 1 && lessonNum <= 11) {
        // ONLY skip if this is clearly an error message, not a lesson title
        const isErrorMessage = lowerText.includes('lỗi:') || lowerText.includes('trừ') || lowerText.includes('điểm')
        
        if (!isErrorMessage) {
          return `lesson${lessonNum}`
        }
      }
    }
    
    // UPDATED: Thử tìm audio trực tiếp bằng tên lỗi từ database
    const audioManager = getAudioManager()

    
    if (audioManager && audioManager.audioFiles && audioManager.audioFiles[text]) {
      return text // Return exact text as key
    }
    
    // Map common error phrases - UPDATED với các lỗi mới
    const errorMappings = {
      // Lỗi vị trí
      'dừng xe chưa đến vị trí': 'Dừng xe chưa đến vị trí',
      'dừng xe chưa đúng vị trí': 'Dừng xe chưa đúng vị trí', 
      'ghép xe chưa đúng vị trí': 'Ghép xe chưa đúng vị trí',
      'chưa đúng vị trí': 'Ghép xe chưa đúng vị trí',
      'chưa đến vị trí': 'Dừng xe chưa đến vị trí',
      
      // Lỗi bánh xe
      'bánh xe đè vạch': 'Bánh xe đè vạch',
      'bánh xe đèv vạch': 'Bánh xe đèv vạch', // Typo trong database
      'bánh xe không đi vô vệt bánh xe': 'Bánh xe không đi vô vệt bánh xe',
      
      // Lỗi cụ thể có file âm thanh - UPDATED theo database mới
      'xe bị chết máy': 'Xe bị chết máy',
      'không đạt tốc độ': 'Không đạt tốc độ',
      
      // Backward compatibility
      'dừng xe chưa đến': 'notReachedYet',
      'vào bài không đúng số': 'wrongGear',
      'vi phạm': 'violation',
      'khẩn cấp': 'emergency',
      'qua vị trí': 'passPosition'
    }
    
    // Thử exact match trước
    for (const [phrase, key] of Object.entries(errorMappings)) {
      if (text === phrase || lowerText === phrase.toLowerCase()) {
        return key
      }
    }
    
    // Thử partial match
    for (const [phrase, key] of Object.entries(errorMappings)) {
      if (lowerText.includes(phrase.toLowerCase())) {
        return key
      }
    }
    
    return null
  }, [])
  
  const getCuteVoicesForSelector = useCallback(() => {
    // Get best available female voice as base
    const availableVoices = speechSynthesis.getVoices()
    const baseFemaleVoices = availableVoices.filter(voice => {
      const name = voice.name.toLowerCase()
      return name.includes('female') || name.includes('woman') || 
             name.includes('samantha') || name.includes('karen') ||
             name.includes('anna') || name.includes('zira') ||
             name.includes('susan') || name.includes('victoria') ||
             !name.includes('male')
    })
    
    const baseVoice = baseFemaleVoices[0] || availableVoices[0]
    
    // ALWAYS return 10 custom Vietnamese voices
    const customVietnameseVoices = [
      { name: 'Linh', lang: 'vi-VN', voiceURI: 'linh-vi-vn', localService: true, default: false, _originalVoice: baseVoice },
      { name: 'Mai', lang: 'vi-VN', voiceURI: 'mai-vi-vn', localService: true, default: false, _originalVoice: baseVoice },
      { name: 'Ngọc', lang: 'vi-VN', voiceURI: 'ngoc-vi-vn', localService: true, default: false, _originalVoice: baseVoice },
      { name: 'Hương', lang: 'vi-VN', voiceURI: 'huong-vi-vn', localService: true, default: false, _originalVoice: baseVoice },
      { name: 'Lan', lang: 'vi-VN', voiceURI: 'lan-vi-vn', localService: true, default: false, _originalVoice: baseVoice },
      { name: 'Hoa', lang: 'vi-VN', voiceURI: 'hoa-vi-vn', localService: true, default: false, _originalVoice: baseVoice },
      { name: 'Thu', lang: 'vi-VN', voiceURI: 'thu-vi-vn', localService: true, default: false, _originalVoice: baseVoice },
      { name: 'Nga', lang: 'vi-VN', voiceURI: 'nga-vi-vn', localService: true, default: false, _originalVoice: baseVoice },
      { name: 'Vy', lang: 'vi-VN', voiceURI: 'vy-vi-vn', localService: true, default: false, _originalVoice: baseVoice },
      { name: 'Anh', lang: 'vi-VN', voiceURI: 'anh-vi-vn', localService: true, default: false, _originalVoice: baseVoice }
    ]
    
    // Custom Vietnamese voices created
    return customVietnameseVoices
  }, [])

  // Test voice function
  const testVoice = useCallback((voice) => {
    if (!voice || !isSupported) {
      console.warn('Cannot test voice: voice not provided or not supported')
      return
    }
    
    const oldVoice = selectedVoice
    setSelectedVoice(voice)
    speak('Chào em! Em là giọng đọc cute của ứng dụng lái xe đây ạ. Em sẽ hướng dẫn anh chị thi thật tốt nhé!').then(() => {
      // Don't revert back automatically - let user choose
    }).catch((error) => {
      console.error('Test voice failed:', error)
      // Revert to old voice if test fails
      setSelectedVoice(oldVoice)
    })
  }, [speak, selectedVoice, isSupported])

  const value = {
    // State
    isSupported,
    isEnabled,
    isSpeaking,
    voices,
    processedVoices,
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
    speakWelcome,
    
    // Voice selection helpers
    getCuteVoicesForSelector,
    testVoice,
    
    // Audio Manager integration
    audioManager: getAudioManager(),
    getAudioKeyForText
  }

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  )
}