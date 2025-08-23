import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Volume2, VolumeX, Play, ArrowLeft, Check, Save } from 'lucide-react'
import Layout from '../components/Layout/Layout'
import { useVoice } from '../contexts/VoiceContext'

const VoiceSettingsPage = () => {
  const navigate = useNavigate()
  const { 
    isEnabled: voiceEnabled, 
    setIsEnabled: setVoiceEnabled,
    selectedVoice: contextVoice,
    setSelectedVoice: setContextVoice,
    rate: contextRate,
    setRate: setContextRate,
    pitch: contextPitch,
    setPitch: setContextPitch,
    volume: contextVolume,
    setVolume: setContextVolume
  } = useVoice()
  
  // Local state for UI only
  const [localSelectedVoice, setLocalSelectedVoice] = useState(null)
  const [isTesting, setIsTesting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const vietnameseVoices = [
    { id: 'linh', name: 'Linh', description: 'Giọng nữ trẻ, trong trẻo', pitch: 1.4, rate: 1.3 },
    { id: 'mai', name: 'Mai', description: 'Giọng nữ ấm áp, dịu dàng', pitch: 1.0, rate: 1.15 },
    { id: 'ngoc', name: 'Ngọc', description: 'Giọng nữ trầm ấm, chín chắn', pitch: 0.8, rate: 1.25 }
  ]

  // Load settings from VoiceContext and localStorage
  useEffect(() => {
    // Use context values first, then fallback to localStorage or defaults
    const savedSettings = localStorage.getItem('driving_test_voice_settings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setLocalSelectedVoice(settings.selectedVoice || vietnameseVoices[0])
    } else {
      // Default to first voice
      setLocalSelectedVoice(vietnameseVoices[0])
    }
  }, [])

  // Sync with VoiceContext - use BEST single base voice for Vietnamese
  useEffect(() => {
    if (localSelectedVoice && contextVoice?.name !== localSelectedVoice.name) {
      const voices = speechSynthesis.getVoices()
      
      // Find the BEST voice for Vietnamese - strict priority
      const bestVietnameseVoice = 
        // First: Real Vietnamese voice
        voices.find(v => v.lang.toLowerCase().startsWith('vi-')) ||
        voices.find(v => v.lang.toLowerCase() === 'vi') ||
        
        // Second: High-quality neural voices that work well with Vietnamese
        voices.find(v => v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('female')) ||
        voices.find(v => v.name.toLowerCase().includes('microsoft') && v.name.toLowerCase().includes('female')) ||
        
        // Third: Known good voices for multilingual
        voices.find(v => v.name.toLowerCase().includes('samantha')) ||
        voices.find(v => v.name.toLowerCase().includes('karen')) ||
        
        // Last resort: any female voice
        voices.find(v => !v.name.toLowerCase().includes('male')) ||
        voices[0]
      
      // Load voice's default pitch/rate into sliders
      setContextPitch(localSelectedVoice.pitch)
      setContextRate(localSelectedVoice.rate)
      
      const voiceWithBase = {
        ...localSelectedVoice,
        lang: 'vi-VN',
        _originalVoice: bestVietnameseVoice,
        _customPitch: localSelectedVoice.pitch,
        _customRate: localSelectedVoice.rate
      }
      
      console.log(`🇻🇳 All voices use SAME BASE for Vietnamese:`, bestVietnameseVoice.name, `(${bestVietnameseVoice.lang})`)
      console.log(`🎵 "${localSelectedVoice.name}" defaults loaded: pitch=${localSelectedVoice.pitch}, rate=${localSelectedVoice.rate}`)
      setContextVoice(voiceWithBase)
    }
  }, [localSelectedVoice, contextVoice, setContextVoice, setContextPitch, setContextRate])

  // Test voice function
  const testVoice = async () => {
    if (!voiceEnabled || !localSelectedVoice) return
    
    setIsTesting(true)
    
    try {
      // Stop any current speech
      speechSynthesis.cancel()
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(
        `Xin chào! Tôi là ${localSelectedVoice.name}. Tôi sẽ hướng dẫn bạn trong quá trình thi lái xe. Chúc bạn thi thành công!`
      )
      
      // Force Vietnamese language
      utterance.lang = 'vi-VN'
      
      // Use the SAME BEST voice for Vietnamese (no English accent)
      const voices = speechSynthesis.getVoices()
      
      const bestVietnameseVoice = 
        // Priority 1: Real Vietnamese voice
        voices.find(v => v.lang.toLowerCase().startsWith('vi-')) ||
        voices.find(v => v.lang.toLowerCase() === 'vi') ||
        
        // Priority 2: High-quality neural voices
        voices.find(v => v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('female')) ||
        voices.find(v => v.name.toLowerCase().includes('microsoft') && v.name.toLowerCase().includes('female')) ||
        
        // Priority 3: Known multilingual voices
        voices.find(v => v.name.toLowerCase().includes('samantha')) ||
        voices.find(v => v.name.toLowerCase().includes('karen')) ||
        
        // Fallback: any female voice
        voices.find(v => !v.name.toLowerCase().includes('male')) ||
        voices[0]
      
      if (bestVietnameseVoice) {
        utterance.voice = bestVietnameseVoice
        console.log(`🇻🇳 CONSISTENT BASE for "${localSelectedVoice.name}":`, bestVietnameseVoice.name, `(${bestVietnameseVoice.lang})`)
      } else {
        console.warn('⚠️ No suitable voice found!')
      }
      
      // Use CURRENT slider values for real-time testing
      utterance.rate = contextRate
      utterance.pitch = contextPitch
      utterance.volume = contextVolume
      
      console.log(`🎵 LIVE Voice settings - Rate: ${contextRate}, Pitch: ${contextPitch}, Volume: ${contextVolume}`)
      
      utterance.onend = () => setIsTesting(false)
      utterance.onerror = () => setIsTesting(false)
      
      speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Voice test error:', error)
      setIsTesting(false)
    }
  }

  // Save settings
  const saveSettings = () => {
    const settings = {
      isEnabled: voiceEnabled,
      selectedVoice: localSelectedVoice,
      rate: contextRate,
      pitch: contextPitch,
      volume: contextVolume
    }
    
    // Save to localStorage
    localStorage.setItem('driving_test_voice_settings', JSON.stringify(settings))
    
    // IMMEDIATELY update VoiceContext with current settings
    const voices = speechSynthesis.getVoices()
    const bestVietnameseVoice = 
      voices.find(v => v.lang.toLowerCase().startsWith('vi-')) ||
      voices.find(v => v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('female')) ||
      voices.find(v => v.name.toLowerCase().includes('samantha')) ||
      voices.find(v => !v.name.toLowerCase().includes('male')) ||
      voices[0]
    
    const updatedVoice = {
      ...localSelectedVoice,
      lang: 'vi-VN',
      _originalVoice: bestVietnameseVoice,
      _customPitch: contextPitch,
      _customRate: contextRate
    }
    
    // Update VoiceContext immediately
    setContextVoice(updatedVoice)
    console.log('💾 APPLIED settings - Voice:', localSelectedVoice.name, 'Rate:', contextRate, 'Pitch:', contextPitch)
    console.log('🔄 VoiceContext will use these settings on next speech')
    
    // Show success message
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Quay lại</span>
            </button>
            <div className="flex items-center space-x-2">
              <Volume2 className="w-6 h-6 text-red-600" />
              <h1 className="text-xl font-bold text-gray-800">Giọng nói</h1>
            </div>
            <div className="w-20"></div>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <Check className="w-5 h-5" />
              <span>Đã lưu cài đặt thành công!</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {voiceEnabled ? <Volume2 className="w-5 h-5 text-green-600" /> : <VolumeX className="w-5 h-5 text-red-600" />}
                  <div>
                    <h3 className="font-semibold text-gray-800">Bật giọng đọc</h3>
                    <p className="text-sm text-gray-600">Đọc tên bài thi và hướng dẫn</p>
                  </div>
                </div>
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    voiceEnabled ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      voiceEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {voiceEnabled && (
              <>
                {/* Voice Selection */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <span>🇻🇳 Chọn giọng nữ Việt Nam</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                    {vietnameseVoices.map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => setLocalSelectedVoice(voice)}
                        className={`text-left p-3 rounded-lg border transition-colors ${
                          localSelectedVoice?.id === voice.id
                            ? 'bg-red-50 border-red-300 text-red-800'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium">{voice.name}</div>
                        <div className="text-sm text-gray-600">{voice.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice Controls */}
                <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
                  <h3 className="font-semibold text-gray-800">Điều chỉnh giọng nói</h3>
                  
                  {/* Speed */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tốc độ nói: {contextRate.toFixed(1)}x
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Chậm</span>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={contextRate}
                        onChange={(e) => setContextRate(parseFloat(e.target.value))}
                        className="flex-1 accent-red-500"
                      />
                      <span className="text-xs text-gray-500">Nhanh</span>
                    </div>
                  </div>

                  {/* Pitch */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Độ cao giọng: {contextPitch.toFixed(1)}
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Thấp</span>
                      <input
                        type="range"
                        min="0.8"
                        max="1.8"
                        step="0.1"
                        value={contextPitch}
                        onChange={(e) => setContextPitch(parseFloat(e.target.value))}
                        className="flex-1 accent-red-500"
                      />
                      <span className="text-xs text-gray-500">Cao</span>
                    </div>
                  </div>

                  {/* Volume */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Âm lượng: {Math.round(contextVolume * 100)}%
                    </label>
                    <div className="flex items-center space-x-2">
                      <VolumeX className="w-4 h-4 text-gray-400" />
                      <input
                        type="range"
                        min="0.3"
                        max="1"
                        step="0.1"
                        value={contextVolume}
                        onChange={(e) => setContextVolume(parseFloat(e.target.value))}
                        className="flex-1 accent-red-500"
                      />
                      <Volume2 className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Test Button */}
                  <button
                    onClick={testVoice}
                    disabled={isTesting}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    <span>{isTesting ? 'Đang test...' : `Test giọng ${localSelectedVoice?.name || ''}`}</span>
                  </button>

                  {/* Apply Button */}
                  <button
                    onClick={saveSettings}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-red-600 hover:to-pink-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Áp dụng cài đặt</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Info */}
          {/* <div className="mt-6 bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600 text-center">
              🇻🇳 Chỉ sử dụng giọng nữ Việt Nam chất lượng cao
            </p>
          </div> */}
        </div>
      </div>
    </Layout>
  )
}

export default VoiceSettingsPage
