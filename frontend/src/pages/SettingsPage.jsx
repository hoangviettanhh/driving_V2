import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Volume2, ChevronRight, Settings, ArrowLeft, Users, Shield, Music } from 'lucide-react'
import Layout from '../components/Layout/Layout'
import { useAuth } from '../contexts/AuthContext'


const SettingsPage = () => {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const settingsMenuItems = [
    {
      id: 'voice-settings',
      title: 'Cài đặt giọng nói',
      description: 'Chọn giọng nữ Việt Nam và tốc độ đọc',
      icon: Volume2,
      path: '/settings/voice',
      color: 'from-red-500 to-pink-600',
      showForAll: true
    },
    ...(isAdmin ? [{
      id: 'user-management',
      title: 'Quản lý người dùng',
      description: 'Quản lý tài khoản giáo viên và theo dõi hoạt động',
      icon: Users,
      path: '/settings/users',
      color: 'from-purple-500 to-indigo-600',
      adminOnly: true
    }] : [])
  ]

  const handleMenuClick = (item) => {
    navigate(item.path)
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 pb-20">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Quay lại</span>
            </button>
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Cài đặt</h1>
            </div>
            <div className="w-16 sm:w-20"></div> {/* Spacer for centering */}
          </div>

          {/* Settings Menu */}
          <div className="space-y-3 sm:space-y-4">
            {settingsMenuItems.map((item) => {
              const IconComponent = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item)}
                  className="w-full bg-white rounded-lg sm:rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-200 active:scale-95"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      {/* Icon with gradient background */}
                      <div className={`p-2 sm:p-3 rounded-lg bg-gradient-to-r ${item.color} flex-shrink-0`}>
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      
                      {/* Menu info */}
                      <div className="text-left flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate">{item.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              )
            })}
          </div>



          {/* Footer info */}
          <div className="mt-6 sm:mt-8 text-center">
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-600">
                🇻🇳 Ứng dụng chấm điểm thi lái xe
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Phiên bản 2.0 - Dành cho giáo viên
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SettingsPage
