import React, { useState } from 'react'
import { useVoice } from '../contexts/VoiceContext'

const VoiceTestComponent = () => {
  const { voices, selectedVoice, setSelectedVoice, speak, rate, setRate } = useVoice()
  const [testText] = useState('Xin chào! Tôi là giọng đọc của ứng dụng thi lái xe. Bạn có thích giọng này không?')

  const handleVoiceChange = (voiceIndex) => {
    const voice = voices[voiceIndex]
    setSelectedVoice(voice)
    console.log('🎤 Changed to voice:', voice.name, voice.lang)
  }

  const handleTestSpeak = () => {
    speak(testText)
  }

  const handleRateChange = (newRate) => {
    setRate(newRate)
  }

  // Filter for female voices
  const femaleVoices = voices.filter(voice => 
    voice.name.toLowerCase().includes('female') || 
    voice.name.toLowerCase().includes('woman') ||
    voice.name.toLowerCase().includes('zira') ||
    voice.name.toLowerCase().includes('hazel') ||
    voice.name.toLowerCase().includes('samantha') ||
    voice.name.toLowerCase().includes('anna') ||
    voice.name.toLowerCase().includes('karen') ||
    voice.name.toLowerCase().includes('tessa') ||
    voice.name.toLowerCase().includes('susan') ||
    voice.name.toLowerCase().includes('allison') ||
    voice.lang.startsWith('vi')
  )

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">🎤 Voice Settings</h3>
      
      {/* Current Voice Info */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <strong>Current Voice:</strong> {selectedVoice?.name || 'None'} ({selectedVoice?.lang})
        <br />
        <strong>Speed:</strong> {rate}x
      </div>

      {/* Speed Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Speech Speed:</label>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleRateChange(0.8)}
            className={`px-3 py-1 rounded ${rate === 0.8 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Slow (0.8x)
          </button>
          <button 
            onClick={() => handleRateChange(1.0)}
            className={`px-3 py-1 rounded ${rate === 1.0 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Normal (1.0x)
          </button>
          <button 
            onClick={() => handleRateChange(1.1)}
            className={`px-3 py-1 rounded ${rate === 1.1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Fast (1.1x)
          </button>
          <button 
            onClick={() => handleRateChange(1.3)}
            className={`px-3 py-1 rounded ${rate === 1.3 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Faster (1.3x)
          </button>
        </div>
      </div>

      {/* Test Button */}
      <button 
        onClick={handleTestSpeak}
        className="w-full mb-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
      >
        🔊 Test Current Voice
      </button>

      {/* Voice Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Available Female Voices ({femaleVoices.length}):
        </label>
        <div className="max-h-40 overflow-y-auto space-y-2">
          {femaleVoices.map((voice, index) => {
            const originalIndex = voices.indexOf(voice)
            const isSelected = selectedVoice?.name === voice.name
            
            return (
              <div
                key={originalIndex}
                className={`p-2 border rounded cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-blue-100 border-blue-500' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => handleVoiceChange(originalIndex)}
              >
                <div className="font-medium">{voice.name}</div>
                <div className="text-sm text-gray-600">
                  {voice.lang} • {voice.localService ? 'Local' : 'Online'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* All Voices (for debugging) */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-600">
          Show All Voices ({voices.length})
        </summary>
        <div className="mt-2 max-h-32 overflow-y-auto text-xs space-y-1">
          {voices.map((voice, index) => (
            <div key={index} className="p-1 bg-gray-50 rounded">
              {voice.name} ({voice.lang}) - {voice.localService ? 'Local' : 'Online'}
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}

export default VoiceTestComponent