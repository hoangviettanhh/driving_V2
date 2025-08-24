/**
 * Audio Manager - Quản lý âm thanh cho ứng dụng thi lái xe
 * Sử dụng file âm thanh từ APK thay cho Text-to-Speech
 */

class AudioManager {
  constructor() {
    this.isEnabled = true
    this.volume = 0.9
    this.currentAudio = null
    
    // Mapping các file âm thanh với nội dung - CORRECTED MAPPING
    this.audioFiles = {
      // Bài thi theo nội dung thực tế của file âm thanh
      lessonStart: '0002.mp3',        // Bắt đầu thi
      lesson1: '1.mp3.mp3',           // Xuất phát  
      lesson2: '3.mp3.mp3',           // Dừng xe nhường đường cho người đi bộ
      lesson3: '4.mp3.mp3',           // Dừng và khởi hành ngang dốc
      lesson4: 'vbxvvg.mp3',          // Qua vệt bánh xe (vượt biển xanh vào vùng cấm)
      lesson5: '7.mp3.mp3',           // Qua ngã tư có tín hiệu giao thông
      lesson6: '6.mp3.mp3',           // Đường vòng quanh co (chữ S)
      lesson7: '8.mp3.mp3',           // Ghép xe dọc vào nơi đỗ
      lesson8: '16.mp3.mp3',          // Tạm dừng đường sắt
      lesson9: '11.mp3.mp3',          // Thay đổi số trên đường thẳng  
      lesson10: '12.mp3.mp3',         // Ghép xe ngang
      lesson11: '13.mp3.mp3',         // Kết thúc
      
      // Âm thanh đặc biệt
      testBeep: '5.mp3.mp3',          // Tiếng tút nhận bài thi
      alertSound: '0011.mp3',         // Tiếng tỉnh táo nhận bạn
      
      // Âm thanh lỗi và cảnh báo - UPDATED MAPPING theo database mới
      emergency: 'khancap.mp3',           // Chứa tiếng HÚ
      
      // Lỗi vị trí - có file âm thanh tương ứng
      'Dừng xe chưa đến vị trí': 'dungxechuaden.mp3',
      'Dừng xe chưa đúng vị trí': 'use_ai_voice', // Bài 8 - Use AI voice to avoid confusion
      'Ghép xe chưa đúng vị trí': 'chuadungvitri.mp3', // Bài 7, 10 - File này nói "ghép xe"
      
      // Lỗi bánh xe - có file âm thanh tương ứng  
      'Bánh xe đè vạch': '9.mp3.mp3',           // File riêng cho lỗi bánh xe đè vạch
      'Bánh xe đèv vạch': '9.mp3.mp3',          // Typo trong database bài 10
      'Bánh xe không đi vô vệt bánh xe': 'use_ai_voice', // Use AI voice for this error
      
      // Lỗi cụ thể có file âm thanh - UPDATED theo database mới
      'Xe bị chết máy': '0005.mp3',               // Bài 3 - Dừng xe khởi hành ngang dốc  
      'Không đạt tốc độ': '19.mp3.mp3',          // Bài 9 - Tăng tốc đường bằng
      
      // Âm thanh thông báo kết quả
      'testPassed': '0013.mp3',          // Bạn đã thi đạt
      'testCompleted': '13.mp3.mp3',     // Bài thi kết thúc
      
      // Backward compatibility - các key cũ
      wrongPosition: 'chuadungvitri.mp3',
      notReachedYet: 'dungxechuaden.mp3', 
      passPosition: 'quavitri.mp3',
      wrongGear: 'vaobailkhongdungso.mp3',
      violation: '9.mp3.mp3', // Changed to use correct file for violations
      
      // Âm thanh bổ sung
      error0004: '0004.mp3',
      error0005: '0005.mp3',
      error0006: '0006.mp3',
      error0007: '0007.mp3',
      error0008: '0008.mp3',
      error0009: '0009.mp3',
      error0012: '0012.mp3',
      error0013: '0013.mp3',
      error0016: '0016.mp3',
      error0019: '0019.mp3'
    }
    
    // Load settings từ localStorage
    this.loadSettings()
  }
  
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('driving_test_audio_settings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        this.isEnabled = settings.isEnabled ?? true
        this.volume = settings.volume ?? 0.9
      }
    } catch (error) {
      console.error('Error loading audio settings:', error)
    }
  }
  
  saveSettings() {
    try {
      const settings = {
        isEnabled: this.isEnabled,
        volume: this.volume
      }
      localStorage.setItem('driving_test_audio_settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving audio settings:', error)
    }
  }
  
  /**
   * Phát âm thanh theo key
   * @param {string} key - Key của file âm thanh
   * @param {object} options - Tùy chọn phát âm thanh
   */
  async play(key, options = {}) {
    if (!this.isEnabled) {
      return Promise.resolve()
    }
    
    const filename = this.audioFiles[key]
    
    if (!filename) {
      return Promise.resolve()
    }
    
    // Special handling for AI voice fallback
    if (filename === 'use_ai_voice') {
      return Promise.resolve() // Let TTS handle this
    }
    
    return new Promise((resolve, reject) => {
      try {
        // SPECIAL HANDLING for emergency audio - DO NOT stop current audio if it's the same emergency file
        if (key === 'emergency' && this.currentAudio && !this.currentAudio.paused) {
          const currentSrc = this.currentAudio.src
          const newAudioUrl = `/audio/${filename}`
          if (currentSrc.includes(filename)) {
            // Wait for current emergency audio to end naturally
            this.currentAudio.onended = () => {
              this.currentAudio = null
              resolve()
            }
            return
          }
        }
        
        // For non-emergency or different files, stop current audio
        if (this.currentAudio && key !== 'emergency') {
          this.currentAudio.pause()
          this.currentAudio.currentTime = 0
          this.currentAudio = null
        }
        
        // Tạo Audio object mới
        const audioUrl = `/audio/${filename}`
        
        this.currentAudio = new Audio(audioUrl)
        this.currentAudio.volume = options.volume ?? this.volume
        this.currentAudio.preload = 'auto'
        
        // CRITICAL: Ensure audio does NOT loop
        this.currentAudio.loop = false
        this.currentAudio.autoplay = false
        
        // Event handlers
        this.currentAudio.onended = () => {
          // DO NOT force stop here - audio ended naturally
          this.currentAudio = null
          resolve()
        }
        
        this.currentAudio.onerror = (error) => {
          console.error(`❌ Error playing audio ${filename}:`, error)
          console.error(`🔍 Audio URL: ${audioUrl}`)
          if (this.currentAudio) {
            this.currentAudio = null
          }
          resolve() // Resolve thay vì reject để không break app
        }
        
        this.currentAudio.oncanplaythrough = () => {
          // Check if currentAudio still exists before calling play
          if (this.currentAudio) {
            this.currentAudio.play().then(() => {
            }).catch(error => {
              console.error(`❌ Failed to play audio ${filename}:`, error)
              if (this.currentAudio) {
                this.currentAudio = null
              }
              resolve()
            })
          } else {
            console.warn(`⚠️ Audio object became null before play for: ${filename}`)
            resolve()
          }
        }
        
        this.currentAudio.onloadstart = () => {
        }
        
        this.currentAudio.onloadeddata = () => {
        }
        
        // Load audio
        this.currentAudio.load()
        
      } catch (error) {
        console.error(`Audio playback error for ${key}:`, error)
        resolve()
      }
    })
  }
  
  /**
   * Dừng âm thanh hiện tại
   */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio.loop = false // Ensure no loop
      this.currentAudio = null
    }
  }
  
  /**
   * Tạm dừng âm thanh
   */
  pause() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause()
    }
  }
  
  /**
   * Tiếp tục phát âm thanh
   */
  resume() {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(console.error)
    }
  }
  
  /**
   * Bật/tắt âm thanh
   */
  toggleEnabled() {
    this.isEnabled = !this.isEnabled
    if (!this.isEnabled) {
      this.stop()
    }
    this.saveSettings()
    return this.isEnabled
  }
  
  /**
   * Đặt âm lượng
   * @param {number} volume - Âm lượng từ 0 đến 1
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume
    }
    this.saveSettings()
  }
  
  /**
   * Kiểm tra xem có đang phát âm thanh không
   */
  isPlaying() {
    return this.currentAudio && !this.currentAudio.paused
  }
  
  // === Phương thức tiện ích cho ứng dụng ===
  
  /**
   * Phát âm thanh bài thi
   * @param {number} lessonNumber - Số bài thi (1-11)
   */
  async playLesson(lessonNumber) {
    const key = `lesson${lessonNumber}`
    return this.play(key)
  }
  
  /**
   * Phát âm thanh bắt đầu thi
   */
  async playTestStart() {
    return this.play('lessonStart')
  }
  
  /**
   * Phát tiếng tút nhận bài thi
   */
  async playTestBeep() {
    return this.play('testBeep')
  }
  
  /**
   * Phát âm thanh lỗi - UPDATED để support tên lỗi trực tiếp từ database
   * @param {string} errorType - Loại lỗi hoặc tên lỗi từ database
   */
  async playError(errorType) {
    
    // Thử tìm âm thanh trực tiếp bằng tên lỗi từ database
    if (this.audioFiles[errorType]) {
      return this.play(errorType)
    }
    
    // Fallback mapping cho các key cũ
    const errorMap = {
      'wrong_position': 'wrongPosition',
      'not_reached': 'notReachedYet',
      'wrong_gear': 'wrongGear',
      'violation': 'violation',
      'emergency': 'emergency'
    }
    
    const key = errorMap[errorType] || errorType
    return this.play(key)
  }
  
  /**
   * Phát âm thanh khẩn cấp
   */
  async playEmergency() {
    return this.play('emergency', { volume: 1.0 })
  }
  
  /**
   * Phát tiếng tỉnh táo nhận bạn
   */
  async playAlertSound() {
    return this.play('alertSound', { volume: 1.0 })
  }
  
  /**
   * Phát âm thanh thông báo thi đạt
   */
  async playTestPassed() {
    return this.play('testPassed', { volume: 1.0 })
  }
  
  /**
   * Phát âm thanh bài thi kết thúc
   */
  async playTestCompleted() {
    return this.play('testCompleted', { volume: 1.0 })
  }
  
  /**
   * Test âm thanh
   * @param {string} key - Key để test
   */
  async testAudio(key) {
    return this.play(key)
  }
}

// Tạo instance duy nhất
const audioManager = new AudioManager()

// Expose to window for VoiceContext to avoid circular dependency
if (typeof window !== 'undefined') {
  window.__audioManager = audioManager
}

export default audioManager
