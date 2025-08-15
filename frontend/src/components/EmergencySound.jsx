import React, { useState, useRef, useEffect } from 'react'

const EmergencySound = ({ isPlaying, onComplete }) => {
  const [phase, setPhase] = useState('idle') // idle, warning, completed
  const audioContextRef = useRef(null)
  const oscillatorRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (isPlaying && phase === 'idle') {
      startEmergencySound()
    }
  }, [isPlaying, phase])

  const startEmergencySound = async () => {
    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      setPhase('warning')
      
      // Play warning sound (siren-like)
      await playWarningSiren()
      
      // Wait a moment then play completion beep
      setTimeout(async () => {
        await playCompletionBeep()
        setPhase('completed')
        if (onComplete) onComplete()
      }, 3000) // 3 seconds of warning sound
      
    } catch (error) {
      console.error('Error playing emergency sound:', error)
      setPhase('completed')
      if (onComplete) onComplete()
    }
  }

  const playWarningSiren = () => {
    return new Promise((resolve) => {
      const audioContext = audioContextRef.current
      if (!audioContext) return resolve()

      // Create loud emergency siren like real alarm
      let currentTime = audioContext.currentTime
      const duration = 4 // 4 seconds of loud siren
      
      const playTone = (frequency, startTime, toneDuration) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(frequency, startTime)
        oscillator.type = 'sawtooth' // More harsh, emergency-like sound
        
        // Very loud emergency sound
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(1.0, startTime + 0.05) // Max volume
        gainNode.gain.linearRampToValueAtTime(1.0, startTime + toneDuration - 0.05)
        gainNode.gain.linearRampToValueAtTime(0, startTime + toneDuration)
        
        oscillator.start(startTime)
        oscillator.stop(startTime + toneDuration)
      }

      // Fast alternating high/low like real emergency siren
      const highFreq = 1000  // Higher pitch
      const lowFreq = 300    // Lower pitch
      const toneLength = 0.3 // Faster alternation
      
      for (let i = 0; i < duration / toneLength; i++) {
        const freq = i % 2 === 0 ? highFreq : lowFreq
        playTone(freq, currentTime + (i * toneLength), toneLength)
      }
      
      setTimeout(resolve, duration * 1000)
    })
  }

  const playCompletionBeep = () => {
    return new Promise((resolve) => {
      const audioContext = audioContextRef.current
      if (!audioContext) return resolve()

      // Single high-pitched beep
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(1.0, audioContext.currentTime + 0.05)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.8)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
      
      setTimeout(resolve, 500)
    })
  }

  const cleanup = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop()
      oscillatorRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setPhase('idle')
  }

  useEffect(() => {
    return cleanup // Cleanup on unmount
  }, [])

  return (
    <div className="flex items-center space-x-2 text-red-600">
      {phase === 'warning' && (
        <>
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">🚨 Tình huống khẩn cấp</span>
        </>
      )}
      {phase === 'completed' && (
        <>
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">✅ Hoàn thành</span>
        </>
      )}
    </div>
  )
}

export default EmergencySound
