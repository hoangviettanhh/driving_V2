import React, { useState, useRef, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { useAudio } from '../hooks/useAudio'

const EmergencySound = ({ isPlaying, onComplete }) => {
  const [phase, setPhase] = useState('idle') // idle, warning, completed
  const { playEmergency, play } = useAudio()

  useEffect(() => {
    if (isPlaying && phase === 'idle') {
      console.log('🔊 SHOCK SOUND STARTING NOW!')
      startShockEmergencySound()
    }
  }, [isPlaying, phase])

  const startShockEmergencySound = async () => {
    try {
      setPhase('warning')
      console.log('🔇 EmergencySound component - DISABLED to prevent duplicate audio')
      
      // DO NOT play audio here - EmergencyTest component handles all audio
      // Just mark as completed immediately
      setTimeout(() => {
        setPhase('completed')
        if (onComplete) onComplete()
      }, 100) // Very quick completion
      
    } catch (error) {
      console.error('❌ Emergency sound component error:', error)
      setPhase('completed')
      if (onComplete) onComplete()
    }
  }

  const playShockSiren = () => {
    return new Promise((resolve) => {
      console.log('🚨 PLAYING SHOCK SIREN - VERY LOUD!')
      
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        
        if (audioContext.state === 'suspended') {
          audioContext.resume()
        }
        
        const duration = 4 // 4 seconds of shock
        let currentTime = audioContext.currentTime
        
        // Create SHOCK emergency sound - multiple layers for intensity
        const createShockTone = (baseFreq, startTime, duration) => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          const distortion = audioContext.createWaveShaper()
          
          // Create distortion for more aggressive sound
          const makeDistortionCurve = (amount) => {
            const samples = 44100
            const curve = new Float32Array(samples)
            const deg = Math.PI / 180
            for (let i = 0; i < samples; i++) {
              const x = (i * 2) / samples - 1
              curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
            }
            return curve
          }
          
          distortion.curve = makeDistortionCurve(50)
          distortion.oversample = '4x'
          
          oscillator.connect(distortion)
          distortion.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          // SHOCK pattern - rapid frequency changes like alarm
          oscillator.type = 'sawtooth'
          
          // Rapid alternating pattern - very startling
          const rapidCycles = 16 // 16 rapid changes in 4 seconds
          const cycleTime = duration / rapidCycles
          
          for (let i = 0; i < rapidCycles; i++) {
            const cycleStart = startTime + (i * cycleTime)
            // Alternating between high shock frequencies
            const freq = i % 3 === 0 ? baseFreq * 2 : i % 3 === 1 ? baseFreq * 1.5 : baseFreq
            oscillator.frequency.setValueAtTime(freq, cycleStart)
          }
          
          // VERY LOUD volume envelope
          gainNode.gain.setValueAtTime(0, startTime)
          gainNode.gain.linearRampToValueAtTime(1.0, startTime + 0.05) // MAX VOLUME
          gainNode.gain.setValueAtTime(1.0, startTime + duration - 0.1)
          gainNode.gain.linearRampToValueAtTime(0, startTime + duration)
          
          oscillator.start(startTime)
          oscillator.stop(startTime + duration)
          
          return oscillator
        }
        
        // Create multiple shock layers for intensity
        createShockTone(800, currentTime, duration)     // Base frequency
        createShockTone(1200, currentTime + 0.1, duration - 0.1) // Higher layer
        createShockTone(600, currentTime + 0.2, duration - 0.2)  // Lower layer
        
        console.log('🚨 SHOCK SIREN LAYERS CREATED - PREPARE FOR LOUD SOUND!')
        setTimeout(resolve, duration * 1000)
        
      } catch (error) {
        console.error('❌ Shock siren failed:', error)
        playFallbackShockSound().then(resolve)
      }
    })
  }

  const playFallbackShockSound = () => {
    return new Promise((resolve) => {
      console.log('🔊 FALLBACK SHOCK SOUND!')
      
      // Create multiple audio elements for layered effect
      const createBeepAudio = (frequency, duration) => {
        const audio = new Audio()
        audio.volume = 0.9
        
        // Generate shock beep
        const sampleRate = 22050
        const samples = sampleRate * 4 // 4 seconds duration
        const buffer = new ArrayBuffer(44 + samples * 2)
        const view = new DataView(buffer)
        
        // WAV header
        const writeString = (offset, string) => {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i))
          }
        }
        
        writeString(0, 'RIFF')
        view.setUint32(4, 36 + samples * 2, true)
        writeString(8, 'WAVE')
        writeString(12, 'fmt ')
        view.setUint32(16, 16, true)
        view.setUint16(20, 1, true)
        view.setUint16(22, 1, true)
        view.setUint32(24, sampleRate, true)
        view.setUint32(28, sampleRate * 2, true)
        view.setUint16(32, 2, true)
        view.setUint16(34, 16, true)
        writeString(36, 'data')
        view.setUint32(40, samples * 2, true)
        
        // Generate rapid alternating shock pattern
        for (let i = 0; i < samples; i++) {
          const time = i / sampleRate
          const rapidCycle = Math.floor(time * 8) % 3 // Very rapid changes
          const freq = rapidCycle === 0 ? frequency : rapidCycle === 1 ? frequency * 1.5 : frequency * 2
          const amplitude = 0.6 * Math.sin(2 * Math.PI * freq * time)
          const sample = Math.max(-1, Math.min(1, amplitude)) * 20000 // Louder
          view.setInt16(44 + i * 2, sample, true)
        }
        
        const blob = new Blob([buffer], { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        audio.src = url
        
        return { audio, url }
      }
      
      // Create multiple layers for shock effect
      const layer1 = createBeepAudio(800, 4)
      const layer2 = createBeepAudio(1200, 4)
      
      let completed = 0
      const checkComplete = () => {
        completed++
        if (completed >= 2) {
          URL.revokeObjectURL(layer1.url)
          URL.revokeObjectURL(layer2.url)
          resolve()
        }
      }
      
      layer1.audio.onended = checkComplete
      layer2.audio.onended = checkComplete
      layer1.audio.onerror = checkComplete
      layer2.audio.onerror = checkComplete
      
      // Play all layers simultaneously for shock effect
      layer1.audio.play().catch(() => checkComplete())
      setTimeout(() => {
        layer2.audio.play().catch(() => checkComplete())
      }, 100) // Slight delay for layered effect
    })
  }

  const playSharpCompletionBeep = () => {
    return new Promise((resolve) => {
      console.log('🔔 SHARP COMPLETION BEEP!')
      
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        
        if (audioContext.state === 'suspended') {
          audioContext.resume()
        }
        
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Very sharp, high "TÍT" sound
        oscillator.frequency.value = 2000 // Higher pitch for more shock
        oscillator.type = 'square' // Sharp edge for dramatic effect
        
        const currentTime = audioContext.currentTime
        const beepDuration = 0.5 // Longer for more impact
        
        gainNode.gain.setValueAtTime(0, currentTime)
        gainNode.gain.linearRampToValueAtTime(0.8, currentTime + 0.01) // Very sharp attack
        gainNode.gain.setValueAtTime(0.8, currentTime + beepDuration - 0.1)
        gainNode.gain.linearRampToValueAtTime(0, currentTime + beepDuration)
        
        oscillator.start(currentTime)
        oscillator.stop(currentTime + beepDuration)
        
        setTimeout(resolve, beepDuration * 1000 + 200)
        
      } catch (error) {
        console.error('❌ Sharp beep failed:', error)
        resolve()
      }
    })
  }

  return (
    <div className="flex items-center justify-center">
      {phase === 'warning' && (
        <div className="bg-yellow-400 bg-opacity-90 rounded-2xl p-4 backdrop-blur-sm border-4 border-yellow-300 animate-pulse shadow-lg shadow-yellow-500/50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-red-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-8 h-8 bg-red-600 rounded-full animate-ping opacity-75"></div>
            </div>
            <div className="text-red-800">
              <div className="font-black text-xl">🚨 ĐANG HÚ CÒI!</div>
              <div className="text-sm font-bold">Tín hiệu cảnh báo cực mạnh</div>
            </div>
          </div>
        </div>
      )}
      {phase === 'completed' && (
        <div className="bg-green-500 bg-opacity-95 rounded-2xl p-4 backdrop-blur-sm border-4 border-green-300 shadow-lg">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-white animate-bounce" />
            <div className="text-white">
              <div className="font-black text-xl">✅ HOÀN TẤT!</div>
              <div className="text-sm font-bold text-green-100">Đã phát xong tín hiệu</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmergencySound