import React, { useState, useEffect } from 'react'
import { AlertTriangle, Square, CheckSquare } from 'lucide-react'
import EmergencySound from './EmergencySound'
import { useTestSession } from '../contexts/TestSessionContext'
import { useVoice } from '../contexts/VoiceContext'

const EmergencyTest = ({ onComplete, onError }) => {
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [soundPlaying, setSoundPlaying] = useState(false)
  const [testPhase, setTestPhase] = useState('waiting') // waiting, active, completed
  const [testCompleted, setTestCompleted] = useState(false)
  
  const { recordError } = useTestSession()
  const { speak } = useVoice()

  useEffect(() => {
    // Auto-start emergency test
    setTestPhase('active')
    speak('Tình huống khẩn cấp! Bấm nút khẩn cấp')
  }, [speak])

  const handleEmergencyButton = () => {
    if (!emergencyActive && !testCompleted) {
      setEmergencyActive(true)
      setSoundPlaying(true)
      console.log('🚨 Emergency button activated')
    }
  }

  const handleSoundComplete = () => {
    setSoundPlaying(false)
    setTestCompleted(true)
    setTestPhase('completed')
    console.log('🔊 Emergency sound completed - test successful!')
    
    // Just complete the test without points
    speak('Tình huống khẩn cấp đã xử lý xong')
    setTimeout(() => {
      onComplete && onComplete(0) // No points change
    }, 2000)
  }

  // Handle timeout - if user doesn't press emergency button in time
  useEffect(() => {
    if (testPhase === 'active' && !testCompleted) {
      const timeout = setTimeout(() => {
        if (!emergencyActive) {
          console.log('🚨 Emergency test failed - timeout')
          speak('Hết thời gian xử lý tình huống khẩn cấp')
          setTimeout(() => {
            onComplete && onComplete(0) // No points change
          }, 2000)
        }
      }, 10000) // 10 seconds timeout

      return () => clearTimeout(timeout)
    }
  }, [testPhase, testCompleted, emergencyActive, speak, recordError, onComplete])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-red-600 text-white p-4 rounded-t-lg text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <h2 className="text-xl font-bold">Tình Huống Khẩn Cấp</h2>
          <p className="text-sm opacity-90">Xử lý tình huống khẩn cấp trên đường</p>
        </div>

        {/* Sound Component */}
        <div className="bg-white p-4 border-x border-gray-200">
          <EmergencySound 
            isPlaying={soundPlaying} 
            onComplete={handleSoundComplete}
          />
        </div>

        {/* Control Panel */}
        <div className="bg-white p-6 border-x border-gray-200 space-y-4">
          {/* Emergency Button */}
          <div className="text-center">
            <button
              onClick={handleEmergencyButton}
              disabled={testCompleted}
              className={`w-40 h-40 rounded-full text-white font-bold text-xl transition-all duration-200 ${
                testCompleted 
                  ? 'bg-green-600 cursor-not-allowed' 
                  : emergencyActive 
                    ? 'bg-red-600 shadow-lg animate-pulse cursor-not-allowed' 
                    : 'bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {testCompleted ? '✅ HOÀN THÀNH' : emergencyActive ? '🚨 ĐANG HÚ' : '🚨 KHẨN CẤP'}
            </button>
            <p className="text-sm text-gray-600 mt-3">
              {testCompleted ? 'Tình huống đã xử lý thành công!' : 
               emergencyActive ? 'Đang phát tín hiệu khẩn cấp...' : 
               'Bấm ngay khi có tình huống khẩn cấp'}
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 p-4 border-x border-gray-200">
          <h3 className="font-medium text-yellow-800 mb-2">Hướng dẫn:</h3>
          <div className="text-sm text-yellow-700">
            <p className="font-medium">Khi có tình huống khẩn cấp:</p>
            <p>• Bấm nút KHẨN CẤP ngay lập tức</p>
            <p>• Hệ thống sẽ tự động phát tín hiệu cảnh báo</p>
            <p>• Sau khi hết tiếng hú sẽ có tiếng tít kết thúc</p>
          </div>
        </div>

        {/* Status Display */}
        {testCompleted && (
          <div className="bg-green-50 p-4 border-x border-gray-200">
            <div className="text-center">
              <div className="text-green-600 text-2xl mb-2">✅</div>
              <h3 className="font-medium text-green-800">Đã hoàn thành!</h3>
              <p className="text-sm text-green-700">Tình huống khẩn cấp đã xử lý</p>
            </div>
          </div>
        )}

        {/* Auto Complete */}
        <div className="bg-white p-4 rounded-b-lg border border-gray-200">
          <div className="text-center">
            {testCompleted ? (
              <div className="text-green-600 font-medium">
                ✅ Tự động chuyển sang bài tiếp theo...
              </div>
            ) : (
              <div className="text-gray-600 text-sm">
                ⏱️ Thời gian xử lý: 10 giây
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmergencyTest
